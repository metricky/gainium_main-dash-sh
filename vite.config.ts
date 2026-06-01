import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock API plugin for development
const mockApiPlugin = (): Plugin => {
  return {
    name: 'mock-api',
    configureServer(server) {
      // Handle auth endpoints
      server.middlewares.use('/auth/login', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { email, password } = JSON.parse(body);
              if (!email || !password) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({ error: 'Email and password are required' })
                );
                return;
              }

              // Mock successful login
              const mockUser = {
                id: '6279d23c6bf516d657d1ad0c',
                email,
                name: 'Test User',
                avatar:
                  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              // Generate mock JWT token
              const header = { alg: 'HS256', typ: 'JWT' };
              const payload = {
                sub: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
              };
              const encodedHeader = Buffer.from(
                JSON.stringify(header)
              ).toString('base64');
              const encodedPayload = Buffer.from(
                JSON.stringify(payload)
              ).toString('base64');
              const accessToken = `${encodedHeader}.${encodedPayload}.mock_signature`;

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader(
                'Set-Cookie',
                'refreshToken=mock_refresh_token; HttpOnly; Path=/; Max-Age=604800'
              );
              res.end(JSON.stringify({ accessToken, user: mockUser }));
            } catch (_error) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
          });
        } else {
          next();
        }
      });

      // Handle Google auth endpoint
      server.middlewares.use('/auth/google', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { googleToken } = JSON.parse(body);
              if (!googleToken) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Google token is required' }));
                return;
              }

              // Mock successful Google login
              const mockUser = {
                id: '12345',
                email: 'user@gmail.com',
                name: 'Google User',
                avatar:
                  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              // Generate mock JWT token
              const header = { alg: 'HS256', typ: 'JWT' };
              const payload = {
                sub: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
              };
              const encodedHeader = Buffer.from(
                JSON.stringify(header)
              ).toString('base64');
              const encodedPayload = Buffer.from(
                JSON.stringify(payload)
              ).toString('base64');
              const accessToken = `${encodedHeader}.${encodedPayload}.mock_signature`;

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader(
                'Set-Cookie',
                'refreshToken=mock_refresh_token; HttpOnly; Path=/; Max-Age=604800'
              );
              res.end(JSON.stringify({ accessToken, user: mockUser }));
            } catch (_error) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
          });
        } else {
          next();
        }
      });

      // Handle refresh token endpoint
      server.middlewares.use('/auth/refresh', async (req, res, next) => {
        if (req.method === 'POST') {
          // Mock token refresh
          const header = { alg: 'HS256', typ: 'JWT' };
          const payload = {
            sub: '6279d23c6bf516d657d1ad0c',
            email: 'user@gainium.io',
            name: 'Test User',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
          };
          const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
            'base64'
          );
          const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
            'base64'
          );
          const accessToken = `${encodedHeader}.${encodedPayload}.mock_signature`;

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader(
            'Set-Cookie',
            'refreshToken=mock_refresh_token; HttpOnly; Path=/; Max-Age=604800'
          );
          res.end(JSON.stringify({ accessToken }));
        } else {
          next();
        }
      });

      // Handle logout endpoint
      server.middlewares.use('/auth/logout', async (req, res, next) => {
        if (req.method === 'POST') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader(
            'Set-Cookie',
            'refreshToken=; HttpOnly; Path=/; Max-Age=0'
          );
          res.end(JSON.stringify({ message: 'Logged out successfully' }));
        } else {
          next();
        }
      });

      // Handle health check endpoint
      server.middlewares.use('/health', async (req, res, next) => {
        if (req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              timestamp: new Date().toISOString(),
              message: 'Mock API server is running',
            })
          );
        } else {
          next();
        }
      });
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Polyfill global for PouchDB and other Node.js libraries
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Polyfill Node.js modules for browser
      process: 'process/browser',
      events: 'events',
      // Ensure nested imports of dca are resolved to the node_modules path
      '@gainium/backtester/dist/dca': path.resolve(
        __dirname,
        './node_modules/@gainium/backtester/dist/dca/index.js'
      ),
    },
  },
  plugins: [
    react(),
    mockApiPlugin(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        // Disabled: the SW caches dev bundles between sessions and
        // can serve stale JS even after edits. Re-enable only when
        // debugging PWA-specific behavior.
        enabled: false,
        navigateFallback: 'index.html',
      },
      strategies: 'generateSW',
      filename: 'sw.js',
      workbox: {
        maximumFileSizeToCacheInBytes: 10000000, // 10MB limit for large chunks
        mode: 'production', // Disable workbox logging in development
        globPatterns: [
          '**/*.{js,css,ico,png,svg,woff,woff2,webp,jpg,jpeg}',
          '**/manifest.json',
        ],
        globIgnores: [
          '**/index.html', // Don't precache index.html to avoid stale app shells
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/_/,
          /\/[^/?]+\.[^/]+$/,
          /^\/offline\.html$/,
          /^\/api\//,
          /^\/auth\//,
          /^\/sw\.js$/,
          /^\/workbox-.*\.js$/,
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern:
              /^http:\/\/localhost:750[0-9]\/(?:auth|health|api)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dev-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 2,
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.gainium\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24,
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // Reduced to 1 hour
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        additionalManifestEntries: [
          { url: '/offline.html', revision: Date.now().toString() },
        ],
      },
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.svg',
        'mask-icon.svg',
        'offline.html',
        'images/**/*',
      ],
      manifest: {
        name: 'Gainium Dashboard',
        short_name: 'Gainium',
        description:
          'Gainium cryptocurrency trading dashboard with comprehensive offline support',
        theme_color: '#1f2937',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['finance', 'business', 'productivity'],
        lang: 'en',
        icons: [
          {
            src: '/images/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable any',
          },
          {
            src: '/images/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable any',
          },
          {
            src: '/images/apple-touch-icon.svg',
            sizes: '180x180',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View trading dashboard',
            url: '/',
            icons: [{ src: '/images/icon-192x192.svg', sizes: '192x192' }],
          },
          {
            name: 'Portfolio',
            short_name: 'Portfolio',
            description: 'View portfolio performance',
            url: '/portfolio',
            icons: [{ src: '/images/icon-192x192.svg', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
  ssr: {
    noExternal: ['@gainium/backtester'],
  },
  server: {
    port: 7500, // Change this to your desired port
    host: true, // Allow external connections
  },
  preview: {
    port: 7555, // Use the same port for preview
    host: true, // Allow external connections
    allowedHosts: ['dash.gainium.io'], // Allow this host
  },
  optimizeDeps: {
    // Pre-bundle backtester for better performance. PouchDB is stubbed
    // in self-hosted (see `src/lib/pouchdbLoader.ts`) and intentionally
    // not in package.json — don't reintroduce it here.
    include: ['@gainium/backtester'],
    exclude: [],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
  },
  esbuild: {
    // Allow TypeScript enums in esbuild
    keepNames: true,
    target: 'es2020',
  },
});
