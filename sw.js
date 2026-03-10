// MyTracksy Service Worker for PWA functionality
const CACHE_NAME = 'mytracksy-v1.0.0';
const urlsToCache = [
  './mytracksy-pwa.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('MyTracksy Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('MyTracksy Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('MyTracksy Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('MyTracksy Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - Cache First Strategy for static assets, Network First for API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle Firebase API calls - Network First
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If online, update cache and return response
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // If offline, try to get from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle app resources - Cache First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then(fetchResponse => {
            // Add to cache if it's a GET request
            if (event.request.method === 'GET') {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return fetchResponse;
          });
      })
      .catch(() => {
        // If both cache and network fail, return offline page for HTML requests
        if (event.request.headers.get('accept').includes('text/html')) {
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>MyTracksy - Offline</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { 
                  font-family: 'Inter', sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: #f5f5f5; 
                }
                .offline-container {
                  max-width: 400px;
                  margin: 0 auto;
                  background: white;
                  padding: 2rem;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .icon { font-size: 4rem; color: #1976d2; margin-bottom: 1rem; }
                h1 { color: #1976d2; margin-bottom: 1rem; }
                p { color: #666; line-height: 1.6; }
                .retry-btn {
                  background: #1976d2;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 6px;
                  cursor: pointer;
                  margin-top: 1rem;
                  font-size: 16px;
                }
              </style>
            </head>
            <body>
              <div class="offline-container">
                <div class="icon">📱</div>
                <h1>MyTracksy</h1>
                <h2>You're Offline</h2>
                <p>MyTracksy works offline! Your data is saved locally and will sync when you're back online.</p>
                <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
              </div>
            </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
      })
  );
});

// Background Sync for offline data
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncExpenses());
  }
  
  if (event.tag === 'sync-budgets') {
    event.waitUntil(syncBudgets());
  }
});

// Push Notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'You have budget alerts waiting.',
    icon: './icon-192.png',
    badge: './icon-96.png',
    vibrate: [200, 100, 200],
    data: {
      url: './mytracksy-pwa.html#budgets'
    },
    actions: [
      {
        action: 'view',
        title: 'View Budgets',
        icon: './icon-96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: './icon-96.png'
      }
    ],
    requireInteraction: true
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'MyTracksy';
  }
  
  event.waitUntil(
    self.registration.showNotification('MyTracksy Budget Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || './mytracksy-pwa.html')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('./mytracksy-pwa.html')
    );
  }
});

// Sync functions
async function syncExpenses() {
  try {
    console.log('Syncing expenses...');
    
    // Get pending expenses from IndexedDB
    const pendingExpenses = await getIndexedDBData('pendingExpenses');
    
    if (pendingExpenses && pendingExpenses.length > 0) {
      // Send to Firebase when online
      for (const expense of pendingExpenses) {
        await uploadExpenseToFirebase(expense);
      }
      
      // Clear pending expenses after successful sync
      await clearIndexedDBData('pendingExpenses');
      console.log('Expenses synced successfully');
    }
  } catch (error) {
    console.error('Error syncing expenses:', error);
  }
}

async function syncBudgets() {
  try {
    console.log('Syncing budgets...');
    
    // Similar logic for budgets
    const pendingBudgets = await getIndexedDBData('pendingBudgets');
    
    if (pendingBudgets && pendingBudgets.length > 0) {
      for (const budget of pendingBudgets) {
        await uploadBudgetToFirebase(budget);
      }
      
      await clearIndexedDBData('pendingBudgets');
      console.log('Budgets synced successfully');
    }
  } catch (error) {
    console.error('Error syncing budgets:', error);
  }
}

// IndexedDB helper functions
function getIndexedDBData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyTracksyDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

function clearIndexedDBData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyTracksyDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Placeholder functions for Firebase upload (would be implemented with actual Firebase calls)
async function uploadExpenseToFirebase(expense) {
  // Implementation would go here
  console.log('Uploading expense to Firebase:', expense);
}

async function uploadBudgetToFirebase(budget) {
  // Implementation would go here
  console.log('Uploading budget to Firebase:', budget);
}

// Periodic background sync check
self.addEventListener('periodicsync', event => {
  if (event.tag === 'budget-check') {
    event.waitUntil(checkBudgetAlerts());
  }
});

async function checkBudgetAlerts() {
  try {
    // Check budget status and send notifications if needed
    console.log('Checking budget alerts...');
    
    // This would implement actual budget checking logic
    // and send push notifications for budget overruns
  } catch (error) {
    console.error('Error checking budget alerts:', error);
  }
}

console.log('MyTracksy Service Worker loaded successfully');