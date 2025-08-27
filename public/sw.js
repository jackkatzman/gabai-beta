const CACHE_NAME = 'gabai-v1.2.0-force-clear';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event - SKIP WAITING TO FORCE UPDATE
self.addEventListener('install', (event) => {
  console.log('SW: Installing new version, skipping wait');
  self.skipWaiting(); // Force immediate activation
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - FORCE CLEAR ALL CACHES
self.addEventListener('activate', (event) => {
  console.log('SW: Force clearing all caches to fix domain issue');
  event.waitUntil(
    Promise.all([
      // Clear ALL caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('SW: Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Push notification support
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from GabAi',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open GabAi',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('GabAi', options)
  );
});