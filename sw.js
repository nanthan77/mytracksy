// MyTracksy Production Service Worker for PWA
const CACHE_NAME = 'mytracksy-v1.0.0';
const RUNTIME_CACHE = 'mytracksy-runtime-v1.0.0';
const DATA_CACHE = 'mytracksy-data-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Comprehensive assets to cache for offline use
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/app.js',
  '/index.css',
  '/user-profile.html',
  '/company-profile.html',
  '/individual-dashboard.html',
  '/marketing-dashboard.html',
  '/advanced-analytics-dashboard.html',
  '/government-filing-dashboard.html',
  '/employee-management-system.html',
  '/sri-lanka-tax-engine.js',
  '/advanced-analytics-engine.js',
  '/performance-optimization.js',
  '/behavioral-engagement-system.js',
  '/government-portal-integration.js',
  '/mobile-app-foundation.js',
  '/deployment-config.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// API endpoints that should work offline
const OFFLINE_ENDPOINTS = [
  '/api/expenses',
  '/api/budgets',
  '/api/companies',
  '/api/sync'
];

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell and essential assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Failed to cache assets:', error);
      })
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event Handler - Network First with Offline Fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle other requests (assets, etc.)
  event.respondWith(handleAssetRequest(request));
});

/**
 * Handle API requests with offline queue
 */
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('[SW] Network failed for API request, checking cache...');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for specific endpoints
    if (isOfflineEndpoint(request.url)) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline',
          message: 'Request queued for sync when online',
          offline: true 
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

/**
 * Handle navigation requests
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
    
  } catch (error) {
    console.log('[SW] Network failed for navigation, serving cached app...');
    
    // Serve cached app
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/index.html');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    return cache.match(OFFLINE_URL);
  }
}

/**
 * Handle asset requests
 */
async function handleAssetRequest(request) {
  // Cache first for assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache the response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] Failed to fetch asset:', request.url);
    throw error;
  }
}

/**
 * Background Sync for Expense Synchronization
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'tracksy-expense-sync') {
    event.waitUntil(syncExpenses());
  }
});

/**
 * Sync pending expenses when online
 */
async function syncExpenses() {
  try {
    console.log('[SW] Starting background expense sync...');
    
    // Get pending sync items from IndexedDB
    const pendingItems = await getPendingSyncItems();
    
    if (pendingItems.length === 0) {
      console.log('[SW] No pending items to sync');
      return;
    }
    
    console.log(`[SW] Syncing ${pendingItems.length} pending items...`);
    
    for (const item of pendingItems) {
      try {
        await syncItem(item);
        await markItemSynced(item.id);
        console.log(`[SW] Successfully synced item: ${item.id}`);
        
      } catch (error) {
        console.error(`[SW] Failed to sync item ${item.id}:`, error);
        await markItemFailed(item.id, error.message);
      }
    }
    
    // Notify app about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        synced: pendingItems.length
      });
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * Sync individual item
 */
async function syncItem(item) {
  const endpoint = getApiEndpointForAction(item.action);
  const method = getHttpMethodForAction(item.action);
  
  const response = await fetch(endpoint, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item.data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Handle Push Notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  
  const options = {
    title: data.title || 'Tracksy Notification',
    body: data.body || 'You have a new expense notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

/**
 * Handle Notification Clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open app and navigate to relevant section
    event.waitUntil(
      clients.openWindow('/?notification=' + event.notification.data?.id)
    );
  }
});

/**
 * Handle Notification Close
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
  
  // Track notification dismissal
  self.registration.sync.register('notification-dismissed');
});

/**
 * Message Handling from Main App
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    updateCache(event.data.assets);
  }
  
  if (event.data && event.data.type === 'SYNC_REQUEST') {
    self.registration.sync.register('tracksy-expense-sync');
  }
});

// Helper Functions

function isOfflineEndpoint(url) {
  return OFFLINE_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

function getApiEndpointForAction(action) {
  switch (action) {
    case 'create': return '/api/expenses';
    case 'update': return '/api/expenses';
    case 'delete': return '/api/expenses';
    default: return '/api/sync';
  }
}

function getHttpMethodForAction(action) {
  switch (action) {
    case 'create': return 'POST';
    case 'update': return 'PUT';
    case 'delete': return 'DELETE';
    default: return 'POST';
  }
}

async function getPendingSyncItems() {
  // This would connect to IndexedDB to get pending sync items
  // For now, return empty array as this is handled by the main app
  return [];
}

async function markItemSynced(itemId) {
  // Mark item as synced in IndexedDB
  console.log(`[SW] Marking item ${itemId} as synced`);
}

async function markItemFailed(itemId, error) {
  // Mark item as failed in IndexedDB
  console.log(`[SW] Marking item ${itemId} as failed:`, error);
}

async function updateCache(assets) {
  if (!assets || !Array.isArray(assets)) return;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(assets);
    console.log('[SW] Cache updated with new assets');
  } catch (error) {
    console.error('[SW] Failed to update cache:', error);
  }
}

// Periodic Cleanup
self.addEventListener('activate', (event) => {
  // Clean up old data periodically
  setInterval(() => {
    cleanupOldData();
  }, 24 * 60 * 60 * 1000); // Daily cleanup
});

async function cleanupOldData() {
  try {
    console.log('[SW] Performing periodic cleanup...');
    
    // Clean up old cache entries
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    // Remove cache entries older than 7 days
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response && response.headers.get('date')) {
        const responseDate = new Date(response.headers.get('date')).getTime();
        if (responseDate < cutoff) {
          await cache.delete(request);
          console.log('[SW] Cleaned up old cache entry:', request.url);
        }
      }
    }
    
  } catch (error) {
    console.error('[SW] Cleanup failed:', error);
  }
}

console.log('[SW] Service worker script loaded successfully');