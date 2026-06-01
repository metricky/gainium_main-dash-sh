import { useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/usePWA';

export const OfflineHandler: React.FC = () => {
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    // Handle offline navigation
    const handleOfflineNavigation = () => {
      if (isOffline && window.location.pathname !== '/offline.html') {
        // Only redirect if we're trying to navigate and truly offline
        // Check if the current page is cached
        if (
          'serviceWorker' in navigator &&
          navigator.serviceWorker.controller
        ) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CHECK_CACHE',
            url: window.location.href,
          });
        }
      }
    };

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_MISS' && isOffline) {
          // If the page is not cached and we're offline, show offline page
          window.location.href = '/offline.html';
        }
      });
    }

    // Handle offline state changes
    handleOfflineNavigation();
  }, [isOffline]);

  return null; // This component doesn't render anything
};

export default OfflineHandler;
