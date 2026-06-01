/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import OfflineDataManager from '../lib/offlineDataManager';
import OfflineQueueManager from '../lib/offlineQueueManager';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
}

export interface PWAState {
  isInstalled: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
  isUpdating: boolean;
  networkStatus: NetworkStatus;
  queueStatus: { count: number; processing: boolean };
  storageUsage: { used: number; quota: number; percentage: number };
}

export interface PWAActions {
  installApp: () => Promise<void>;
  updateApp: () => Promise<void>;
  goOffline: () => void;
  clearOfflineData: () => Promise<void>;
  processOfflineQueue: () => Promise<void>;
  checkStorageUsage: () => Promise<void>;
}

export function useEnhancedPWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    canInstall: false,
    updateAvailable: false,
    isUpdating: false,
    networkStatus: {
      isOnline: navigator.onLine,
      isSlowConnection: false,
      connectionType: 'unknown',
      effectiveType: 'unknown',
    },
    queueStatus: { count: 0, processing: false },
    storageUsage: { used: 0, quota: 0, percentage: 0 },
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // Initialize managers
  const offlineDataManager = OfflineDataManager.getInstance();
  const offlineQueueManager = OfflineQueueManager.getInstance();

  // Check if app is installed
  const checkInstallStatus = useCallback(() => {
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setState((prev) => ({
      ...prev,
      isInstalled: isStandalone || isInWebAppiOS,
    }));
  }, []);

  // Get network information
  const getNetworkInfo = useCallback((): NetworkStatus => {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      isSlowConnection: connection
        ? connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g'
        : false,
      connectionType: connection ? connection.type || 'unknown' : 'unknown',
      effectiveType: connection
        ? connection.effectiveType || 'unknown'
        : 'unknown',
    };
  }, []);

  // Update storage usage
  const checkStorageUsage = useCallback(async () => {
    try {
      const usage = await offlineDataManager.getStorageUsage();
      const percentage = usage.quota > 0 ? (usage.used / usage.quota) * 100 : 0;

      setState((prev) => ({
        ...prev,
        storageUsage: {
          used: usage.used,
          quota: usage.quota,
          percentage,
        },
      }));
    } catch (error) {
      console.error('Failed to check storage usage:', error);
    }
  }, [offlineDataManager]);

  // Update queue status
  const updateQueueStatus = useCallback(() => {
    const queueStatus = offlineQueueManager.getQueueStatus();
    setState((prev) => ({
      ...prev,
      queueStatus,
    }));
  }, [offlineQueueManager]);

  // Install app
  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setState((prev) => ({
            ...prev,
            isInstalled: true,
            canInstall: false,
          }));
        }

        setDeferredPrompt(null);
      } catch (error) {
        console.error('Failed to install app:', error);
      }
    }
  }, [deferredPrompt]);

  // Update app
  const updateApp = useCallback(async () => {
    if (registration && registration.waiting) {
      setState((prev) => ({ ...prev, isUpdating: true }));

      try {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Wait for the new service worker to take control
        const controllerChanged = new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => resolve(),
            { once: true }
          );
        });

        await controllerChanged;
        window.location.reload();
      } catch (error) {
        console.error('Failed to update app:', error);
        setState((prev) => ({ ...prev, isUpdating: false }));
      }
    }
  }, [registration]);

  // Simulate offline mode
  const goOffline = useCallback(() => {
    // This is for testing purposes - in a real app you might want to disable network requests
    setState((prev) => ({
      ...prev,
      networkStatus: { ...prev.networkStatus, isOnline: false },
    }));
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineDataManager.clearAllData();
      offlineQueueManager.clearQueue();
      await checkStorageUsage();
      updateQueueStatus();
      console.log('Offline data cleared successfully');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, [
    offlineDataManager,
    offlineQueueManager,
    checkStorageUsage,
    updateQueueStatus,
  ]);

  // Process offline queue
  const processOfflineQueue = useCallback(async () => {
    try {
      await offlineQueueManager.processQueue();
      updateQueueStatus();
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }, [offlineQueueManager, updateQueueStatus]);

  // Setup event listeners
  useEffect(() => {
    // Install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState((prev) => ({ ...prev, canInstall: true }));
    };

    // Network status changes
    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        networkStatus: getNetworkInfo(),
      }));
      processOfflineQueue();
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        networkStatus: getNetworkInfo(),
      }));
    };

    // Connection type changes
    const handleConnectionChange = () => {
      setState((prev) => ({
        ...prev,
        networkStatus: getNetworkInfo(),
      }));
    };

    // Service worker updates
    const handleServiceWorkerUpdate = (
      registration: ServiceWorkerRegistration
    ) => {
      setRegistration(registration);

      if (registration.waiting) {
        setState((prev) => ({ ...prev, updateAvailable: true }));
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setState((prev) => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });
    };

    // Offline queue events
    const handleOfflineRequestSuccess = () => {
      updateQueueStatus();
    };

    // Register event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(
      'offlineRequestSuccess',
      handleOfflineRequestSuccess
    );

    // Connection API
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(handleServiceWorkerUpdate);
    }

    // Initial checks
    checkInstallStatus();
    checkStorageUsage();
    updateQueueStatus();

    // Cleanup
    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'offlineRequestSuccess',
        handleOfflineRequestSuccess
      );

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [
    checkInstallStatus,
    checkStorageUsage,
    updateQueueStatus,
    processOfflineQueue,
    getNetworkInfo,
  ]);

  // Periodic storage check
  useEffect(() => {
    const interval = setInterval(checkStorageUsage, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkStorageUsage]);

  // Periodic queue status update
  useEffect(() => {
    const interval = setInterval(updateQueueStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [updateQueueStatus]);

  const actions: PWAActions = {
    installApp,
    updateApp,
    goOffline,
    clearOfflineData,
    processOfflineQueue,
    checkStorageUsage,
  };

  return { state, actions, offlineDataManager, offlineQueueManager };
}

export default useEnhancedPWA;
