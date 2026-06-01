import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLiveUpdate } from '../../../contexts/LiveUpdateContext';
import { useLiveBotMetrics } from '../../../hooks/useLiveBotMetrics';
import type { CalculatedBotStats } from '../../../services/metrics/BotMetricsCalculator';

export type SubscriptionType =
  | 'stats'
  | 'orders'
  | 'deals'
  | 'balance'
  | 'messages';

export interface LiveUpdateWidgetProps {
  botId: string;
  className?: string;
  showLoadingState?: boolean;
  showErrorState?: boolean;
  onDataUpdate?: (data: CalculatedBotStats) => void;
  onError?: (error: string) => void;
  debounceMs?: number; // Debounce updates to reduce re-renders
  subscriptionTypes?: SubscriptionType[]; // Which types of updates to subscribe to
  batchSize?: number; // Number of updates to batch before triggering callback
  batchTimeoutMs?: number; // Max time to wait before processing batch
  children?:
    | React.ReactNode
    | ((context: {
        metrics: ReturnType<typeof useLiveBotMetrics>;
        /* isSubscribed: boolean; */
        lastUpdate: number;
        updateCount: number;
        pendingDataUpdate: CalculatedBotStats | null;
        isConnected: boolean;
        connectionError: string | null;
        reconnect: () => void;
      }) => React.ReactNode);
}

export interface LiveUpdateWidgetState {
  isSubscribed: boolean;
  lastUpdate: number;
  updateCount: number;
}

/**
 * LiveUpdateWidget component that provides common functionality for live update widgets
 * Handles subscription management, error handling, loading states, and performance optimizations
 */
export const LiveUpdateWidget: React.FC<LiveUpdateWidgetProps> = ({
  botId,
  className = '',
  showLoadingState = true,
  showErrorState = true,
  onDataUpdate,
  onError,
  debounceMs = 100, // Default 100ms debounce
  subscriptionTypes = ['stats'], // Default to stats only
  batchSize = 1, // Default batch size of 1 (no batching)
  batchTimeoutMs = 1000, // Default 1 second batch timeout
  children,
}) => {
  /* const [isSubscribed, setIsSubscribed] = useState(false); */
  const [lastUpdate, setLastUpdate] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);
  const [pendingDataUpdate, setPendingDataUpdate] =
    useState<CalculatedBotStats | null>(null);
  const [updateBatch, setUpdateBatch] = useState<CalculatedBotStats[]>([]);
  const [batchTimeoutId, setBatchTimeoutId] = useState<NodeJS.Timeout | null>(
    null
  );

  const { /*  webSocketManager, */ isConnected, connectionError, reconnect } =
    useLiveUpdate();

  // Get live metrics for the bot - only if stats are subscribed
  const metrics = useLiveBotMetrics({
    botId,
    enabled: /* isSubscribed && */ subscriptionTypes.includes('stats'),
  });

  // Process batch of updates
  const processBatch = useCallback(
    (batch: CalculatedBotStats[]) => {
      if (batch.length === 0) return;

      // Use the most recent update in the batch
      const latestUpdate = batch[batch.length - 1];
      setLastUpdate(Date.now());
      setUpdateCount((prev) => prev + batch.length);
      onDataUpdate?.(latestUpdate);
      setPendingDataUpdate(null);
      setUpdateBatch([]);
      setBatchTimeoutId(null);
    },
    [onDataUpdate]
  );

  // Debounced data update handler with batching
  const debouncedDataUpdate = useMemo(() => {
    if (!subscriptionTypes.includes('stats')) {
      return () => {}; // No-op if stats not subscribed
    }

    return (data: CalculatedBotStats) => {
      setUpdateBatch((prev) => {
        const newBatch = [...prev, data];

        // If batch size reached, process immediately
        if (newBatch.length >= batchSize) {
          if (batchTimeoutId) {
            clearTimeout(batchTimeoutId);
            setBatchTimeoutId(null);
          }
          setTimeout(() => processBatch(newBatch), 0);
          return [];
        }

        // Set timeout for batch processing if not already set
        if (!batchTimeoutId) {
          const timeoutId = setTimeout(() => {
            setUpdateBatch((currentBatch) => {
              if (currentBatch.length > 0) {
                processBatch(currentBatch);
              }
              return [];
            });
          }, batchTimeoutMs);
          setBatchTimeoutId(timeoutId);
        }

        return newBatch;
      });

      setPendingDataUpdate(data);
    };
  }, [
    batchSize,
    batchTimeoutMs,
    subscriptionTypes,
    processBatch,
    batchTimeoutId,
  ]);

  const timeoutIdRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounced error handler - always active for error handling
  const debouncedErrorUpdate = useMemo(() => {
    return (error: string) => {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = setTimeout(() => {
        onError?.(error);
      }, debounceMs);
    };
  }, [debounceMs, onError]);

  /* // Subscribe to live updates
  // Note: Currently subscribes to all bot events via WebSocket manager
  // Selective processing is handled in the update handlers based on subscriptionTypes
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
      console.error(
        '[LiveUpdateWidget] Failed to subscribe to live updates:',
        error
      );
      onError?.(
        `Failed to subscribe to live updates: ${(error as Error).message}`
      );
      return undefined;
    }
  }, [botId, webSocketManager, onError]); */

  // Cleanup batch timeout on unmount or dependency changes
  useEffect(() => {
    return () => {
      if (batchTimeoutId) {
        clearTimeout(batchTimeoutId);
      }
    };
  }, [batchTimeoutId]);

  // Process any remaining batch when subscription types change
  useEffect(() => {
    if (updateBatch.length > 0) {
      processBatch(updateBatch);
    }
  }, [subscriptionTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle data updates with batching
  useEffect(() => {
    if (metrics.stats) {
      debouncedDataUpdate(metrics.stats);
    }
  }, [metrics.stats, debouncedDataUpdate]);

  // Handle errors with debouncing
  useEffect(() => {
    if (metrics.error) {
      debouncedErrorUpdate(metrics.error);
    }
  }, [metrics.error, debouncedErrorUpdate]);

  // Render loading state
  if (showLoadingState && metrics.isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render connection error state
  if (connectionError && !isConnected) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-xs">
          <div className="text-destructive text-lg">🔌</div>
          <div className="text-sm text-muted-foreground">Connection lost</div>
          <div className="text-xs text-muted-foreground">{connectionError}</div>
          <button
            onClick={reconnect}
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  // Render data error state
  if (showErrorState && metrics.error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="text-destructive mb-2">⚠️</div>
          <div className="text-sm text-muted-foreground">{metrics.error}</div>
        </div>
      </div>
    );
  }

  // Render children with live data context
  return (
    <div className={className}>
      {typeof children === 'function'
        ? children({
            metrics,
            /* isSubscribed, */
            lastUpdate,
            updateCount,
            pendingDataUpdate,
            isConnected,
            connectionError,
            reconnect,
          })
        : children}
    </div>
  );
};
