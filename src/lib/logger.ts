// src/lib/logger.ts
// Logger utility that only logs in development mode
// This keeps production clean and improves performance

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  // Regular logs only in development
  log: isDevelopment ? console.log.bind(console) : () => {},
  
  // Info logs only in development
  info: isDevelopment ? console.info.bind(console) : () => {},
  
  // Warnings always logged
  warn: console.warn.bind(console),
  
  // Errors always logged
  error: console.error.bind(console),
  
  // Debug logs only in development
  debug: isDevelopment ? console.debug.bind(console) : () => {},
  
  // Table logs only in development
  table: isDevelopment ? console.table.bind(console) : () => {},
  
  // Group logs only in development
  group: isDevelopment ? console.group.bind(console) : () => {},
  groupEnd: isDevelopment ? console.groupEnd.bind(console) : () => {},
};

// Usage:
// import { logger } from '@/lib/logger';
// logger.log('This only shows in development');
// logger.error('This always shows');
