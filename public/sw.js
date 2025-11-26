// Smash Service Worker v4 - Production Ready with Caching
const CACHE_NAME = 'smash-v4';
const STATIC_CACHE = 'smash-static-v4';
const DYNAMIC_CACHE = 'smash-dynamic-v4';
const IMAGE_CACHE = 'smash-images-v4';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network (for static assets)
  cacheFirst: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response('Offline', { status: 503 });
    }
  },

  // Network first, then cache (for dynamic content)
  networkFirst: async (request, cacheName) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response('Offline', { status: 503 });
    }
  },

  // Stale while revalidate (for frequently updated content)
  staleWhileRevalidate: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(() => cachedResponse);

    return cachedResponse || fetchPromise;
  },
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v4...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v4...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('smash-') &&
                     cacheName !== STATIC_CACHE &&
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests except for images
  if (url.origin !== location.origin) {
    // Cache external images (like restaurant images from CDN)
    if (request.destination === 'image') {
      event.respondWith(CACHE_STRATEGIES.cacheFirst(request, IMAGE_CACHE));
    }
    return;
  }

  // API requests - network first
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/functions/')) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Images - cache first
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Static assets (JS, CSS) - stale while revalidate
  if (url.pathname.match(/\.(js|css)$/) || url.pathname.startsWith('/assets/')) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // HTML pages - network first for fresh content
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      CACHE_STRATEGIES.networkFirst(request, DYNAMIC_CACHE)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Default - stale while revalidate
  event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = { title: 'Smash', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.tag || 'smash-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync handler
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

// Sync pending orders
async function syncOrders() {
  try {
    // Get pending orders from IndexedDB and sync
    console.log('[SW] Syncing orders...');
    // Implementation would connect to IndexedDB and sync pending orders
  } catch (error) {
    console.error('[SW] Order sync failed:', error);
  }
}

// Sync cart data
async function syncCart() {
  try {
    console.log('[SW] Syncing cart...');
    // Implementation would sync cart data
  } catch (error) {
    console.error('[SW] Cart sync failed:', error);
  }
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log('[SW] Service worker script loaded');
