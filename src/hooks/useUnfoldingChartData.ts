import { useCallback, useMemo } from 'react';
import { useLiveBotMetrics } from './useLiveBotMetrics';
/* import { useDcaDeals, type DcaDeal } from './useDcaDeals'; */
import {
  useBacktests,
  type BacktestData,
  type UseBacktestsOptions,
} from './useBacktests';
import type { DrawerBot } from '@/types/bots/drawer';
import {
  coerceToTimestamp,
  downsamplePoints,
  filterByTimeframe,
  getLastTimestamp,
  mergeChartSources,
  sanitizeChartPoints,
  type RawChartPoint,
  type SanitizedChartPoint,
  type TimeframeKey,
} from '@/utils/chartData';
/* import type { DCADeals } from '@/types'; */

type ChartSource = 'live' | 'snapshot' | 'none';

export interface DealMarker {
  id: string;
  time: number;
  profitUsd?: number;
  profitQuote?: number;
  status?: string;
  paperContext?: boolean;
}

export interface UseUnfoldingChartDataOptions {
  botId?: string;
  bot?: DrawerBot | null;
  timeframe?: TimeframeKey;
  includeDeals?: boolean;
  includeBacktests?: boolean;
  enabled?: boolean;
}

export interface UseUnfoldingChartDataResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  isLoading: boolean;
  isError: boolean;
  error?: string;
  chart: {
    points: SanitizedChartPoint[];
    source: ChartSource;
    timeframe: TimeframeKey;
    lastUpdated: number | null;
  };
  /* deals: {
    markers: DealMarker[];
    isLoading: boolean;
    isError: boolean;
  }; */
  backtests: {
    data: BacktestData[];
    isLoading: boolean;
    isError: boolean;
  };
  refresh: () => void;
}

const DEFAULT_TIMEFRAME: TimeframeKey = 'all';

const extractSnapshotChart = (
  bot?: DrawerBot | (DrawerBot & { stats?: { chart?: unknown } }) | null
): RawChartPoint[] => {
  if (!bot) return [];

  const tryArray = (val: unknown): RawChartPoint[] | null =>
    Array.isArray(val) && val.length > 0 ? (val as RawChartPoint[]) : null;

  // Common locations (most likely first)
  const direct = (bot as unknown as { stats?: { chart?: unknown } })?.stats
    ?.chart;
  const rawStats = (
    bot as unknown as { rawData?: { stats?: { chart?: unknown } } }
  )?.rawData?.stats?.chart;

  // Sometimes the original snapshot is nested under rawData.original or rawData.snapshot
  const rawOriginal = (
    bot as unknown as {
      rawData?: { original?: { stats?: { chart?: unknown } } };
    }
  )?.rawData?.original?.stats?.chart;
  const rawSnapshot = (
    bot as unknown as {
      rawData?: { snapshot?: { stats?: { chart?: unknown } } };
    }
  )?.rawData?.snapshot?.stats?.chart;

  // Fallback: look for any 'chart' array one level down under known containers
  const candidates: Array<unknown> = [
    direct,
    rawStats,
    rawOriginal,
    rawSnapshot,
  ];
  for (const c of candidates) {
    const arr = tryArray(c);
    if (arr) return arr;
  }

  return [];
};

/* const mapDealsToMarkers = (
  deals: readonly DCADeals[],
  botId: string | undefined
): DealMarker[] => {
  if (!Array.isArray(deals) || deals.length === 0) {
    return [];
  }

  const markers: DealMarker[] = [];

  deals.forEach((deal) => {
    if (botId && deal.botId !== botId) {
      return;
    }

    const timestamp = coerceToTimestamp(
      deal?.createTime ?? (deal as { timestamp?: number | string }).timestamp
    );

    if (!Number.isFinite(timestamp)) {
      return;
    }

    const profitUsd =
      typeof deal?.profit?.totalUsd === 'number'
        ? deal.profit.totalUsd
        : typeof deal?.profit?.total === 'number'
          ? deal.profit.total
          : undefined;

    const profitQuote =
      typeof deal?.profit?.pureQuote === 'number'
        ? deal.profit.pureQuote
        : undefined;

    markers.push({
      id: deal._id ?? deal.botId,
      time: timestamp,
      profitUsd,
      profitQuote,
      status: deal.status,
      paperContext: deal.paperContext,
    });
  });

  return markers.sort((a, b) => a.time - b.time);
}; */

