import { useMemo } from 'react';
import { useGraphQL } from './useGraphQL';
import { otherQueries } from '@/lib/api/GraphQLQueries-other-queries';
import type { GeneralOpenOrder, GeneralOpenPosition } from '@/types';

export interface UseExchangeOrdersResult {
  orders: GeneralOpenOrder[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseExchangePositionsResult {
  positions: GeneralOpenPosition[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Raw open-orders fetch for the Trading Terminal "Exchange" tab. Mirrors the
 * legacy `getAllOpenOrders` call: `'all'` (or falsy) means no `exchangeUUID`
 * filter (input `undefined`), a specific id filters to that exchange.
 *
 * `useGraphQL` already pulls the token from the auth store and derives the
 * paper-context header from the live/paper toggle, so live/paper changes
 * auto-refetch with no extra wiring. The hook returns `ReturnResult<TData>`
 * (already unwrapped to the operation field's value), so we read `q.data?.data`.
 */
export function useExchangeOrders(
  exchangeUUID: string, // 'all' => no filter
  enabled = true
): UseExchangeOrdersResult {
  const gql = useMemo(() => {
    const input =
      exchangeUUID && exchangeUUID !== 'all' ? { exchangeUUID } : undefined;
    return otherQueries.getAllOpenOrders(input);
  }, [exchangeUUID]);

  const q = useGraphQL<GeneralOpenOrder[]>('getAllOpenOrders', gql, {
    enabled: enabled && !!exchangeUUID, // legacy: falsy uuid clears + returns
  });

  const orders = q.data?.data ?? [];

  return {
    orders,
    isLoading: q.isLoading,
    error: (q.error as Error) ?? null,
    refetch: () => {
      void q.refetch();
    },
  };
}

/**
 * Raw open-positions fetch for the Trading Terminal "Exchange" tab. Same
 * conventions as {@link useExchangeOrders}.
 */
export function useExchangePositions(
  exchangeUUID: string,
  enabled = true
): UseExchangePositionsResult {
  const gql = useMemo(() => {
    const input =
      exchangeUUID && exchangeUUID !== 'all' ? { exchangeUUID } : undefined;
    return otherQueries.getAllOpenPositions(input);
  }, [exchangeUUID]);

  const q = useGraphQL<GeneralOpenPosition[]>('getAllOpenPositions', gql, {
    enabled: enabled && !!exchangeUUID,
  });

  const positions = q.data?.data ?? [];

  return {
    positions,
    isLoading: q.isLoading,
    error: (q.error as Error) ?? null,
    refetch: () => {
      void q.refetch();
    },
  };
}
