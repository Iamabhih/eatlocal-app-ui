/**
 * Service Worker Registration
 *
 * Registers the service worker for PWA functionality
 */

import { logger } from './logger';

export async function registerServiceWorker() {
  // Only register in production
  if (import.meta.env.DEV) {
    logger.info('Service worker disabled in development');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    logger.warn('Service workers not supported');
    return null;
  }

  try {
    // Wait for page load
    await new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve(true);
      } else {
        window.addEventListener('load', () => resolve(true));
      }
    });

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    logger.info('Service worker registered:', registration.scope);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            logger.info('New service worker available');

            // Show update notification
            if (window.confirm('A new version is available! Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      }
    });

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      logger.info('Service worker controller changed');
      window.location.reload();
    });

    return registration;
  } catch (error) {
    logger.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker (for debugging)
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      logger.info('Service worker unregistered');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to unregister service worker:', error);
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches() {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    logger.info('All caches cleared');
    return true;
  } catch (error) {
    logger.error('Failed to clear caches:', error);
    return false;
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return !!(navigator.serviceWorker && navigator.serviceWorker.controller);
}

/**
 * Send message to service worker
 */
export function sendMessageToSW(message: any): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}
