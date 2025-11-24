import { loggingService } from '@/services/loggingService';
import { ENV } from './environment';
import { logger } from './logger';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class ErrorReporter {
  private static instance: ErrorReporter;

  static getInstance() {
    if (!this.instance) {
      this.instance = new ErrorReporter();
    }
    return this.instance;
  }

  async reportError(error: Error, context: ErrorContext = {}) {
    const severity = this.determineSeverity(error, context);
    
    await loggingService.logError({
      error_type: error.name,
      error_message: error.message,
      stack_trace: error.stack,
      component: context.component,
      severity,
    });

    // In production, could also send to external service (Sentry, etc.)
    if (ENV.isProduction && severity === 'critical') {
      console.error('CRITICAL ERROR:', {
        error: error.message,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private determineSeverity(
    error: Error,
    context: ErrorContext
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Payment errors are critical
    if (context.action?.includes('payment')) {
      return 'critical';
    }

    // Authentication errors are high
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return 'high';
    }

    // Network errors are medium
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'medium';
    }

    // Default to medium
    return 'medium';
  }

  async reportSuccess(action: string, metadata?: Record<string, any>) {
    await logger.success(action, metadata);
  }
}

export const errorReporter = ErrorReporter.getInstance();
