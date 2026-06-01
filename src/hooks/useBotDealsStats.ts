import { botQueries } from '../lib/api/GraphQLQueries-bot-queries';
import type { ReturnResult } from '../lib/api/types';
import { logger } from '../lib/loggerInstance';
import { useGraphQL } from './useGraphQL';
import { useShareContext } from './useShareContext';

export interface BotDealsStats {
  avgUsage: number;
  avgProfit: number;
  avgTradingTime: number;
  avgTimeInLoss: number;
  avgTimeInProfit: number;
  winRate: number;
}

export interface BotDealsStatsData {
  stats: BotDealsStats;
}

export type BotDealsStatsResponse = BotDealsStatsData;

export interface UseBotDealsStatsResult {
  data: ReturnResult<BotDealsStatsResponse> | null;
  stats: BotDealsStats | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useBotDealsStats(
  botId: string,
  shareId?: string
): UseBotDealsStatsResult {
  const { shareId: ctxShareId } = useShareContext();
  const effectiveShareId = shareId ?? ctxShareId ?? undefined;
  const input = { id: botId, ...(effectiveShareId && { shareId: effectiveShareId }) };
  const { query, variables } = botQueries.getBotDealsStats(input);

  const queryResult = useGraphQL<BotDealsStatsData>(
    'getBotDealsStats',
    {
      query,
      variables,
    },
    { shareId: effectiveShareId ?? null }
  );

  // If there's an error, log it
  if (queryResult.error) {
    logger.error('useBotDealsStats error:', queryResult.error);
  }

  return {
    data: queryResult.data || null,
    stats: queryResult.data?.data?.stats || null,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