const filterBacktests = (
  backtests: readonly BacktestData[],
  bot?: DrawerBot | null,
  timeframe?: TimeframeKey
): BacktestData[] => {
  if (!bot || !Array.isArray(backtests) || backtests.length === 0) {
    return backtests.slice();
  }

  const targetPair = /* bot.coinPair ||  */ bot.pair;
  const targetExchange = bot.exchange;

  // Helper to coerce a meaningful timestamp for timeframe filtering
  const toTimestamp = (bt: BacktestData): number => {
    const last =
      bt.duration?.lastDataTime ?? bt.updated ?? bt.created ?? bt.time;
    return coerceToTimestamp(
      typeof last === 'string' || typeof last === 'number'
        ? (last as unknown as number | string)
        : undefined
    );
  };

  const filteredByBot = backtests.filter((backtest) => {
    const pairs = backtest.settings?.pair;
    const exchange = backtest.exchange || backtest.exchangeUUID;

    const pairMatches = Array.isArray(pairs)
      ? pairs.includes(targetPair)
      : typeof pairs === 'string'
        ? pairs === targetPair
        : true;

    const exchangeMatches = targetExchange ? exchange === targetExchange : true;

    return pairMatches && exchangeMatches;
  });

  if (!timeframe) {
    return filteredByBot;
  }

  // Apply timeframe window to backtests by their last/updated time
  const stamped = filteredByBot
    .map((bt) => ({ bt, t: toTimestamp(bt) }))
    .filter(({ t }) => Number.isFinite(t));

  const within = filterByTimeframe(
    stamped.map(({ t }) => ({ time: t })),
    timeframe
  );

  const allowedTimes = new Set(within.map((x) => x.time));
  return stamped
    .filter(({ t }) => allowedTimes.has(t))
    .map(({ bt }) => bt)
    .sort((a, b) => (toTimestamp(b) || 0) - (toTimestamp(a) || 0));
};

