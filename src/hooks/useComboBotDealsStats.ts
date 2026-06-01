import { useMemo } from 'react';
import { botQueries } from '../lib/api/GraphQLQueries-bot-queries';
import { useGraphQL } from './useGraphQL';
import { useShareContext } from './useShareContext';

export interface ComboBotDealsStatsData {
  stats: {
    avgUsage: number;
    avgProfit: number;
    avgTradingTime: number;
    avgTimeInLoss: number;
    avgTimeInProfit: number;
    winRate: number;
  };
}

/**
 * Fetches combo bot deals stats (win rate, avg profit, etc.)
 * via the getComboBotDealsStats GraphQL query.
 *
 * This is the reliable source for combo bot win rate because
 * stats.numerical.deals may not be recalculated by the backend.
 */
export function useComboBotDealsStats(botId: string, enabled = true) {
  const { shareId } = useShareContext();
  const { query, variables } = botQueries.getComboBotDealsStats({
    id: botId,
    ...(shareId ? { shareId } : {}),
  });

  const queryResult = useGraphQL<ComboBotDealsStatsData>(
    'getComboBotDealsStats',
    { query, variables },
    { enabled: enabled && Boolean(botId), shareId }
  );

  const stats = useMemo(() => {
    if (!queryResult.data || queryResult.data.status !== 'OK') return null;
    return queryResult.data.data?.stats ?? null;
  }, [queryResult.data]);

  return {
    stats,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
  };
}
