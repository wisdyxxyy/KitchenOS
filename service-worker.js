const CACHE_NAME = 'kitchen-os-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
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
      caches.match('/index.html').then((response) => {
        // Return cache if found, otherwise fall back to network
        // If network fails (offline), return index.html again (App Shell pattern)
        return response || fetch(event.request).catch(() => caches.match('/index.html'));
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