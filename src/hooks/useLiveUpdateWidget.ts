import { useEffect, useState } from 'react';
/* import { useLiveUpdate } from '../contexts/LiveUpdateContext'; */
import { useLiveBotMetrics } from './useLiveBotMetrics';
import type { CalculatedBotStats } from '../services/metrics/BotMetricsCalculator';

/**
 * Hook for using live update functionality in custom components
 */
export function useLiveUpdateWidget(
  botId: string,
  options?: {
    refreshInterval?: number;
    onDataUpdate?: (data: CalculatedBotStats) => void;
    onError?: (error: string) => void;
  }
) {
  /*  const [isSubscribed, setIsSubscribed] = useState(false); */
  const [lastUpdate, setLastUpdate] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);

  /* const { webSocketManager } = useLiveUpdate(); */

  // Get live metrics
  const metrics = useLiveBotMetrics({
    botId,
    enabled: true /* isSubscribed */,
  });

  /* // Subscribe to live updates
  useEffect(() => {
    if (!botId || !webSocketManager) return undefined;

    try {
      webSocketManager.subscribeToBot(botId);
      setIsSubscribed(true);

      return () => {
        webSocketManager.unsubscribeFromBot(botId);
        setIsSubscribed(false);
      };
    } catch (error) {
      console.error('[useLiveUpdateWidget] Failed to subscribe:', error);
      options?.onError?.(`Failed to subscribe: ${(error as Error).message}`);
      return undefined;
    }
  }, [botId, webSocketManager, options]); */

  // Handle data updates
  useEffect(() => {
    if (metrics.stats) {
      setLastUpdate(Date.now());
      setUpdateCount((prev) => prev + 1);
      options?.onDataUpdate?.(metrics.stats);
    }
  }, [metrics.stats, options]);

  // Handle errors
  useEffect(() => {
    if (metrics.error) {
      options?.onError?.(metrics.error);
    }
  }, [metrics.error, options]);

  return {
    metrics,
    /* isSubscribed, */
    lastUpdate,
    updateCount,
  };
}
