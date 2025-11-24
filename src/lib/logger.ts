// src/lib/logger.ts
// Enhanced logger utility with production error tracking
// Integrates with loggingService for Supabase logging

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.PROD;

// Lazy load logging service to avoid circular dependencies
let loggingService: any = null;
const getLoggingService = async () => {
  if (!loggingService && isProduction) {
    try {
      const module = await import('@/services/loggingService');
      loggingService = module.loggingService;
    } catch (err) {
      // Fallback if service not available
      console.warn('Logging service not available:', err);
    }
  }
  return loggingService;
};

// Helper to safely stringify objects
const stringify = (data: any): string => {
  try {
    if (typeof data === 'string') return data;
    if (data instanceof Error) return `${data.name}: ${data.message}\n${data.stack}`;
    return JSON.stringify(data, null, 2);
  } catch (err) {
    return String(data);
  }
};

export const logger = {
  // Regular logs only in development
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // Info logs only in development
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  // Warnings - always logged to console, tracked in production
  warn: async (...args: any[]) => {
    console.warn(...args);

    if (isProduction) {
      try {
        const service = await getLoggingService();
        if (service) {
          await service.logSystem({
            log_level: 'warn',
            log_type: 'error',
            action: 'warning',
            success: false,
            error_message: args.map(stringify).join(' '),
            metadata: { timestamp: new Date().toISOString() },
          });
        }
      } catch (err) {
        // Fail silently in production logging
      }
    }
  },

  // Errors - always logged and tracked
  error: async (...args: any[]) => {
    console.error(...args);

    if (isProduction) {
      try {
        const service = await getLoggingService();
        if (service) {
          const errorMessage = args.map(stringify).join(' ');
          const error = args.find(arg => arg instanceof Error);

          await service.logError({
            error_type: error?.name || 'Error',
            error_message: errorMessage,
            stack_trace: error?.stack,
            severity: 'high',
          });
        }
      } catch (err) {
        // Fail silently in production logging
      }
    }
  },

  // Debug logs only in development
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  // Table logs only in development
  table: (data: any) => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  // Group logs only in development
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  // Performance timing (development only)
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },

  // Success logs (custom, always in dev, tracked in prod)
  success: async (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data || '');
    }

    if (isProduction && data) {
      try {
        const service = await getLoggingService();
        if (service) {
          await service.logSystem({
            log_level: 'info',
            log_type: 'api_call',
            action: message,
            success: true,
            metadata: data,
          });
        }
      } catch (err) {
        // Fail silently
      }
    }
  },
};

// Usage examples:
// import { logger } from '@/lib/logger';
// logger.log('Development only');
// logger.error('Always logged + tracked in production');
// logger.warn('Warning with tracking');
// logger.success('Operation completed', { orderId: '123' });
// logger.time('api-call'); ... logger.timeEnd('api-call');
