import { useMemo } from 'react';
import {
  useBacktests,
  useComboBacktests,
  useGridBacktests,
  type BacktestData,
} from './useBacktests';
import { BotTypesEnum, type DataGridFilterInput } from '../types';
import type { DrawerBot } from '@/types/bots/drawer';

export interface BacktestSummary {
  totalBacktests: number;
  avgReturn: number;
  avgWinRate: number;
  recentBacktests: BacktestData[];
}

export interface UseBotBacktestSummaryResult {
  summary: BacktestSummary;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
  refetch: () => void;
}

export function useBotBacktestSummary(
  botId: string,
  bot: DrawerBot | undefined
): UseBotBacktestSummaryResult {
  // Determine bot type for appropriate hook
  const getBotType = (bot: DrawerBot | undefined): BotTypesEnum => {
    return bot?.type || BotTypesEnum.dca;
  };

  const botType = getBotType(bot);

  // Get backtests with limit for performance (only recent 10)
  const backtestFilters: DataGridFilterInput = {
    pageSize: 10,
    page: 0,
    sortModel: [{ field: 'created', sort: 'desc' }],
  };

  const dcaResult = useBacktests({
    filters: backtestFilters,
    enabled: botType === 'dca',
  });

  const comboResult = useComboBacktests({
    filters: backtestFilters,
    enabled: botType === 'combo',
  });

  const gridResult = useGridBacktests({
    filters: backtestFilters,
    enabled: botType === 'grid',
  });

  // Select the appropriate result based on bot type
  const result =
    botType === 'dca'
      ? dcaResult
      : botType === 'combo'
        ? comboResult
        : gridResult;

  const { backtests, isLoading, error, refetch } = result;

  // Filter backtests for this specific bot and calculate summary
  const summary = useMemo((): BacktestSummary => {
    if (!backtests || backtests.length === 0) {
      return {
        totalBacktests: 0,
        avgReturn: 0,
        avgWinRate: 0,
        recentBacktests: [],
      };
    }

    // If bot not loaded yet, return empty summary
    if (!bot) {
      return {
        totalBacktests: 0,
        avgReturn: 0,
        avgWinRate: 0,
        recentBacktests: [],
      };
    }

    // Filter backtests that match this bot's configuration
    const botBacktests = backtests.filter((backtest: BacktestData) => {
      // Match by symbol/pair
      const pairs = Array.isArray(backtest.settings?.pair)
        ? backtest.settings.pair
        : [backtest.settings?.pair].filter(
            (p): p is string => typeof p === 'string'
          );
      const symbolMatch = pairs.some((pair: string) =>
        (Array.isArray(bot.symbol)
          ? bot.symbol.map((s) => s.value)
          : [bot.symbol]
        )?.some((s) => s?.symbol === pair)
      );

      // Match by strategy (if available)
      const strategyMatch =
        !backtest.settings?.strategy ||
        backtest.settings.strategy === bot.settings?.strategy;

      // Match by exchange (if available)
      const exchangeMatch =
        !backtest.settings?.exchange ||
        backtest.settings.exchange === bot.exchange;

      return symbolMatch && strategyMatch && exchangeMatch;
    });

    if (botBacktests.length === 0) {
      return {
        totalBacktests: 0,
        avgReturn: 0,
        avgWinRate: 0,
        recentBacktests: [],
      };
    }

    // Calculate average return across recent backtests
    const avgReturn =
      botBacktests.reduce((sum: number, bt: BacktestData) => {
        return sum + (bt.financial?.netProfitTotalPerc || 0);
      }, 0) / botBacktests.length;

    // Calculate average win rate across recent backtests
    const avgWinRate =
      botBacktests.reduce((sum: number, bt: BacktestData) => {
        if (!bt.numerical?.all || bt.numerical.all === 0) return sum;
        const winRate = ((bt.numerical.profit || 0) / bt.numerical.all) * 100;
        return sum + winRate;
      }, 0) / botBacktests.length;

    return {
      totalBacktests: botBacktests.length,
      avgReturn: Math.round(avgReturn * 100) / 100, // Round to 2 decimal places
      avgWinRate: Math.round(avgWinRate * 100) / 100, // Round to 2 decimal places
      recentBacktests: botBacktests.slice(0, 5), // Show only 5 most recent
    };
  }, [backtests, bot]);

  return {
    summary,
    isLoading,
    error,
    refetch,
  };
}
