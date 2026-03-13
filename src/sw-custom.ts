/// <reference lib="webworker" />
/**
 * Custom Service Worker — MyTracksy PWA
 *
 * Extends Workbox precache with:
 *  - Offline navigation fallback (SPA)
 *  - Audio upload queue for Voice Vault
 *  - Firestore write queue for offline transactions
 *  - Push notification handling
 *  - Background sync
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// ─── M5: Scope restriction — only handle same-origin + trusted CDN requests ───
const ALLOWED_ORIGINS = [
    self.location.origin,
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
];
const ALLOWED_FIREBASE_PATTERNS = [
    /\.firestore\.googleapis\.com$/,
    /\.firebaseio\.com$/,
];

/** Returns true if the URL is within the service worker's allowed scope */
function isAllowedOrigin(url: URL): boolean {
    if (ALLOWED_ORIGINS.includes(url.origin)) return true;
    return ALLOWED_FIREBASE_PATTERNS.some((p) => p.test(url.hostname));
}

// ─── Precache all build assets (injected by Workbox at build time) ───
const manifest = self.__WB_MANIFEST || [];
precacheAndRoute(manifest);
cleanupOutdatedCaches();

// ─── SPA Navigation Fallback ─────────────────────────────────────
const navigationRoute = new NavigationRoute(
    new NetworkFirst({
        cacheName: 'navigations',
        networkTimeoutSeconds: 3,
    }),
    {
        // Don't intercept API, firebase, or static file requests
        denylist: [/^\/__\//, /\/api\//, /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/],
    }
);
registerRoute(navigationRoute);

// ─── Google Fonts (Cache-First, 1 year) ──────────────────────────
registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
        ],
    })
);

// ─── Firebase/Firestore API (Network-First) ──────────────────────
registerRoute(
    ({ url }) => url.origin.includes('firestore.googleapis.com') || url.origin.includes('firebaseio.com'),
    new NetworkFirst({
        cacheName: 'firebase-api',
        networkTimeoutSeconds: 5,
        plugins: [
            new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }),
        ],
    })
);

// ─── Static Assets (Stale-While-Revalidate) ─────────────────────
registerRoute(
    ({ request }) => request.destination === 'image' || request.destination === 'style' || request.destination === 'script',
    new StaleWhileRevalidate({
        cacheName: 'static-assets',
        plugins: [
            new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }),
        ],
    })
);

// ─── Background Sync for Failed Writes ──────────────────────────
const bgSyncPlugin = new BackgroundSyncPlugin('tracksy-offline-queue', {
    maxRetentionTime: 7 * 24 * 60, // 7 days in minutes
    onSync: async ({ queue }) => {
        let entry;
        while ((entry = await queue.shiftRequest())) {
            try {
                await fetch(entry.request);
                console.log('[SW] Background sync: replayed request', entry.request.url);
            } catch (err) {
                console.error('[SW] Background sync failed, re-queuing', err);
                await queue.unshiftRequest(entry);
                throw err;
            }
        }
    },
});

// Queue failed POST/PUT to Firestore
registerRoute(
    ({ url, request }) =>
        (url.origin.includes('firestore.googleapis.com') || url.origin.includes('firebaseio.com')) &&
        (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH'),
    new NetworkFirst({
        plugins: [bgSyncPlugin],
    }),
    'POST'
);

// ─── Push Notifications ─────────────────────────────────────────
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};

    const options: NotificationOptions = {
        body: data.body || 'New notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: data,
        vibrate: [100, 50, 100],
        actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
        tag: data.tag || 'tracksy-notification',
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'MyTracksy', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view' || !event.action) {
        const urlToOpen = event.notification.data?.url || '/';
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                for (const client of windowClients) {
                    if ('focus' in client) {
                        return client.focus();
                    }
                }
                return self.clients.openWindow(urlToOpen);
            })
        );
    }
});

// ─── Message from Main App ──────────────────────────────────────
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ─── Offline Audio Upload Queue ─────────────────────────────────
// When the app stores audio in IndexedDB while offline,
// the main app posts a SYNC_AUDIO message when back online.
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_AUDIO') {
        console.log('[SW] Received SYNC_AUDIO request');
        // Notify all clients to trigger the firestoreOfflineBridge sync
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({ type: 'TRIGGER_SYNC' });
            });
        });
    }
});

// ─── M5: Global fetch filter — ignore requests outside allowed scope ───
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (!isAllowedOrigin(url)) {
        // Let the browser handle it natively — don't cache or intercept
        return;
    }
});

console.log('[SW] Custom service worker loaded');
