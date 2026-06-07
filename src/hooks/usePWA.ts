/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

interface PWAUpdateState {
  updateAvailable: boolean;
  updateInstalled: boolean;
  updateServiceWorker: () => void;
}

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
}

interface NetworkState {
  isOnline: boolean;
  isOffline: boolean;
  showBackOnline?: boolean;
}

export function usePWAUpdate(): PWAUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInstalled, setUpdateInstalled] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // Don't show update prompts in development mode - Vite HMR causes false positives
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // In dev a service worker must NEVER control the page (it serves stale
    // precached bundles and can't self-update). Teardown of any leftover SW
    // happens at app entry via unregisterServiceWorkersInDev() in main.tsx;
    // here we simply never register one.
    if (isDev) return;

    // Only a genuine UPDATE (a new SW replacing an existing controller) should
    // force a reload. On a user's first visit the initial SW claims the page
    // (clientsClaim) and ALSO fires controllerchange — reloading then would
    // bounce a freshly-loaded page for no reason. This flag flips true only when
    // an installing worker appears while a controller already exists.
    let reloadOnControllerChange = false;

    const registerAndListen = async () => {
      try {
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          reg = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
        }

        setRegistration(reg);

        if (reg.waiting) {
          setUpdateAvailable(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          // A controller already present means this is an update, not the
          // first install — so a subsequent controllerchange should reload.
          if (navigator.serviceWorker.controller) {
            reloadOnControllerChange = true;
          }
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
            }
            if (newWorker.state === 'activated') {
              setUpdateInstalled(true);
              setTimeout(() => setUpdateInstalled(false), 3000);
            }
          });
        });

        // Poll for a new deployment so long-lived SPA sessions still update.
        setInterval(() => {
          reg.update();
        }, 60000);
      } catch (error) {
        console.error('PWA: Service worker registration failed', error);
      }
    };

    registerAndListen();

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloadOnControllerChange) return;
      setUpdateInstalled(true);
      setTimeout(() => {
        setUpdateInstalled(false);
        window.location.reload();
      }, 1000);
    });
  }, [isDev]);

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
    }
  };

  return {
    updateAvailable,
    updateInstalled,
    updateServiceWorker,
  };
}

export function useNetworkStatus(): NetworkState {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      // Hide the "back online" message after 3 seconds
      setTimeout(() => setShowBackOnline(false), 3000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    showBackOnline,
  };
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the install prompt
    const dismissedTimestamp = localStorage.getItem('pwa-install-dismissed');
    const isDismissedRecently =
      dismissedTimestamp &&
      Date.now() - parseInt(dismissedTimestamp) < 7 * 24 * 60 * 60 * 1000; // 7 days

    setIsDismissed(!!isDismissedRecently);

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      // Check if running in browser with navigator.standalone (iOS Safari)
      const isIOSStandalone = (window.navigator as any).standalone === true;

      // Check install status

      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkIfInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Install prompt available
      setDeferredPrompt(e);

      // Only show if not recently dismissed
      if (!isDismissedRecently) {
        setCanInstall(true);
      }
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      // App was installed
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      setIsDismissed(false);
      // Clear dismissal since app is now installed
      localStorage.removeItem('pwa-install-dismissed');
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check display mode changes (for when user installs/uninstalls)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      checkIfInstalled();
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);

      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      // No install prompt available
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Handle user response to install prompt

    if (outcome === 'accepted') {
      // User accepted the install prompt
      // Clear dismissal since user chose to install
      localStorage.removeItem('pwa-install-dismissed');
    } else {
      // User dismissed the install prompt
      // Store dismissal timestamp
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      setIsDismissed(true);
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  const dismissInstall = () => {
    // Install prompt dismissed by user
    setCanInstall(false);
    setDeferredPrompt(null);
    setIsDismissed(true);

    // Store dismissal timestamp in localStorage
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return {
    canInstall: canInstall && !isInstalled && !isDismissed,
    isInstalled,
    promptInstall,
    dismissInstall,
  };
}
