import { useCallback, useEffect } from 'react';
import { logger } from '../lib/loggerInstance';
import {
  useServerStatusActions,
  useServerStatusStore,
} from '../stores/serverStatus';

interface UseServerStatusPollingOptions {
  url?: string;
  pollingInterval?: number;
  enablePolling?: boolean;
}

const DEFAULT_URL = 'http://localhost:5173';
const DEFAULT_POLLING_INTERVAL = 30000; // 30 seconds

/**
 * Hook that provides server status polling functionality using the shared Zustand store.
 * This allows multiple components to access the same server status data without duplicating requests.
 *
 * Examples:
 *
 * // Health page - enable polling
 * const { isOnline, isChecking, refreshStatus } = useServerStatusPolling();
 *
 * // Navbar - just show status without polling (since Health page already polls)
 * const { isOnline } = useServerStatusPolling({ enablePolling: false });
 *
 * // Dashboard widget - custom polling interval
 * const { isOnline, lastChecked } = useServerStatusPolling({ pollingInterval: 10000 });
 */
export function useServerStatusPolling(
  options: UseServerStatusPollingOptions = {}
) {
  const {
    url = DEFAULT_URL,
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    enablePolling = true,
  } = options;

  // Get state from the store
  const status = useServerStatusStore();
  const { checkServerStatus } = useServerStatusActions();

  // Manual refresh function that uses the store action
  const refreshStatus = useCallback(async () => {
    logger.info('Manual server status refresh triggered');
    return await checkServerStatus(url);
  }, [checkServerStatus, url]);

  // Auto-polling effect
  useEffect(() => {
    if (!enablePolling) {
      logger.info('Server status polling disabled');
      return;
    }

    logger.info('Starting server status polling', {
      interval: `${pollingInterval / 1000}s`,
      url,
    });

    // Create a stable function reference using async function inside effect
    const performCheck = async () => {
      try {
        await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
        });
        // Manual status update to avoid using the store action in effect
        useServerStatusStore.getState().setStatus({
          isOnline: true,
        });
      } catch (error) {
        useServerStatusStore.getState().setStatus({
          isOnline: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // Initial check
    performCheck();

    // Set up polling interval
    const interval = setInterval(performCheck, pollingInterval);

    return () => {
      logger.info('Stopping server status polling');
      clearInterval(interval);
    };
  }, [url, pollingInterval, enablePolling]);

  return {
    // Server status data
    isOnline: status.isOnline,
    lastChecked: status.lastChecked,
    isChecking: status.isChecking,
    error: status.error,
    responseTime: status.responseTime,

    // Actions
    refreshStatus,
    checkServerStatus: () => checkServerStatus(url),
  };
}
