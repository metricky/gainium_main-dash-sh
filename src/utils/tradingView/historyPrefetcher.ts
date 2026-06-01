import { logger } from '@/lib/loggerInstance';
import {
  ExchangeEnum,
  timeIntervalMap,
  type ExchangeIntervals,
  type Symbols,
} from '@/types';
import { getExchangeHandler } from './factory';
import { RESOLUTION_TO_INTERVAL_MAP, getCandles } from './historyApi';
import type { LibrarySymbolInfo } from './types';

const PREFETCH_THRESHOLD_BARS = 5; // Very aggressive - trigger after scrolling just 5 bars left
const PREFETCH_CHUNK_BARS = 400;
const MIN_REQUEST_INTERVAL_MS = 2500;

interface PrefetchState {
  earliestMs: number;
  nextTriggerMs: number;
  lastRequestMs: number;
  inFlight?: Promise<void>;
}

const stateByKey = new Map<string, PrefetchState>();

const toKey = (symbol: string, resolution: string): string =>
  `${symbol.toUpperCase()}|${resolution}`;

const now = (): number => Date.now();

const resolutionToIntervalMs = (resolution: string): number | null => {
  const mapped: ExchangeIntervals | undefined =
    RESOLUTION_TO_INTERVAL_MAP[resolution];

  if (mapped) {
    const intervalMs = timeIntervalMap[mapped];
    if (typeof intervalMs === 'number') {
      logger.debug(
        '[ScrollLoadBars] Resolution mapped via RESOLUTION_TO_INTERVAL_MAP',
        {
          resolution,
          mapped,
          intervalMs,
        }
      );
      return intervalMs;
    }
  }

  const numericValue = Number(resolution);
  if (!Number.isNaN(numericValue) && numericValue > 0) {
    const intervalMs = numericValue * 60 * 1000;
    logger.debug('[ScrollLoadBars] Resolution converted as numeric minutes', {
      resolution,
      numericValue,
      intervalMs,
    });
    return intervalMs;
  }

  if (resolution.length > 1) {
    const suffix = resolution.charAt(resolution.length - 1).toUpperCase();
    const value = Number(resolution.slice(0, -1));
    if (!Number.isNaN(value) && value > 0) {
      let intervalMs: number | null = null;
      switch (suffix) {
        case 'D':
          intervalMs = value * 24 * 60 * 60 * 1000;
          break;
        case 'W':
          intervalMs = value * 7 * 24 * 60 * 60 * 1000;
          break;
        case 'M':
          // Approximate month as 30 days
          intervalMs = value * 30 * 24 * 60 * 60 * 1000;
          break;
        case 'H':
          intervalMs = value * 60 * 60 * 1000;
          break;
        default:
          break;
      }
      if (intervalMs != null) {
        logger.debug('[ScrollLoadBars] Resolution converted with suffix', {
          resolution,
          suffix,
          value,
          intervalMs,
        });
        return intervalMs;
      }
    }
  }

  logger.warn('[ScrollLoadBars] Could not parse resolution to interval', {
    resolution,
  });
  return null;
};

const buildLibrarySymbolInfo = (
  symbolMeta: Symbols,
  resolution: string,
  symbolId: string
): LibrarySymbolInfo => {
  const exchangeName = String(symbolMeta.exchange).toUpperCase();
  const description = `${symbolMeta.baseAsset.name} / ${symbolMeta.quoteAsset.name}`;

  return {
    ticker: `${symbolMeta.pair}@${exchangeName}`,
    name: symbolMeta.pair,
    full_name: symbolId,
    description,
    exchange: exchangeName,
    listed_exchange: exchangeName,
    type: 'crypto',
    currency_code: symbolMeta.quoteAsset.name,
    session: '24x7',
    timezone: 'UTC',
    minmov: 1,
    pricescale: 100,
    supported_resolutions: [resolution],
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    data_status: 'streaming',
    format: 'price',
  };
};

interface PrefetchParams {
  symbolId: string;
  symbolMeta: Symbols;
  resolution: string;
  range?: { from: number; to: number } | null;
}

const updateNextTrigger = (entry: PrefetchState, intervalMs: number): void => {
  entry.nextTriggerMs = entry.earliestMs - PREFETCH_THRESHOLD_BARS * intervalMs;
};

