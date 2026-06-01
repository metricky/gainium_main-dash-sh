import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import logger from '../lib/loggerInstance';
import { WIDGET_QUERY_MAP, WIDGET_TYPE_MAP } from '../types/widgets';

/**
 * Hook for generic widget refresh functionality
 * Automatically detects and invalidates GraphQL queries based on widget type
 */
export function useWidgetRefresh() {
  const queryClient = useQueryClient();

  /**
   * Force refresh a widget by invalidating its related queries
   * @param widgetType - The widget type (e.g., 'portfolio-balances', 'accumulated-profit')
   * @param widgetId - The widget ID (optional, for widget-specific invalidation)
   * @param customQueries - Additional query keys to invalidate
   * @param onStart - Callback when refresh starts
   * @param onComplete - Callback when refresh completes
   * @param onError - Callback when refresh fails
   */
  const forceRefreshWidget = useCallback(
    async (
      widgetType: string,
      widgetId?: string,
      customQueries?: string[],
      onStart?: () => void,
      onComplete?: () => void,
      onError?: (error: Error) => void
    ) => {
      try {
        onStart?.();

        // Get queries to invalidate for this widget type
        const queriesToInvalidate = [
          ...(WIDGET_QUERY_MAP[widgetType] || []),
          ...(customQueries || []),
        ];

        // If no specific queries found, try to use the widget type as query name
        if (queriesToInvalidate.length === 0) {
          queriesToInvalidate.push(widgetType);
        }

        // Invalidate all related queries
        const invalidationPromises = queriesToInvalidate.map(
          async (queryName) => {
            // Invalidate matching queries by base key
            await queryClient.invalidateQueries({
              predicate: (query) => {
                const [baseKey] = query.queryKey as string[];
                return baseKey === queryName;
              },
            });

            logger.info(
              `[useWidgetRefresh] Invalidated queries for: ${queryName}`
            );
          }
        );

        await Promise.all(invalidationPromises);

        // Also invalidate any widget-specific cache keys if widgetId is provided
        if (widgetId) {
          await queryClient.invalidateQueries({
            predicate: (query) => {
              const queryKey = query.queryKey as string[];
              return queryKey.some(
                (key) => typeof key === 'string' && key.includes(widgetId)
              );
            },
          });
        }

        logger.info(
          `[useWidgetRefresh] Force refresh completed for widget type: ${widgetType}`,
          { widgetId, queries: queriesToInvalidate }
        );

        onComplete?.();
      } catch (error) {
        console.error('[useWidgetRefresh] Error during force refresh:', error);
        onError?.(error as Error);
      }
    },
    [queryClient]
  );

  /**
   * Force refresh all widget data by invalidating common queries
   */
  const forceRefreshAllWidgets = useCallback(async () => {
    // Common queries that most widgets depend on
    const commonQueries = [
      'getPortfolioByUser',
      'getProfitByUser',
      'getBalances',
      'botList',
      'dcaBotList',
      'comboBotList',
      'hedgeBotList',
      'getLatestOrders',
      'getPositions',
      'getOpenOrders',
      'getTradeHistory',
      'getExchanges',
      'user',
      'screener',
      'getNotifications',
      'getMessageBot',
    ];

    // Invalidate all common queries
    await Promise.all(
      commonQueries.map((queryName) =>
        queryClient.invalidateQueries({
          predicate: (query) => {
            const [baseKey] = query.queryKey as string[];
            return baseKey === queryName;
          },
        })
      )
    );

    logger.info('[useWidgetRefresh] Force refresh completed for all widgets', {
      queries: commonQueries,
    });
  }, [queryClient]);

  /**
   * Get cache statistics for debugging
   */
  const getCacheStats = useCallback(() => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    const stats = {
      totalQueries: queries.length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      loadingQueries: queries.filter((q) => q.state.status === 'pending')
        .length,
      errorQueries: queries.filter((q) => q.state.status === 'error').length,
      queryKeys: queries.map((q) => q.queryKey),
    };

    logger.info('[useWidgetRefresh] Cache stats:', stats);
    return stats;
  }, [queryClient]);

  return {
    forceRefreshWidget,
    forceRefreshAllWidgets,
    getCacheStats,
  };
}

/**
 * Get widget type from widget metadata
 * This helper extracts a standardized widget type identifier
 */
export function getWidgetTypeFromMetadata(metadata: {
  type: string;
  id: string;
}): string {
  // Normalize widget type to lowercase with hyphens
  const normalizedType = metadata.type
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(
      /^[\u002D\u2010\u2011\u2012\u2013\u2014\u2015\u2212]+|[\u002D\u2010\u2011\u2012\u2013\u2014\u2015\u2212]+$/g,
      ''
    );

  // Use centralized type mapping
  return WIDGET_TYPE_MAP[normalizedType] || normalizedType;
}
