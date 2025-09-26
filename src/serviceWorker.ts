const CACHE_NAME = 'fra-atlas-v1';
const STATIC_CACHE = 'fra-atlas-static-v1';

const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Install service worker
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(urlsToCache);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate service worker
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event handler
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone();
          
          // Cache successful responses
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then((response) => {
      // Return cached version if available
      if (response) {
        return response;
      }

      // Fetch from network
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response.ok) {
          return response;
        }

        // Clone the response
        const responseClone = response.clone();

        // Cache the response
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'claim-submission') {
    event.waitUntil(syncClaimSubmissions());
  }
});

async function syncClaimSubmissions() {
  // Get pending submissions from IndexedDB
  const pendingSubmissions = await getPendingSubmissions();
  
  for (const submission of pendingSubmissions) {
    try {
      const response = await fetch('/api/claims/submit', {
        method: 'POST',
        body: submission.data,
        headers: submission.headers
      });
      
      if (response.ok) {
        // Remove from pending submissions
        await removePendingSubmission(submission.id);
        
        // Notify user of successful sync
        self.registration.showNotification('Claim Submitted', {
          body: 'Your claim has been successfully submitted.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        });
      }
    } catch (error) {
      console.error('Failed to sync claim submission:', error);
    }
  }
}

// Helper functions for IndexedDB operations
async function getPendingSubmissions(): Promise<any[]> {
  return new Promise((resolve) => {
    const request = indexedDB.open('FRAAtlas', 1);
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['pendingSubmissions'], 'readonly');
      const store = transaction.objectStore('pendingSubmissions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

async function removePendingSubmission(id: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.open('FRAAtlas', 1);
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['pendingSubmissions'], 'readwrite');
      const store = transaction.objectStore('pendingSubmissions');
      
      const deleteRequest = store.delete(id);
      deleteRequest.onsuccess = () => resolve();
    };
  });
}

export {};