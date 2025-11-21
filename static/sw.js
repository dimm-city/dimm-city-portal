// Dimm City Portal Service Worker
// Provides offline support and caching for better mobile experience

const CACHE_NAME = 'dimm-city-v1';
const urlsToCache = [
  '/',
  '/assets/dc-logo.webp',
  '/assets/the-dark.webp',
  '/favicon.png'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Skip WebSocket and Socket.IO requests
  if (event.request.url.includes('socket.io') || event.request.url.startsWith('ws')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache successful GET requests
            if (event.request.method === 'GET' && fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return fetchResponse;
          });
      })
      .catch(() => {
        // Return offline page if available
        return caches.match('/');
      })
  );
});

console.log('[Service Worker] Loaded');
