// Service worker disabled for cache clearing
const CACHE_NAME = 'ekhasi-v3-no-cache';

// Install and skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate and clear all caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Don't cache anything - fetch directly
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
