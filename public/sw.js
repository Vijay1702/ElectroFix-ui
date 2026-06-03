const CACHE_NAME = 'electrofix-pwa-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Ignore WebSocket, chrome extensions, and non-GET requests
  if (
    request.url.startsWith('ws://') || 
    request.url.startsWith('wss://') || 
    !request.url.startsWith(self.location.origin) ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Ignore dev server HMR and hot module updates (Vite)
  if (
    request.url.includes('/@vite/') || 
    request.url.includes('/node_modules/') ||
    request.url.includes('hot-update.json') ||
    request.url.includes('?import')
  ) {
    return;
  }

  // Handle API requests separately (Axios interceptor will handle mock DB)
  if (request.url.includes('/api/')) {
    return;
  }

  // For HTML navigation requests, return index.html (client-side routing fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Stale-While-Revalidate caching strategy for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          // If network fails and we have a cached response, use it
          if (cachedResponse) return cachedResponse;
          throw err;
        });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
