/**
 * Sentry Error Tracking & Monitoring
 *
 * Centralized error tracking for production monitoring
 * Updated for @sentry/react v10+ API
 */

import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
const IS_PRODUCTION = APP_ENV === 'production';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  // Only initialize if DSN is configured
  if (!SENTRY_DSN) {
    console.warn('⚠️ Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,

    // Performance monitoring with modern v10+ API
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring - sample 10% of transactions in production
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

    // Session Replay - capture 10% of sessions, 100% on error
    replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,

    // Capture 100% of errors
    sampleRate: 1.0,

    // Ignore common non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'AbortError',
    ],

    // Don't send errors in development
    enabled: IS_PRODUCTION,

    // Release tracking
    release: `eatlocal@${import.meta.env.VITE_APP_VERSION || '2.0.0'}`,

    // User context
    beforeSend(event, hint) {
      // Filter out localhost errors
      if (event.request?.url?.includes('localhost')) {
        return null;
      }

      // Log to console in development
      if (!IS_PRODUCTION) {
        console.error('Sentry Error:', hint.originalException || hint.syntheticException);
      }

      return event;
    },
  });
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Set custom tags
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Track performance
 */
export function startTransaction(name: string, op: string) {
  // Sentry.startTransaction is deprecated, use startInactiveSpan instead
  return Sentry.startInactiveSpan({ name, op });
}

/**
 * Error boundary component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * React profiler for performance tracking
 */
export const SentryProfiler = Sentry.Profiler;
