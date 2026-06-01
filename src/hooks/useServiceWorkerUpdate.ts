import { useCallback, useEffect, useState } from 'react';

export interface ServiceWorkerUpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

export function useServiceWorkerUpdate(): ServiceWorkerUpdateState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  const updateServiceWorker = useCallback(
    async (reloadPage?: boolean) => {
      if (registration && registration.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        if (reloadPage) {
          // Wait for the new service worker to take control
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => {
              window.location.reload();
            },
            { once: true }
          );
        }
      }
    },
    [registration]
  );

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('SW: Service worker registered', registration);
          setRegistration(registration);

          // Check if there's a waiting service worker
          if (registration.waiting) {
            setNeedRefresh(true);
          }

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content is available
                    setNeedRefresh(true);
                  } else {
                    // Content is cached for offline use
                    setOfflineReady(true);
                  }
                }
              });
            }
          });

          // Check for updates more frequently when cache issues are suspected
          setInterval(() => {
            registration.update();
          }, 30000); // Check every 30 seconds instead of 60
        })
        .catch((error) => {
          console.error('SW: Service worker registration failed', error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_ACTIVATED') {
          console.log('SW: Service worker activated');
          window.location.reload();
        }
      });
    }
  }, []);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  };
}

export default useServiceWorkerUpdate;