const scheduleManualFetch = async (
  key: string,
  entry: PrefetchState,
  resolution: string,
  intervalMs: number
): Promise<void> => {
  const fetchToMs = Math.max(entry.earliestMs - intervalMs, 0);
  const targetBars = Math.max(PREFETCH_CHUNK_BARS, PREFETCH_THRESHOLD_BARS * 2);

  if (fetchToMs <= 0) {
    logger.debug('[ScrollLoadBars] Manual fetch skipped - reached time zero', {
      key,
      earliestMs: entry.earliestMs,
    });
    updateNextTrigger(entry, intervalMs);
    return;
  }

  logger.info('[ScrollLoadBars] Triggering manual history extension', {
    key,
    targetBars,
    fetchToMs: new Date(fetchToMs).toISOString(),
    earliestMs: new Date(entry.earliestMs).toISOString(),
  });

  entry.earliestMs = Math.min(entry.earliestMs, fetchToMs);

  entry.earliestMs = Math.max(0, entry.earliestMs);

  updateNextTrigger(entry, intervalMs);
};

const scheduleExchangeFetch = async (
  key: string,
  entry: PrefetchState,
  symbolMeta: Symbols,
  symbolId: string,
  resolution: string,
  intervalMs: number
): Promise<void> => {
  const fetchToMs = Math.max(entry.earliestMs - intervalMs, 0);
  const fetchFromMs = Math.max(fetchToMs - PREFETCH_CHUNK_BARS * intervalMs, 0);

  if (fetchToMs <= fetchFromMs) {
    logger.debug('[ScrollLoadBars] Exchange fetch skipped - invalid range', {
      key,
      fetchFromMs,
      fetchToMs,
    });
    updateNextTrigger(entry, intervalMs);
    return;
  }

  logger.info('[ScrollLoadBars] Triggering exchange history prefetch', {
    key,
    fetchFromMs: new Date(fetchFromMs).toISOString(),
    fetchToMs: new Date(fetchToMs).toISOString(),
    chunkBars: PREFETCH_CHUNK_BARS,
  });

  const handler = await getExchangeHandler(symbolMeta.exchange);
  const symbolInfo = buildLibrarySymbolInfo(symbolMeta, resolution, symbolId);
  const bars = await getCandles(
    symbolInfo,
    resolution,
    {
      from: Math.floor(fetchFromMs / 1000),
      to: Math.floor(fetchToMs / 1000),
      countBack: PREFETCH_CHUNK_BARS,
      firstDataRequest: false,
    },
    handler
  );

  logger.info('[ScrollLoadBars] Exchange history prefetch completed', {
    key,
    barsReceived: bars.length,
    oldestBarTime:
      bars.length > 0 ? new Date(bars[0].time).toISOString() : null,
  });

  if (bars.length > 0) {
    entry.earliestMs = Math.min(entry.earliestMs, bars[0].time);
  } else {
    entry.earliestMs = Math.min(entry.earliestMs, fetchFromMs);
  }

  entry.earliestMs = Math.max(0, entry.earliestMs);

  updateNextTrigger(entry, intervalMs);
};

