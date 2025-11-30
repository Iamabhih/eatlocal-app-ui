/**
 * State cleanup utilities for logout and session management
 * Ensures no user data persists across different user sessions
 */

// Centralized localStorage keys used across the app
export const STORAGE_KEYS = {
  // Cart
  CART: 'smash-cart-storage',

  // Favorites
  FAVORITES: 'smash_favorites',

  // Order recovery
  PENDING_ORDERS: 'pending_orders',

  // Payment backups (dynamic key)
  PAYMENT_BACKUP_PREFIX: 'payment_backup_',

  // Language
  LANGUAGE: 'i18nextLng',

  // User preferences
  USER_PREFERENCES: 'user_preferences',

  // Theme
  THEME: 'theme',
} as const;

/**
 * Cleans up all user-specific data from localStorage
 * Called on logout to prevent data leaks between users
 */
export function cleanupLocalStorage(): void {
  // Clear cart
  localStorage.removeItem(STORAGE_KEYS.CART);

  // Clear favorites
  localStorage.removeItem(STORAGE_KEYS.FAVORITES);

  // Clear pending orders
  localStorage.removeItem(STORAGE_KEYS.PENDING_ORDERS);

  // Clear all payment backups (dynamic keys)
  cleanupPaymentBackups();

  // Clear user preferences
  localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);

  // Note: We keep language and theme preferences as they're not user-specific
}

/**
 * Cleans up payment backup entries from localStorage
 * These can accumulate over time if not properly cleaned
 */
export function cleanupPaymentBackups(maxAgeMs?: number): void {
  const keysToRemove: string[] = [];
  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEYS.PAYMENT_BACKUP_PREFIX)) {
      if (maxAgeMs) {
        // Only remove old backups if maxAgeMs is specified
        try {
          const backup = JSON.parse(localStorage.getItem(key) || '{}');
          if (backup.timestamp && now - backup.timestamp > maxAgeMs) {
            keysToRemove.push(key);
          }
        } catch {
          // Invalid JSON, remove it
          keysToRemove.push(key);
        }
      } else {
        // Remove all backups
        keysToRemove.push(key);
      }
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Cleans up old payment backups (older than 24 hours)
 * Called on app initialization
 */
export function cleanupOldPaymentBackups(): void {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  cleanupPaymentBackups(TWENTY_FOUR_HOURS);
}

/**
 * Gets a typed value from localStorage with JSON parsing
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Sets a typed value in localStorage with JSON serialization
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}
