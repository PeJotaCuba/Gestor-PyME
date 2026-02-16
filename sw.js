
const CACHE_NAME = 'gestor-pyme-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
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
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First, falling back to Cache
// This strategy is best for apps with dynamic data (like Firebase) to ensure fresh data
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like Firebase or CDNs) for basic caching to avoid CORS issues in simple setup
  if (!event.request.url.startsWith(self.location.origin)) {
     return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network fetch is successful, clone it and store/update in cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});
