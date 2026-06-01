import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { ExchangeIntervals, type ExchangeEnum } from '@/types';
import type { TradeChartPoint, TransformedTrade } from '@/types/dcaDeal';
import { requestCandles } from '@/utils/tradingView/historyApi';
import type { CandleResponse } from '@/utils/tradingView/types';
import { removePaperPrefix } from '@/utils/exchangeUtils';

/** A sparkline point plus the raw timestamp (ms), used to align order fills and
 *  the evolving take-profit line to the time axis. */
export interface DealPricePoint extends TradeChartPoint {
  ts: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_CANDLES = 200;

interface IntervalBucket {
  interval: ExchangeIntervals;
  ms: number;
}

/** Pick a candle interval based on how old the deal is. */
function pickInterval(ageMs: number): IntervalBucket {
  if (ageMs < 2 * HOUR_MS) return { interval: ExchangeIntervals.oneM, ms: 60 * 1000 };
  if (ageMs < DAY_MS) return { interval: ExchangeIntervals.fiveM, ms: 5 * 60 * 1000 };
  if (ageMs < 7 * DAY_MS) return { interval: ExchangeIntervals.oneH, ms: HOUR_MS };
  return { interval: ExchangeIntervals.oneD, ms: DAY_MS };
}

/**
 * Fetches a recent price history for a trade's symbol, bucketed by deal age,
 * and shapes it into the `{ time, price }[]` form the trade-card sparkline
 * consumes. Optionally appends a live `now` tail point from `currentPrice`.
 */
export function useDealPriceHistory(
  trade: TransformedTrade,
  currentPrice: number | null
): { priceData: DealPricePoint[]; isLoading: boolean } {
  const symbol =
    typeof trade.symbol === 'string' ? trade.symbol : trade.symbol.symbol;
  const exchange = removePaperPrefix(trade.exchange as ExchangeEnum);

  const now = Date.now();
  const created = trade.created || now - DAY_MS;
  const ageMs = now - created;
  const { interval, ms: intervalMs } = pickInterval(ageMs);

  const endAt = now;
  // Clamp start so we never request more than ~MAX_CANDLES candles.
  const earliestStart = endAt - MAX_CANDLES * intervalMs;
  const startAt = Math.max(created, earliestStart);

  // Round the start down to the interval boundary so duplicate
  // symbol/interval pairs across cards share a stable queryKey and dedupe.
  const bucketedStart = Math.floor(startAt / intervalMs) * intervalMs;

  const isIntraday =
    interval === ExchangeIntervals.oneM || interval === ExchangeIntervals.fiveM;

  const { data, isLoading } = useQuery({
    queryKey: ['dealCandles', exchange, symbol, interval, bucketedStart],
    queryFn: () =>
      requestCandles({
        symbol,
        exchange,
        type: interval,
        startAt: String(startAt),
        endAt: String(endAt),
        limit: MAX_CANDLES,
      }),
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: Boolean(symbol && exchange),
  });

  const priceData = useMemo<DealPricePoint[]>(() => {
    const candles: CandleResponse[] = data ?? [];
    const points: DealPricePoint[] = candles.map((c) => {
      const date = new Date(c.time);
      const time = isIntraday
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return { time, price: Number(c.close), ts: c.time };
    });

    if (typeof currentPrice === 'number' && Number.isFinite(currentPrice)) {
      const lastTs = points.length ? points[points.length - 1].ts : 0;
      points.push({ time: 'now', price: currentPrice, ts: lastTs + intervalMs });
    }

    return points;
  }, [data, currentPrice, isIntraday, intervalMs]);

  return { priceData, isLoading };
}
