/**
 * @deprecated This hook creates local server status state.
 * Use the shared Zustand store instead:
 *
 * import { useServerStatusPolling } from './useServerStatusPolling';
 * import { useServerOnlineStatus, useServerStatusActions } from '../stores/serverStatus';
 *
 * The new implementation eliminates duplicate server checks across components
 * and provides a consistent global state.
 */

import { useCallback, useEffect, useState } from 'react';
import { logger } from '../lib/loggerInstance';

export interface ServerStatus {
  isOnline: boolean;
  lastChecked: Date;
  error?: string;
  responseTime?: number;
}

interface UseServerStatusOptions {
  url?: string;
  pollingInterval?: number;
  enablePolling?: boolean;
}

const DEFAULT_URL = 'http://localhost:5173';
const DEFAULT_POLLING_INTERVAL = 30000; // 30 seconds

export function useServerStatus(options: UseServerStatusOptions = {}) {
  const {
    url = DEFAULT_URL,
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    enablePolling = true,
  } = options;

  const [status, setStatus] = useState<ServerStatus>({
    isOnline: false,
    lastChecked: new Date(),
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkServerStatus = useCallback(async (): Promise<ServerStatus> => {
    const startTime = Date.now();
    logger.info('Checking server status', { url });

    try {
      setIsChecking(true);

      // Perform HEAD request to check server availability
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });

      const responseTime = Date.now() - startTime;
      const newStatus: ServerStatus = {
        isOnline: true,
        lastChecked: new Date(),
        responseTime,
      };

      logger.info('Server status check completed', {
        isOnline: true,
        responseTime: `${responseTime}ms`,
      });

      setStatus(newStatus);
      return newStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const newStatus: ServerStatus = {
        isOnline: false,
        lastChecked: new Date(),
        error: errorMessage,
        responseTime,
      };

      logger.warn('Server status check failed', {
        error: errorMessage,
        responseTime: `${responseTime}ms`,
      });

      setStatus(newStatus);
      return newStatus;
    } finally {
      setIsChecking(false);
    }
  }, [url]);

  // Manual refresh function
  const refreshStatus = useCallback(async () => {
    logger.info('Manual server status refresh triggered');
    return await checkServerStatus();
  }, [checkServerStatus]);

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

    // Initial check
    checkServerStatus();

    // Set up polling interval
    const interval = setInterval(() => {
      checkServerStatus();
    }, pollingInterval);

    return () => {
      logger.info('Stopping server status polling');
      clearInterval(interval);
    };
  }, [checkServerStatus, pollingInterval, enablePolling, url]);

  return {
    ...status,
    isChecking,
    refreshStatus,
    checkServerStatus,
  };
}
