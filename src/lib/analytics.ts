/**
 * Analytics & Event Tracking
 *
 * Track user interactions, page views, and custom events
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

// Google Analytics
const GA_TRACKING_ID = import.meta.env.VITE_ANALYTICS_ID;
const IS_PRODUCTION = import.meta.env.VITE_APP_ENV === 'production';

interface AnalyticsEvent {
  event_name: string;
  event_category?: string;
  event_label?: string;
  event_value?: number;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  metadata?: Record<string, any>;
}

/**
 * Initialize Google Analytics
 */
export function initAnalytics() {
  if (!GA_TRACKING_ID || !IS_PRODUCTION) {
    logger.info('Analytics disabled (dev mode or no tracking ID)');
    return;
  }

  // Google Analytics is loaded via script tag in index.html
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_TRACKING_ID, {
      send_page_view: true,
    });
  }
}

/**
 * Track page view
 */
export function trackPageView(page_path: string, page_title?: string) {
  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_path,
      page_title: page_title || document.title,
    });
  }

  // Custom analytics to Supabase
  trackEvent({
    event_name: 'page_view',
    event_category: 'navigation',
    page_url: page_path,
    metadata: { page_title },
  });
}

/**
 * Track custom event
 */
export async function trackEvent(event: AnalyticsEvent) {
  try {
    // Get session info
    const sessionId = getSessionId();
    const userId = await getUserId();

    // Track to Supabase for custom analytics
    const { error } = await supabase.from('user_interaction_logs').insert({
      user_id: userId,
      interaction_type: event.event_name,
      page_url: event.page_url || window.location.pathname,
      element_id: event.event_label,
      metadata: {
        category: event.event_category,
        value: event.event_value,
        session_id: sessionId,
        ...event.metadata,
      },
    });

    if (error) {
      logger.error('Failed to track event to database:', error);
    }

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event_name, {
        event_category: event.event_category,
        event_label: event.event_label,
        value: event.event_value,
      });
    }
  } catch (error) {
    logger.error('Analytics tracking error:', error);
  }
}

/**
 * Track user action
 */
export function trackAction(action: string, category: string, label?: string, value?: number) {
  trackEvent({
    event_name: action,
    event_category: category,
    event_label: label,
    event_value: value,
  });
}

/**
 * Track order events
 */
export function trackOrder(orderId: string, total: number, items: number) {
  trackEvent({
    event_name: 'purchase',
    event_category: 'ecommerce',
    event_value: total,
    metadata: {
      order_id: orderId,
      items_count: items,
    },
  });

  // Google Analytics Enhanced Ecommerce
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'purchase', {
      transaction_id: orderId,
      value: total,
      currency: 'ZAR',
      items: items,
    });
  }
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string, results: number) {
  trackEvent({
    event_name: 'search',
    event_category: 'engagement',
    event_label: searchTerm,
    event_value: results,
  });
}

/**
 * Track signup/login
 */
export function trackAuth(action: 'signup' | 'login' | 'logout', method?: string) {
  trackEvent({
    event_name: action,
    event_category: 'authentication',
    event_label: method,
  });
}

/**
 * Track errors
 */
export function trackError(error: Error, context?: string) {
  trackEvent({
    event_name: 'error',
    event_category: 'exceptions',
    event_label: context,
    metadata: {
      error_message: error.message,
      error_stack: error.stack,
    },
  });
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }

  return sessionId;
}

/**
 * Get current user ID
 */
async function getUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('set', 'user_properties', properties);
  }
}

/**
 * Track form submission
 */
export function trackFormSubmit(formName: string, success: boolean) {
  trackEvent({
    event_name: 'form_submit',
    event_category: 'forms',
    event_label: formName,
    event_value: success ? 1 : 0,
  });
}

/**
 * Track button click
 */
export function trackClick(buttonName: string, location?: string) {
  trackEvent({
    event_name: 'button_click',
    event_category: 'engagement',
    event_label: buttonName,
    metadata: { location },
  });
}

/**
 * Track time on page
 */
export function trackTimeOnPage(pagePath: string, seconds: number) {
  trackEvent({
    event_name: 'time_on_page',
    event_category: 'engagement',
    event_label: pagePath,
    event_value: seconds,
  });
}

/**
 * Start timing
 */
export function startTiming(name: string): () => void {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
    trackEvent({
      event_name: 'timing',
      event_category: 'performance',
      event_label: name,
      event_value: duration,
    });
  };
}

export default {
  init: initAnalytics,
  pageView: trackPageView,
  event: trackEvent,
  action: trackAction,
  order: trackOrder,
  search: trackSearch,
  auth: trackAuth,
  error: trackError,
  formSubmit: trackFormSubmit,
  click: trackClick,
  timeOnPage: trackTimeOnPage,
  startTiming,
};
