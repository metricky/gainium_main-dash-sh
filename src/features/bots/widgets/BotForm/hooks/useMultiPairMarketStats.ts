import { useEffect, useRef, useState } from 'react';

import {
  fetchMarketStatsForPairs,
  normalizeSymbol,
  type MultiPairStatsResult,
} from '@/utils/marketStats';
import { ExchangeEnum, ExchangeIntervals } from '@/types';

export interface UseMultiPairMarketStatsArgs {
  symbols: ReadonlyArray<string>;
  exchange: ExchangeEnum | null | undefined;
  interval?: ExchangeIntervals;
  count?: number;
  /**
   * When false, the hook is dormant — it doesn't fetch and returns
   * `null` stats. Flip to true after the user opts in (e.g. clicks
   * "Recalculate across pairs"). Switching back to false clears
   * results.
   */
  enabled: boolean;
}

export interface UseMultiPairMarketStatsResult {
  result: MultiPairStatsResult | null;
  isLoading: boolean;
  error: Error | null;
  /** Force a re-fetch of the current symbol set. */
  refetch: () => void;
}

/**
 * Multi-pair sibling of `useMarketStats`. Fetches every symbol in
 * parallel and merges them into a worst-of MarketStats so the
 * calibrator can size the ladder for the most volatile coin in the
 * set. Re-fetches whenever the symbol set changes while enabled.
 */
export const useMultiPairMarketStats = ({
  symbols,
  exchange,
  interval = ExchangeIntervals.oneD,
  count = 380,
  enabled,
}: UseMultiPairMarketStatsArgs): UseMultiPairMarketStatsResult => {
  const [result, setResult] = useState<MultiPairStatsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);
  // Bump to force a re-fetch.
  const [nonce, setNonce] = useState(0);

  // Stable key: normalized + sorted symbols joined. Lets us put it in
  // the dependency array without React thrashing on array identity.
  const normalizedSymbols = symbols
    .map((s) => normalizeSymbol(s))
    .filter((s) => s.length > 0);
  const symbolKey = [...new Set(normalizedSymbols)].sort().join('|');

  const canFetch =
    enabled && Boolean(exchange) && normalizedSymbols.length > 0;

  useEffect(() => {
    if (!canFetch) {
      setResult(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    // Floor the loading window so cached responses still surface the
    // spinner — gives the user feedback that the recalc actually fired,
    // not just a silent re-render. 450ms is long enough to read the
    // label change without feeling laggy.
    const startedAt = performance.now();
    const MIN_LOADING_MS = 450;
    fetchMarketStatsForPairs({
      symbols: normalizedSymbols,
      exchange: exchange as ExchangeEnum,
      interval,
      count,
    })
      .then(async (res) => {
        const elapsed = performance.now() - startedAt;
        if (elapsed < MIN_LOADING_MS) {
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_LOADING_MS - elapsed)
          );
        }
        if (requestIdRef.current !== requestId) return;
        setResult(res);
        setIsLoading(false);
      })
      .catch(async (err: unknown) => {
        const elapsed = performance.now() - startedAt;
        if (elapsed < MIN_LOADING_MS) {
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_LOADING_MS - elapsed)
          );
        }
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
    // normalizedSymbols is collapsed into symbolKey to keep the
    // dependency array stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, symbolKey, exchange, interval, count, nonce]);

  return {
    result,
    isLoading,
    error,
    refetch: () => setNonce((n) => n + 1),
  };
};