export function useUnfoldingChartData(
  options: UseUnfoldingChartDataOptions = {}
): UseUnfoldingChartDataResult {
  const {
    botId,
    bot,
    timeframe = DEFAULT_TIMEFRAME,
    /* includeDeals = true, */
    includeBacktests = true,
    enabled = true,
  } = options;

  const resolvedBotId = botId ?? bot?.id ?? '';
  const hasBotId = Boolean(resolvedBotId);
  const metricsEnabled = enabled && hasBotId;

  const {
    stats,
    isLoading: metricsLoading,
    error: metricsError,
  } = useLiveBotMetrics({
    botId: resolvedBotId,
    enabled: metricsEnabled,
  });

  /*  const dealsEnabled = metricsEnabled && includeDeals; */
  /*  const {
    deals: rawDeals,
    isLoading: dealsLoading,
    isError: dealsError,
    refetch: refetchDeals,
  } = useDcaDeals(includeDeals ? { botId: resolvedBotId } : undefined, {
    enabled: dealsEnabled,
  }); */

  const backtestsEnabled = metricsEnabled && includeBacktests;
  const backtestFilters = useMemo(() => {
    if (!backtestsEnabled) {
      return null;
    }

    const filters: NonNullable<UseBacktestsOptions['filters']> = {
      page: 0,
      pageSize: 25,
    };

    const resolvedPair = /* bot?.coinPair ??  */ bot?.pair;
    if (resolvedPair) {
      filters.pair = resolvedPair;
    }

    if (bot?.exchange) {
      filters.exchange = bot.exchange;
    }

    if (bot?.settings.strategy) {
      filters.strategy = bot.settings.strategy;
    }

    return filters;
  }, [
    backtestsEnabled,
    /*  bot?.coinPair, */
    bot?.exchange,
    bot?.pair,
    bot?.settings.strategy,
  ]);

  const {
    backtests,
    isLoading: backtestsLoading,
    error: backtestsError,
    refetch: refetchBacktests,
  } = useBacktests(
    backtestsEnabled
      ? {
          enabled: true,
          filters: backtestFilters ?? {
            page: 0,
            pageSize: 25,
          },
        }
      : { enabled: false }
  );

  const snapshotChart = useMemo(() => extractSnapshotChart(bot), [bot]);
  const chartSource = useMemo(
    () =>
      mergeChartSources(
        (stats?.chart as RawChartPoint[] | undefined) ?? undefined,
        snapshotChart
      ),
    [stats?.chart, snapshotChart]
  );

  const sanitizedChart = useMemo(() => {
    const sanitized = sanitizeChartPoints(chartSource as unknown as []);
    const filtered = filterByTimeframe(sanitized, timeframe);
    return downsamplePoints(filtered, 720);
  }, [chartSource, timeframe]);

  const chartSourceType: ChartSource = useMemo(() => {
    if (Array.isArray(stats?.chart) && stats.chart.length > 0) {
      return 'live';
    }
    if (Array.isArray(snapshotChart) && snapshotChart.length > 0) {
      return 'snapshot';
    }
    return 'none';
  }, [snapshotChart, stats?.chart]);

  /* const dealMarkers = useMemo(() => {
    if (!dealsEnabled) {
      return [];
    }

    const markers = mapDealsToMarkers(rawDeals, resolvedBotId);
    return filterByTimeframe(markers, timeframe);
  }, [dealsEnabled, rawDeals, resolvedBotId, timeframe]); */

  const relevantBacktests = useMemo(() => {
    if (!backtestsEnabled) {
      return [];
    }

    return filterBacktests(backtests, bot, timeframe);
  }, [backtests, backtestsEnabled, bot, timeframe]);

  // Don't block the chart when optional data (deals/backtests) is loading.
  // Only show the global loading state if metrics are loading AND we have no chart points to render yet.
  const blockingMetricsLoading = metricsLoading && sanitizedChart.length === 0;
  const combinedLoading = blockingMetricsLoading;

  // Treat deals/backtests errors as non-blocking for the main chart. Only metrics errors block the chart surface.
  const aggregatedError = useMemo(() => {
    if (!metricsEnabled) {
      return undefined;
    }

    if (metricsError) {
      return metricsError;
    }

    return undefined;
  }, [metricsEnabled, metricsError]);

  const status: UseUnfoldingChartDataResult['status'] = !metricsEnabled
    ? 'idle'
    : combinedLoading
      ? 'loading'
      : aggregatedError
        ? 'error'
        : 'success';

  const errorMessage = aggregatedError ?? null;

  const refresh = useCallback(() => {
    /* if (dealsEnabled) {
      void refetchDeals();
    } */
    if (backtestsEnabled) {
      void refetchBacktests();
    }
  }, [
    backtestsEnabled,
    /* dealsEnabled,  */ refetchBacktests /* , refetchDeals */,
  ]);

  return {
    status,
    isLoading: combinedLoading,
    isError: status === 'error',
    ...(errorMessage ? { error: errorMessage } : {}),
    chart: {
      points: sanitizedChart,
      source: chartSourceType,
      timeframe,
      lastUpdated: getLastTimestamp(sanitizedChart),
    },
    /* deals: {
      markers: dealMarkers,
      isLoading: dealsLoading,
      isError: dealsError,
    }, */
    backtests: {
      data: relevantBacktests,
      isLoading: backtestsLoading,
      isError: Boolean(backtestsError),
    },
    refresh,
  };
}
