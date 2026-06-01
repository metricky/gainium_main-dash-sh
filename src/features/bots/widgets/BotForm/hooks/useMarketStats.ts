import { useEffect, useRef, useState } from 'react';

import {
  fetchMarketStats,
  normalizeSymbol,
  type MarketStats,
} from '@/utils/marketStats';
import { ExchangeEnum, ExchangeIntervals } from '@/types';

export interface UseMarketStatsArgs {
  symbol: string | null | undefined;
  exchange: ExchangeEnum | null | undefined;
  interval?: ExchangeIntervals;
  count?: number;
  enabled?: boolean;
}

export interface UseMarketStatsResult {
  data: MarketStats | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches recent-candle statistics for a (symbol, exchange) pair.
 * Returns the latest result immediately if cached, otherwise streams
 * `isLoading=true → data` once the candles arrive. Stays cached
 * across mounts (see fetchMarketStats's in-memory cache).
 */
export const useMarketStats = ({
  symbol,
  exchange,
  interval = ExchangeIntervals.oneD,
  count = 380,
  enabled = true,
}: UseMarketStatsArgs): UseMarketStatsResult => {
  const [data, setData] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const normalized = normalizeSymbol(symbol ?? '');
  const canFetch = Boolean(enabled && normalized && exchange);

  useEffect(() => {
    if (!canFetch) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    fetchMarketStats({
      symbol: normalized,
      exchange: exchange as ExchangeEnum,
      interval,
      count,
    })
      .then((stats) => {
        if (requestIdRef.current !== requestId) return;
        setData(stats);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  }, [canFetch, normalized, exchange, interval, count]);

  return { data, isLoading, error };
};
