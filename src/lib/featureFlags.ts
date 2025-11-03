import { ENV } from './environment';

export const FEATURE_FLAGS = {
  // Core features
  PAYMENTS_ENABLED: ENV.isProduction || ENV.isStaging,
  REAL_TIME_TRACKING: true,
  
  // Optional features (can disable if issues arise)
  PUSH_NOTIFICATIONS: false, // Enable post-launch
  PROMO_CODES: true,
  LIVE_CHAT_SUPPORT: false, // Enable after launch
  
  // Admin features
  ADMIN_ANALYTICS: true,
  ADMIN_BULK_ACTIONS: ENV.isProduction,
  
  // Performance features
  IMAGE_OPTIMIZATION: true,
  SERVICE_WORKER_CACHE: ENV.isProduction,
  
  // Debug features
  VERBOSE_LOGGING: ENV.isDevelopment,
  ERROR_BOUNDARIES: true,
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}
