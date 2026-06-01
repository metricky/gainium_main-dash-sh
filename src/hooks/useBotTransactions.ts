import { useTransactionsStore } from '@/stores/live';
import type { Transaction } from '@/types';
import { useEffect, useMemo } from 'react';
import { botQueries } from '../lib/api/GraphQLQueries-bot-queries';
import type { ReturnResult } from '../lib/api/types';
import { useGraphQL } from './useGraphQL';
import { useShareContext } from './useShareContext';

export interface BotTransactionsData {
  transactions: Transaction[];
}

export interface UseBotTransactionsOptions {
  page?: number;
  shareId?: string;
}

export interface UseBotTransactionsResult {
  data: ReturnResult<BotTransactionsData> | null;
  transactions: Transaction[];
  hasValidResponse: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useBotTransactions(
  botId: string,
  options: UseBotTransactionsOptions = {}
): UseBotTransactionsResult {
  // 1. Read from Zustand store (instant, filtered by botId)
  // Select the Record directly to avoid creating new array reference on every render
  const transactionsRecord = useTransactionsStore(
    (state) => state.transactions
  );
  const hasHydrated = useTransactionsStore((state) => state._hasHydrated);

  // Convert to array for specific botId (memoized by transactionsRecord and botId)
  const transactionsFromStore = useMemo(
    () =>
      transactionsRecord[botId] ? Object.values(transactionsRecord[botId]) : [],
    [transactionsRecord, botId]
  );

  // Pick up the share-link id from the URL so the public read works
  // even without an access token.
  const { shareId: contextShareId } = useShareContext();
  const effectiveShareId = options.shareId ?? contextShareId ?? undefined;

  // Prepare input for GraphQL query
  const input: { id: string; page: number; shareId?: string } = {
    id: botId,
    page: options.page || 0,
  };

  if (effectiveShareId) {
    input.shareId = effectiveShareId;
  }

  // Get the query and variables from botQueries
  const { query, variables } = botQueries.getBotTransactions(input);

  // Use the GraphQL hook with proper caching
  const queryResult = useGraphQL<BotTransactionsData>(
    'getBotTransactions',
    {
      query,
      variables,
    },
    {
      shareId: effectiveShareId ?? null,
    }
  );

  // Update store when query succeeds (React Query v5 pattern)
  useEffect(() => {
    if (
      queryResult.data?.status === 'OK' &&
      queryResult.data.data.transactions
    ) {
      const transactions = queryResult.data.data.transactions;
      useTransactionsStore.getState().updateTransactions(botId, transactions);
    }
  }, [queryResult.data, botId]);

  // Only show loading on initial load (when store data for this botId is
  // empty) OR while IDB is still rehydrating — otherwise the table flashes
  // empty on hard refresh / HMR before cached transactions arrive.
  const isInitialLoad =
    !hasHydrated ||
    (transactionsFromStore.length === 0 && queryResult.isLoading);
  const hasValidResponse =
    queryResult.data?.status === 'OK' || transactionsFromStore.length > 0;

  return {
    data: queryResult.data || null,
    transactions: transactionsFromStore,
    hasValidResponse,
    isLoading: isInitialLoad, // Only show loading on first load
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}

// Helper function to format transaction for chart display
export const formatTransactionForChart = (transaction: Transaction) => ({
  side: transaction.side,
  time: transaction.updateTime,
  price: parseFloat(`${transaction.priceSell || transaction.priceBuy}`),
  id: transaction._id,
});
