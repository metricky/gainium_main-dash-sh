import { hedgeComboBotFragment } from '@/lib/api/GraphQLQueries-fragments';
import { useHedgeComboBotsStore } from '@/stores/live';
import { useShareContext } from './useShareContext';
import { useUIStore } from '@/stores/uiStore';
import { useEffect, useMemo } from 'react';
import { botQueries } from '../lib/api/GraphQLQueries-bot-queries';
import { logger } from '../lib/loggerInstance';
import type { BotStatus, HedgeBot } from '../types';
import type { HedgeComboBotListResponse } from '../types/hedgeComboBot';
import { useGraphQL } from './useGraphQL';

export interface HedgeComboBotsFilter {
  paperContext?: boolean;
  status?: BotStatus[];
  all?: boolean;
}

export interface UseHedgeComboBotsResult {
  data: HedgeComboBotListResponse | null;
  bots: HedgeBot[];
  total: number;
  hasValidResponse: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Mirrors `useDcaBots` for hedge-Combo bots. Reads from
 * `useHedgeComboBotsStore`, keeps it in sync with `hedgeComboBotList`
 * responses, and surfaces a paper/live-filtered view. WebSocket updates land
 * via `socketIntegration.ts` directly into the same store.
 */
export function useHedgeComboBots(
  filter?: HedgeComboBotsFilter,
  enabled?: boolean
): UseHedgeComboBotsResult {
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);
  const currentPaperContext = useMemo(
    () =>
      typeof filter?.paperContext === 'boolean'
        ? filter.paperContext
        : !isLiveTrading,
    [filter?.paperContext, isLiveTrading]
  );

  const botsRecord = useHedgeComboBotsStore((state) => state.bots);
  const hasHydrated = useHedgeComboBotsStore((state) => state._hasHydrated);

  const botsFromStore = useMemo(() => Object.values(botsRecord), [botsRecord]);

  const input: { status: BotStatus[] } = useMemo(
    () => ({
      status: filter?.status?.length
        ? filter.status
        : ['open', 'range', 'monitoring', 'error', 'closed'],
    }),
    [filter]
  );

  // Share-mode visitors must never fetch the visitor's hedge-combo list.
  const { isDemo } = useShareContext();
  const options = useMemo(
    () => ({
      paperContext:
        typeof filter?.paperContext === 'boolean'
          ? filter.paperContext
          : undefined,
      enabled: isDemo ? false : enabled,
    }),
    [filter?.paperContext, enabled, isDemo]
  );

  const queryResult = useGraphQL<HedgeComboBotListResponse>(
    'hedgeComboBotList',
    botQueries.hedgeComboBotList(input, hedgeComboBotFragment),
    options
  );

  // queryResult.data IS the hedgeComboBotList response payload
  // (`{ status, reason, total, data: HedgeBot[] }`) — useGraphQL has
  // already unwrapped the operation key, so the bots array sits at
  // .data directly. Same shape and mapping as useDcaBots.
  useEffect(() => {
    if (queryResult.data?.status === 'OK' && queryResult.data.data) {
      const list = Array.isArray(queryResult.data.data)
        ? queryResult.data.data
        : [];
      const normalizedBots = list.map((bot) => ({
        ...bot,
        paperContext:
          typeof bot.paperContext === 'boolean'
            ? bot.paperContext
            : currentPaperContext,
      }));
      useHedgeComboBotsStore.getState().updateBots(normalizedBots);
    }
  }, [currentPaperContext, queryResult.data]);

  if (queryResult.error) {
    const errorMessage = queryResult.error.message;
    logger.error('[useHedgeComboBots] Query error:', errorMessage);
  }

  const filteredBots = useMemo(
    () =>
      botsFromStore.filter((bot: HedgeBot) => {
        if (bot.paperContext !== currentPaperContext) {
          return false;
        }
        return true;
      }),
    [botsFromStore, currentPaperContext]
  );

  const isInitialLoad =
    !hasHydrated || (!botsFromStore.length && queryResult.isLoading);

  const result = useMemo(
    () => ({
      data: isDemo
        ? null
        : (queryResult.data as unknown as
            | HedgeComboBotListResponse
            | undefined) ?? null,
      bots: isDemo ? [] : filteredBots,
      total: isDemo
        ? 0
        : (queryResult.data as unknown as
            | HedgeComboBotListResponse
            | undefined)?.total ?? filteredBots.length,
      hasValidResponse: isDemo
        ? true
        : queryResult.data?.status === 'OK' || botsFromStore.length > 0,
      isLoading: isDemo ? false : isInitialLoad,
      isError: isDemo ? false : queryResult.isError,
      error: isDemo ? null : queryResult.error,
      refetch: queryResult.refetch,
    }),
    [
      isDemo,
      queryResult.data,
      filteredBots,
      botsFromStore.length,
      isInitialLoad,
      queryResult.isError,
      queryResult.error,
      queryResult.refetch,
    ]
  );
  return result;
}
