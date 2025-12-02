const CACHE_NAME = 'kitchen-os-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate the SW
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Listen for requests
self.addEventListener('fetch', (event) => {
  // Exclude Firebase/API requests from cache to ensure real-time data
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('identitytoolkit') ||
      event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  // SPA Navigation Handler: If it's a navigation request (HTML), serve index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((response) => {
        return response || fetch(event.request);
      }).catch(() => {
        return fetch(event.request);
      })
    );
    return;
  }

  // Standard Cache-First Strategy for assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});