import { useEffect, useMemo, useState } from 'react';
import getLatestPrices from '../../helper/price';
import type { DCADeals, GetLatestPricesResult } from '../../types';
import { logger } from '../loggerInstance';
import {
  calculateBatchUnrealizedPnL,
  type PriceData,
} from '../utils/unrealizedPnL';
import { useUsdRate } from '@/hooks/useUsdRate';

// Enhanced trade data with calculated unrealized PnL
export interface TradeWithUnrealizedPnL extends DCADeals {
  calculatedUnrealizedPnL: number | undefined;
}

/**
 * Custom hook to fetch market data and calculate unrealized PnL for deals
 */
export const useUnrealizedPnL = (deals: DCADeals[] = []) => {
  // State for price data from the price service
  const [latestPrices, setLatestPrices] = useState<PriceData[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState(false);

  // Fetch USD rate for unrealized PnL calculation using GraphQL
  const { rate: usdRateData } = useUsdRate();

  // Subscribe to price updates using the price service
  useEffect(() => {
    const unsubscribe = getLatestPrices(
      (result: GetLatestPricesResult) => {
        if (result.status === 'OK') {
          // Convert Prices type to PriceData[] type
          const priceData: PriceData[] = result.data.map((price) => ({
            symbol: price.symbol,
            price: price.price,
            exchange: price.exchange || 'binance', // Default exchange if undefined
          }));
          setLatestPrices(priceData);
          setPricesLoading(false);
          setPricesError(false);
        } else {
          setPricesError(true);
          setPricesLoading(false);
          logger.error('[useUnrealizedPnL] Price fetch failed:', result.reason);
        }
      },
      false // don't load US exchanges
    );

    return () => unsubscribe();
  }, []);

  // Calculate unrealized PnL for all deals
  const { unrealizedPnLMap, enhancedDeals } = useMemo(() => {
    // Extract USD rate
    const globalUsdRate = (usdRateData as { data?: number })?.data;

    // Calculate unrealized PnL for all deals
    const unrealizedPnLMap =
      latestPrices.length > 0
        ? calculateBatchUnrealizedPnL(deals, latestPrices, globalUsdRate)
        : {};

    // Create enhanced deals with calculated unrealized PnL
    const enhancedDeals: TradeWithUnrealizedPnL[] = deals.map((deal) => {
      const dealId = deal._id || deal.botId;
      const calculatedUnrealizedPnL = dealId
        ? unrealizedPnLMap[dealId]
        : undefined;

      return {
        ...deal,
        calculatedUnrealizedPnL,
      };
    });

    if (import.meta.env.DEV) {
      logger.debug('[useUnrealizedPnL] Calculation results:', {
        totalDeals: deals.length,
        availablePrices: latestPrices.length,
        globalUsdRate,
        calculatedDeals: Object.keys(unrealizedPnLMap).length,
        sampleResults: Object.entries(unrealizedPnLMap).slice(0, 3),
      });
    }

    return { unrealizedPnLMap, enhancedDeals };
  }, [deals, latestPrices, usdRateData]);

  return {
    // Market data
    latestPrices,
    globalUsdRate: (usdRateData as { data?: number })?.data,

    // Loading states
    isLoading: pricesLoading,
    isError: pricesError,

    // Calculated results
    unrealizedPnLMap,
    enhancedDeals,

    // Helper functions
    getUnrealizedPnL: (dealId: string) => unrealizedPnLMap[dealId],
    getTotalUnrealizedPnL: () =>
      Object.values(unrealizedPnLMap).reduce((sum, pnl) => sum + pnl, 0),
    getDealsWithPnL: () =>
      enhancedDeals.filter(
        (deal) => deal.calculatedUnrealizedPnL !== undefined
      ),
  };
};

/**
 * Helper function to get unrealized PnL for a specific deal
 */
export const getUnrealizedPnLForDeal = (
  deal: DCADeals,
  unrealizedPnLMap: Record<string, number>
): number => {
  const dealId = deal._id || deal.botId;
  const calculatedPnL = dealId ? unrealizedPnLMap[dealId] : undefined;

  // Use calculated PnL if available, otherwise fall back to existing value
  return calculatedPnL !== undefined
    ? calculatedPnL
    : (deal as DCADeals & { unrealizedProfit?: number }).unrealizedProfit || 0;
};
