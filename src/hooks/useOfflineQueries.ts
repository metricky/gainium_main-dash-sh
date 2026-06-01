import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { offlineApiClient } from '../lib/offlineApiClient';

interface OfflineQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  endpoint: string;
  cacheKey?: string;
  fallbackData?: T;
  storeOffline?: boolean;
  maxRetries?: number;
}

interface OfflineMutationOptions<T, V> extends Omit<
  UseMutationOptions<T, Error, V>,
  'mutationFn'
> {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'DELETE';
  maxRetries?: number;
}

/**
 * Enhanced useQuery hook with offline support
 */
export function useOfflineQuery<T = unknown>(options: OfflineQueryOptions<T>) {
  const {
    endpoint,
    cacheKey,
    fallbackData,
    storeOffline = true,
    maxRetries = 3,
    ...queryOptions
  } = options;

  return useQuery<T>({
    ...queryOptions,
    queryFn: async () => {
      return offlineApiClient.get<T>(
        endpoint,
        {},
        {
          cacheKey: cacheKey || endpoint,
          fallbackData,
          storeOffline,
          maxRetries,
        }
      );
    },
    // Enable background refetch when online
    refetchOnWindowFocus: navigator.onLine,
    refetchOnReconnect: true,
    // Cache data for longer when offline
    staleTime: navigator.onLine ? 5 * 60 * 1000 : 30 * 60 * 1000, // 5 minutes online, 30 minutes offline
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    // Retry less frequently when offline
    retry: navigator.onLine ? 3 : 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Enhanced useMutation hook with offline queue support
 */
export function useOfflineMutation<T = unknown, V = unknown>(
  options: OfflineMutationOptions<T, V>
) {
  const {
    endpoint,
    method = 'POST',
    maxRetries = 3,
    ...mutationOptions
  } = options;

  const queryClient = useQueryClient();

  // Extract onSuccess and onError from mutationOptions to handle them separately
  const {
    onSuccess: originalOnSuccess,
    onError: originalOnError,
    ...restMutationOptions
  } = mutationOptions;

  return useMutation<T, Error, V>({
    ...restMutationOptions,
    mutationFn: async (variables: V) => {
      switch (method) {
        case 'POST':
          return offlineApiClient.post<T>(
            endpoint,
            variables,
            {},
            { maxRetries }
          );
        case 'PUT':
          return offlineApiClient.put<T>(
            endpoint,
            variables,
            {},
            { maxRetries }
          );
        case 'DELETE':
          return offlineApiClient.delete<T>(endpoint, {}, { maxRetries });
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    // onSuccess signature: (data, variables, context)
    onSuccess: (data: T, variables: V, context: unknown) => {
      // Invalidate related queries on successful mutation
      queryClient.invalidateQueries({ queryKey: [endpoint] });

      // Call the original onSuccess if provided
      if (originalOnSuccess) {
        // Cast to any to satisfy possible older signature usage safely
        (originalOnSuccess as unknown as (d: T, v: V, c: unknown) => void)(
          data,
          variables,
          context
        );
      }
    },
    // onError signature: (error, variables, context)
    onError: (error: Error, variables: V, context: unknown) => {
      console.error(`Mutation failed for ${endpoint}:`, error);

      // Call the original onError if provided
      if (originalOnError) {
        (originalOnError as unknown as (e: Error, v: V, c: unknown) => void)(
          error,
          variables,
          context
        );
      }
    },
  });
}

/**
 * Hook for portfolio data with offline support
 */
export function usePortfolioData<T = unknown>(
  options?: Partial<OfflineQueryOptions<T>>
) {
  return useOfflineQuery({
    queryKey: ['portfolio'],
    endpoint: '/api/portfolio',
    cacheKey: 'portfolio-main',
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Hook for price data with offline support
 */
export function usePriceData<T = unknown>(
  symbol: string,
  options?: Partial<OfflineQueryOptions<T>>
) {
  return useOfflineQuery<T>({
    queryKey: ['price', symbol],
    endpoint: `/api/price/${symbol}`,
    cacheKey: `price-${symbol}`,
    staleTime: 30 * 1000, // 30 seconds for price data
    ...options,
  });
}

/**
 * Hook for trading history with offline support
 */
export function useTradingHistory<T = unknown>(
  options?: Partial<OfflineQueryOptions<T[]>>
) {
  return useOfflineQuery<T[]>({
    queryKey: ['trading-history'],
    endpoint: '/api/trades/history',
    cacheKey: 'trading-history',
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook for balance data with offline support
 */
export function useBalanceData<T = unknown>(
  options?: Partial<OfflineQueryOptions<T>>
) {
  return useOfflineQuery<T>({
    queryKey: ['balance'],
    endpoint: '/api/account/balance',
    cacheKey: 'account-balance',
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

/**
 * Hook for creating trades with offline queue support
 */
export function useCreateTrade() {
  return useOfflineMutation({
    endpoint: '/api/trades',
    method: 'POST',
  });
}

/**
 * Hook for updating trades with offline queue support
 */
export function useUpdateTrade() {
  return useOfflineMutation({
    endpoint: '/api/trades',
    method: 'PUT',
  });
}

/**
 * Hook for canceling trades with offline queue support
 */
export function useCancelTrade() {
  return useOfflineMutation({
    endpoint: '/api/trades',
    method: 'DELETE',
  });
}

/**
 * Utility hook to get offline status and manage data
 */
export function useOfflineManager() {
  const queryClient = useQueryClient();

  const clearOfflineCache = () => {
    queryClient.clear();
  };

  const refetchAllQueries = () => {
    queryClient.refetchQueries();
  };

  const getQueryData = (queryKey: readonly unknown[]) => {
    return queryClient.getQueryData(queryKey);
  };

  const setQueryData = (queryKey: readonly unknown[], data: unknown) => {
    queryClient.setQueryData(queryKey, data);
  };

  return {
    clearOfflineCache,
    refetchAllQueries,
    getQueryData,
    setQueryData,
    isOnline: navigator.onLine,
  };
}

export default {
  useOfflineQuery,
  useOfflineMutation,
  usePortfolioData,
  usePriceData,
  useTradingHistory,
  useBalanceData,
  useCreateTrade,
  useUpdateTrade,
  useCancelTrade,
  useOfflineManager,
};
