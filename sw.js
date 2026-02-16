
const CACHE_NAME = 'gestor-pyme-v4';

// 1. App Shell (Archivos locales críticos)
// IMPORTANTE: No incluimos imágenes locales aquí porque ahora usamos URLs externas
const PRECACHE_URLS = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json'
];

// 2. Dominios externos que queremos cachear dinámicamente (CDN, Fuentes, Imágenes)
const EXTERNAL_DOMAINS_TO_CACHE = [
  'esm.sh',
  'cdn.jsdelivr.net',
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com',
  'placehold.co' // Agregamos el proveedor de imágenes
];

// Install: Cachear el App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching App Shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: Limpiar cachés viejas
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

// Fetch: Estrategias de Carga
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. Estrategia: Stale-While-Revalidate
  // Para recursos externos (JS, CSS, Imágenes, Fuentes)
  if (EXTERNAL_DOMAINS_TO_CACHE.some(domain => url.hostname.includes(domain))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const networkFetch = fetch(event.request).then((response) => {
          // Aseguramos que sea una respuesta válida
          if (response && response.status === 200 && (response.type === 'cors' || response.type === 'basic')) {
             cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
           // Fallback silencioso
        });

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // B. Estrategia: Network First (con fallback a Cache)
  // Para el HTML principal y archivos locales JS/TSX/Assets.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
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
          return caches.match(event.request).then((cachedResponse) => {
             if (cachedResponse) {
                 return cachedResponse;
             }
          });
        })
    );
  }
});
