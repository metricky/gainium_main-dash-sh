import { useMinigridsStore } from '@/stores/live';
import { ComboMinigridStatusEnum } from '@/stores/live/minigridsStore';
import type { ComboMinigrid } from '@/types';
import React, { useEffect } from 'react';
import { botQueries } from '../lib/api/GraphQLQueries-bot-queries';
import { useGraphQL } from './useGraphQL';
import { useShareContext } from './useShareContext';

export interface UseComboMinigridsOptions {
  hedge?: boolean;
  status?: 'open' | 'closed';
  page?: number;
  shareId?: string;
}

export interface UseComboMinigridsResult {
  open: ComboMinigrid[];
  closed: ComboMinigrid[];
  all: ComboMinigrid[];
  totals: {
    open: number;
    closed: number;
  };
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown[]>;
}

function useSingleMinigridsQuery(
  botId: string,
  status: ComboMinigridStatusEnum,
  { hedge = false, page = 0, shareId }: UseComboMinigridsOptions = {}
) {
  // Hooks reading off useShareContext are safe at this top level — the
  // wrapper hook below only calls this from a fixed call-order context.
  const { shareId: ctxShareId } = useShareContext();
  const effectiveShareId = shareId ?? ctxShareId ?? undefined;

  const input = {
    id: botId,
    status,
    page,
    ...(effectiveShareId ? { shareId: effectiveShareId } : {}),
  };
  const { query, variables } = hedge
    ? botQueries.getHedgeComboBotMinigrids(input)
    : botQueries.getComboBotMinigrids(input);

  return useGraphQL<ComboMinigrid[]>(
    hedge ? 'getHedgeComboBotMinigrids' : 'getComboBotMinigrids',
    { query, variables },
    { shareId: effectiveShareId ?? null }
  );
}

export function useComboMinigrids(
  botId?: string,
  options?: UseComboMinigridsOptions
): UseComboMinigridsResult {
  // 1. Read from Zustand store (instant, filtered by botId)
  // Select the Record directly to avoid creating new array reference on every render
  const minigridsRecord = useMinigridsStore((state) => state.minigrids);

  // Convert to array for specific botId (memoized by minigridsRecord and botId)
  const minigridsFromStore = React.useMemo(
    () =>
      botId && minigridsRecord[botId]
        ? Object.values(minigridsRecord[botId])
        : [],
    [minigridsRecord, botId]
  );

  const enabled = Boolean(botId);

  // Backend expects 'open' / 'closed' (not 'active') — match legacy main-dash
  const openQuery = useSingleMinigridsQuery(
    botId || '',
    'open' as ComboMinigridStatusEnum,
    options
  );
  const closedQuery = useSingleMinigridsQuery(
    botId || '',
    ComboMinigridStatusEnum.closed,
    options
  );

  // Update store when queries succeed (React Query v5 pattern)
  useEffect(() => {
    if (openQuery.data?.status === 'OK' && openQuery.data.data && botId) {
      const minigrids = openQuery.data.data as ComboMinigrid[];
      useMinigridsStore.getState().updateMinigrids(botId, minigrids);
    }
  }, [openQuery.data, botId]);

  useEffect(() => {
    if (closedQuery.data?.status === 'OK' && closedQuery.data.data && botId) {
      const minigrids = closedQuery.data.data as ComboMinigrid[];
      useMinigridsStore.getState().updateMinigrids(botId, minigrids);
    }
  }, [closedQuery.data, botId]);

  // Filter store data by status
  const open = React.useMemo(
    () =>
      minigridsFromStore.filter(
        (mg) =>
          mg.status === ComboMinigridStatusEnum.active ||
          mg.status === ComboMinigridStatusEnum.range
      ),
    [minigridsFromStore]
  );
  const closed = React.useMemo(
    () =>
      minigridsFromStore.filter(
        (mg) => mg.status === ComboMinigridStatusEnum.closed
      ),
    [minigridsFromStore]
  );

  // Only show loading on initial load (when store data for this botId is empty)
  const isInitialLoad =
    minigridsFromStore.length === 0 &&
    (openQuery.isLoading || closedQuery.isLoading);
  const isLoading = !enabled || isInitialLoad;
  const isError = Boolean(openQuery.isError || closedQuery.isError);
  const error = openQuery.error || closedQuery.error || null;

  return {
    open,
    closed,
    all: React.useMemo(() => [...open, ...closed], [open, closed]),
    totals: {
      open: open.length,
      closed: closed.length,
    },
    isLoading,
    isError,
    error,
    refetch: async () =>
      Promise.all([openQuery.refetch(), closedQuery.refetch()]),
  };
}
