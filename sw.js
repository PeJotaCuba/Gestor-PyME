
const CACHE_NAME = 'gestor-pyme-v5';

// 1. App Shell (Archivos locales críticos)
const PRECACHE_URLS = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json'
];

// 2. Dominios externos
const EXTERNAL_DOMAINS_TO_CACHE = [
  'esm.sh',
  'cdn.jsdelivr.net',
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com',
  'ui-avatars.com', // Icon provider
  'dummyimage.com'  // Screenshot provider
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching App Shell');
      return cache.addAll(PRECACHE_URLS);
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
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy A: Stale-While-Revalidate for external resources
  if (EXTERNAL_DOMAINS_TO_CACHE.some(domain => url.hostname.includes(domain))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const networkFetch = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
             cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => null);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // Strategy B: Network First for local content
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});
