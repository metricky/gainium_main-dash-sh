/**
 * DEPRECATED: useBotValue hooks
 *
 * These hooks have been deprecated in favor of the unified bot value calculation system.
 *
 * REPLACEMENT:
 * Instead of using these hooks, bot value calculations are now handled consistently
 * through the transformation layer:
 *
 * OLD APPROACH:
 * ```typescript
 * import { useBotValue, useReactiveBotValue } from '../hooks/useBotValue';
 * const { currentValue } = useReactiveBotValue(bot, allFees);
 * ```
 *
 * NEW APPROACH:
 * ```typescript
 * import { transformDcaBotToBot } from '../types/dcaBot';
 * import { getLocalPrices } from '../helper/price';
 *
 * // In your component
 * const latestPrices = getLocalPrices();
 * const transformedBot = transformDcaBotToBot(rawBot, latestPrices, allFees, userExchanges);
 * const currentValue = transformedBot.value; // Unified calculation
 * ```
 *
 * BENEFITS:
 * - Consistent value calculations across table, card, and drawer views
 * - Single source of truth for bot value calculation
 * - Matches old dashboard calculations exactly
 * - Better performance (no duplicate calculations)
 * - Simplified data flow
 *
 * These hooks were deprecated on 2025-09-19 as part of the Value Calculation
 * Unification project to fix discrepancies between new and old dashboard calculations.
 *
 * @deprecated Use transformDcaBotToBot with calculateBotValue instead
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DcaBot } from '../types/dcaBot';

// Deprecation warning
if (process.env['NODE_ENV'] === 'development') {
  console.warn(
    '⚠️ DEPRECATION WARNING: useBotValue hooks are deprecated. ' +
      'Use transformDcaBotToBot with calculateBotValue instead. ' +
      'See file header for migration guide.'
  );
}

/**
 * @deprecated Use transformDcaBotToBot with calculateBotValue instead
 */
export const useBotValue = (
  _bot: DcaBot | null,
  _allFees?: Array<{ exchange: string; symbol: string; fee: number }>
) => {
  console.warn(
    'useBotValue is deprecated. Use transformDcaBotToBot with calculateBotValue instead.'
  );

  return useMemo(
    () => ({
      currentValue: 0,
      totalProfit: 0,
      investedAmount: 0,
      valueChangePercent: 0,
      isProfit: true,
      marketPrice: 0,
    }),
    []
  );
};

/**
 * @deprecated Use transformDcaBotToBot with calculateBotValue instead
 */
export const useBotValues = (
  bots: DcaBot[],
  _allFees?: Array<{ exchange: string; symbol: string; fee: number }>
) => {
  console.warn(
    'useBotValues is deprecated. Use transformDcaBotToBot with calculateBotValue instead.'
  );

  return useMemo(() => {
    return bots.map((bot) => ({
      botId: bot._id,
      currentValue: 0,
      totalProfit: 0,
      investedAmount: 0,
      valueChangePercent: 0,
      isProfit: true,
      marketPrice: 0,
    }));
  }, [bots]);
};

/**
 * @deprecated Use transformDcaBotToBot with calculateBotValue instead
 */
export const usePriceUpdates = () => {
  console.warn(
    'usePriceUpdates is deprecated. Use getLocalPrices directly instead.'
  );

  return useQuery({
    queryKey: ['prices'],
    queryFn: () => [],
    refetchInterval: 30000,
    staleTime: 15000,
  });
};

/**
 * @deprecated Use transformDcaBotToBot with calculateBotValue instead
 */
export const useReactiveBotValue = (
  _bot: DcaBot | null,
  _allFees?: Array<{ exchange: string; symbol: string; fee: number }>
) => {
  console.warn(
    'useReactiveBotValue is deprecated. Use transformDcaBotToBot with calculateBotValue instead.'
  );

  const [isPriceServiceReady] = useState(false);

  const valueMetrics = useMemo(
    () => ({
      currentValue: 0,
      totalProfit: 0,
      investedAmount: 0,
      valueChangePercent: 0,
      isProfit: true,
      marketPrice: 0,
    }),
    []
  );

  return {
    ...valueMetrics,
    isPriceServiceReady,
    pricesCount: 0,
  };
};
