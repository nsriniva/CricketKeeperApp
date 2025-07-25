const CACHE_NAME = 'cricket-pro-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', function(event) {
  if (event.tag === 'cricket-data-sync') {
    event.waitUntil(syncCricketData());
  }
});

async function syncCricketData() {
  // Sync any pending data when connection is restored
  try {
    const pendingData = await getStoredPendingData();
    if (pendingData.length > 0) {
      for (const data of pendingData) {
        await fetch(data.url, {
          method: data.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.body)
        });
      }
      await clearStoredPendingData();
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function getStoredPendingData() {
  try {
    return JSON.parse(localStorage.getItem('cricket_app_pending_sync') || '[]');
  } catch {
    return [];
  }
}

async function clearStoredPendingData() {
  localStorage.removeItem('cricket_app_pending_sync');
}
