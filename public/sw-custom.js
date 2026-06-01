// Custom Service Worker for enhanced offline functionality
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { BackgroundSync } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Offline page navigation fallback
const navigationRoute = new NavigationRoute(
  ({ request }) => {
    // Check if the request is for a page (navigation)
    return request.mode === 'navigate';
  },
  {
    allowlist: [/^\/(?!.*\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)).*$/],
    denylist: [
      /^\/_/,
      /\/[^/?]+\.[^/]+$/,
      /^\/offline\.html$/,
      /^\/api\//,
      /^\/auth\//,
    ],
  }
);

// Register the navigation route with custom handler
registerRoute(navigationRoute, async ({ event }) => {
  try {
    // Try to get the page from the network first
    const response = await fetch(event.request);
    return response;
  } catch {
    // If network fails, try to get from cache
    const cache = await caches.open('pages-cache');
    const cachedResponse = await cache.match('/index.html');

    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cached page, return offline page
    return caches.match('/offline.html');
  }
});

// Background sync for failed API requests
const bgSync = new BackgroundSync('api-sync', {
  maxRetentionTime: 24 * 60, // 24 hours
});

// Enhanced API caching with background sync
registerRoute(
  ({ url }) =>
    url.origin === 'https://api.gainium.io' ||
    url.origin === 'http://localhost:7500',
  async ({ event }) => {
    try {
      const response = await fetch(event.request.clone());

      // Cache successful responses
      if (response.status === 200) {
        const cache = await caches.open('api-cache');
        cache.put(event.request, response.clone());
      }

      return response;
    } catch (error) {
      // Try to get from cache
      const cache = await caches.open('api-cache');
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        return cachedResponse;
      }

      // Queue the request for background sync if it's a mutation
      if (event.request.method !== 'GET') {
        bgSync.replayRequests();
      }

      throw error;
    }
  }
);

// Cryptocurrency data caching (short expiry)
registerRoute(
  ({ url }) =>
    /(?:coinmarketcap|coingecko|binance|price|chart)/i.test(url.href),
  new NetworkFirst({
    cacheName: 'crypto-data-cache',
    networkTimeoutSeconds: 8,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Trading data caching (medium expiry)
registerRoute(
  ({ url }) => /(?:portfolio|trade|order|balance)/i.test(url.href),
  new NetworkFirst({
    cacheName: 'trading-data-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 15 * 60, // 15 minutes
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Static assets caching
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'assets-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Images caching
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Google Fonts caching
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/images/icon-192x192.svg',
      badge: '/images/icon-192x192.svg',
      data: data.data,
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Gainium', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Message handling for runtime communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.payload;
    event.waitUntil(
      caches.open('runtime-cache').then((cache) => {
        return cache.addAll(urls);
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    const cacheName = event.data.payload;
    event.waitUntil(caches.delete(cacheName));
  }
});

// Periodic background sync for data updates (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'crypto-data-sync') {
    event.waitUntil(updateCryptoData());
  }
});

async function updateCryptoData() {
  try {
    const cache = await caches.open('crypto-data-cache');
    const requests = await cache.keys();

    // Update cached crypto data
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.status === 200) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.log('Failed to update cached data:', error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Install event
self.addEventListener('install', () => {
  console.log('Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Enhanced error handling
self.addEventListener('fetch', (event) => {
  // Let other handlers take care of the request if already handled
  if (event.defaultPrevented) {
    return;
  }

  // Handle WebSocket upgrade requests
  if (event.request.headers.get('upgrade') === 'websocket') {
    // Don't intercept WebSocket connections
    return;
  }
});

console.log('Enhanced Service Worker loaded successfully');