export const maybePrefetchHistory = async ({
  symbolId,
  symbolMeta,
  resolution,
  range,
}: PrefetchParams): Promise<void> => {
  logger.debug('[ScrollLoadBars] maybePrefetchHistory called', {
    symbolId,
    exchange: symbolMeta.exchange,
    resolution,
    range: range
      ? {
          from: new Date(range.from * 1000).toISOString(),
          to: new Date(range.to * 1000).toISOString(),
        }
      : null,
  });

  const intervalMs = resolutionToIntervalMs(resolution);
  if (intervalMs == null) {
    logger.warn('[ScrollLoadBars] Could not determine interval, aborting', {
      symbolId,
      resolution,
    });
    return;
  }

  const key = toKey(symbolId, resolution);
  const rangeFromMs = range?.from ? range.from * 1000 : null;

  const existing = stateByKey.get(key);

  if (!existing) {
    if (rangeFromMs == null) {
      logger.debug(
        '[ScrollLoadBars] No existing state, no range provided - skipping',
        {
          key,
        }
      );
      return;
    }
    const entry: PrefetchState = {
      earliestMs: rangeFromMs,
      nextTriggerMs: rangeFromMs - PREFETCH_THRESHOLD_BARS * intervalMs,
      lastRequestMs: 0,
    };
    stateByKey.set(key, entry);
    logger.info('[ScrollLoadBars] Initialized prefetch state', {
      key,
      earliestMs: new Date(entry.earliestMs).toISOString(),
      nextTriggerMs: new Date(entry.nextTriggerMs).toISOString(),
      thresholdBars: PREFETCH_THRESHOLD_BARS,
    });
    return;
  }

  if (rangeFromMs != null && rangeFromMs < existing.earliestMs) {
    const oldEarliest = existing.earliestMs;
    existing.earliestMs = rangeFromMs;
    updateNextTrigger(existing, intervalMs);
    logger.debug('[ScrollLoadBars] Updated earliest timestamp', {
      key,
      oldEarliest: new Date(oldEarliest).toISOString(),
      newEarliest: new Date(existing.earliestMs).toISOString(),
      nextTriggerMs: new Date(existing.nextTriggerMs).toISOString(),
    });
  }

  if (existing.inFlight) {
    logger.debug('[ScrollLoadBars] Prefetch already in flight, skipping', {
      key,
    });
    return;
  }

  // Check if the visible range is getting close to the earliest known data
  // Trigger when we're within a small margin of the earliest data OR past the trigger threshold
  const marginBars = 3; // Allow triggering if within 3 bars of earliest data
  const marginMs = marginBars * intervalMs;
  const isNearEarliestData =
    rangeFromMs != null && rangeFromMs <= existing.earliestMs + marginMs;
  const isPastTrigger =
    rangeFromMs != null && rangeFromMs <= existing.nextTriggerMs;

  if (rangeFromMs == null || (!isNearEarliestData && !isPastTrigger)) {
    logger.debug(
      '[ScrollLoadBars] Range not past trigger threshold, skipping',
      {
        key,
        rangeFromMs: rangeFromMs ? new Date(rangeFromMs).toISOString() : null,
        earliestMs: new Date(existing.earliestMs).toISOString(),
        earliestPlusMargin: new Date(
          existing.earliestMs + marginMs
        ).toISOString(),
        nextTriggerMs: new Date(existing.nextTriggerMs).toISOString(),
        thresholdBars: PREFETCH_THRESHOLD_BARS,
        marginBars,
        isNearEarliestData,
        isPastTrigger,
        explanation:
          rangeFromMs == null
            ? 'No range provided'
            : `Range from (${new Date(rangeFromMs).toISOString()}) is after trigger point (${new Date(existing.nextTriggerMs).toISOString()}) and not near earliest data, need to scroll further left`,
      }
    );
    return;
  }

  const timeSinceLastRequest = now() - existing.lastRequestMs;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    logger.debug('[ScrollLoadBars] Throttling - too soon since last request', {
      key,
      timeSinceLastRequest,
      minInterval: MIN_REQUEST_INTERVAL_MS,
    });
    return;
  }

  logger.info('[ScrollLoadBars] Prefetch triggered', {
    key,
    rangeFromMs: rangeFromMs ? new Date(rangeFromMs).toISOString() : null,
    earliestMs: new Date(existing.earliestMs).toISOString(),
    nextTriggerMs: new Date(existing.nextTriggerMs).toISOString(),
    exchange: symbolMeta.exchange,
  });

  const run = async () => {
    try {
      if (symbolMeta.exchange === ExchangeEnum.ManualBacktesting) {
        await scheduleManualFetch(key, existing, resolution, intervalMs);
      } else {
        await scheduleExchangeFetch(
          key,
          existing,
          symbolMeta,
          symbolId,
          resolution,
          intervalMs
        );
      }
    } catch (error) {
      logger.error('[ScrollLoadBars] Prefetch failed', {
        key,
        error,
      });
      // Push the trigger slightly further left to avoid tight retry loops
      existing.earliestMs -= PREFETCH_THRESHOLD_BARS * intervalMs;
      existing.earliestMs = Math.max(0, existing.earliestMs);
      updateNextTrigger(existing, intervalMs);
    } finally {
      existing.lastRequestMs = now();
      delete existing.inFlight;
      logger.debug('[ScrollLoadBars] Prefetch completed', { key });
    }
  };

  const promise = run();
  existing.inFlight = promise;
  await promise;
};
