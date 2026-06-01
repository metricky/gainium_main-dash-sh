import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// Service worker version for update detection
const SW_VERSION = '1.0.1';
console.log(`Service Worker ${SW_VERSION} starting...`);

// Clean up outdated caches
cleanupOutdatedCaches();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Handle navigation requests with fallback to offline page
const navigationHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [
    /^\/_/,
    /\/[^/?]+\.[^/]+$/,
    /^\/offline\.html$/,
    /^\/api\//,
    /^\/auth\//,
    /^\/sw\.js$/,
    /^\/workbox-.*\.js$/
  ]
});
registerRoute(navigationRoute);

// API caching strategies
registerRoute(
  /^http:\/\/localhost:7500\/(?:auth|health|api)\/.*/i,
  new NetworkFirst({
    cacheName: 'dev-api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 2 // 2 hours
      })
    ],
    networkTimeoutSeconds: 5
  })
);

registerRoute(
  /^https:\/\/api\.gainium\.io\/.*/i,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 // 24 hours
      })
    ],
    networkTimeoutSeconds: 10
  })
);

// WebSocket routes (network only)
registerRoute(
  /^https:\/\/ws\.gainium\.io\/.*/i,
  new NetworkOnly()
);

// Static assets with stale-while-revalidate
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'assets-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
      })
    ]
  })
);

// Images with cache first
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
);

// Crypto data (short-term cache)
registerRoute(
  /(?:coinmarketcap|coingecko|binance|price|chart)/i,
  new NetworkFirst({
    cacheName: 'crypto-data-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 5 // 5 minutes
      })
    ],
    networkTimeoutSeconds: 8
  })
);

// Trading data
registerRoute(
  /(?:portfolio|trade|order|balance)/i,
  new NetworkFirst({
    cacheName: 'trading-data-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 60 * 15 // 15 minutes
      })
    ],
    networkTimeoutSeconds: 10
  })
);

// Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      })
    ]
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      })
    ]
  })
);

// CDN assets
registerRoute(
  /^https:\/\/cdn\./i,
  new CacheFirst({
    cacheName: 'cdn-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
);

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notify clients about update availability
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Claim all clients
      await self.clients.claim();
      
      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          message: 'Service worker updated and activated'
        });
      });
    })()
  );
});

// Handle navigation fallback to offline page
self.addEventListener('fetch', (event) => {
  // Only handle navigate requests for HTML documents
  if (
    event.request.mode === 'navigate' &&
    event.request.destination === 'document' &&
    !event.request.url.includes('/offline.html')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
