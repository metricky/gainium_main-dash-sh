import { useUIStore } from '@/stores/uiStore';
import { useIsFetching } from '@tanstack/react-query';

export type TradingContext = 'live' | 'paper' | 'demo';

/**
 * React hook that reports whether the active trading context is still loading
 * its data — i.e. the window a user perceives as "switching" after toggling
 * live↔paper.
 *
 * The toggle flips `isLiveTrading` instantly (optimistic), but the data for the
 * new context is refetched in the background. This scopes `useIsFetching` to the
 * active context (the 4th element of the cache key built in `useCacheKey`), so
 * the indicator tracks the real network wait rather than a render frame.
 */
export function useTradingModeSwitching(): {
  isSwitching: boolean;
  context: TradingContext;
} {
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);
  const tradingMode = useUIStore((s) => s.tradingMode);

  const context: TradingContext =
    tradingMode === 'demo' ? 'demo' : isLiveTrading ? 'live' : 'paper';

  const fetchingCount = useIsFetching({
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey[3] === context,
  });

  return { isSwitching: fetchingCount > 0, context };
}
