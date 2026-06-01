/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { useGraphQL } from './useGraphQL';
import { otherQueries } from '@/lib/api/GraphQLQueries-other-queries';
import { useTradingPairsFromContext } from '@/contexts/ExchangeDataContext';

interface MarketData {
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCapRank?: number;
  categories?: string[];
}

interface PairInfo {
  pair: string;
  exchange: string;
  baseAsset: {
    minAmount: number;
    maxAmount: number;
    step: number;
    name: string;
  };
  quoteAsset: {
    minAmount: number;
    name: string;
  };
  maxOrders: number;
  priceAssetPrecision: number;
  crossAvailable: boolean;
}

interface UseMarketDataResult {
  marketData: MarketData | null;
  pairInfo: PairInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useMarketData(
  pair: string,
  exchange: string
): UseMarketDataResult {
  // Extract base asset from pair (e.g., "BTCUSDT" -> "BTC")
  const baseAsset = useMemo(() => {
    if (!pair) return '';
    // Common quote assets to remove
    const quoteAssets = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'USD'];
    for (const quote of quoteAssets) {
      if (pair.endsWith(quote)) {
        return pair.slice(0, -quote.length).replace(/-/g, '').toLowerCase();
      }
    }
    return pair;
  }, [pair]);

  // Fetch coin market data
  const { query: coinQuery, variables: coinVariables } =
    otherQueries.getCoinData({
      assets: baseAsset ? [baseAsset] : [],
    });

  const coinDataResult = useGraphQL<{
    getCoins: {
      status: string;
      reason: string;
      data: {
        result: Array<{
          id: string;
          _id: string;
          symbol: string;
          market_cap_rank: number;
          categories: string[];
          market_data: {
            current_price: {
              usd: number;
            };
            price_change_percentage_24h: number;
          };
        }>;
      };
    };
  }>(
    'user',
    {
      query: coinQuery,
      variables: coinVariables,
    },
    {
      enabled: !!baseAsset,
      queryKey: ['user', 'getCoins', coinVariables],
    }
  );
  const {
    pairsByExchange,
    isLoading: isLoadingPairs,
    error: pairsError,
  } = useTradingPairsFromContext();
  const pairInfo = useMemo(
    () => pairsByExchange[exchange]?.find((p) => p.pair === pair) ?? null,
    [pairsByExchange, exchange, pair]
  );

  const marketData = useMemo(() => {
    if (!coinDataResult.data || coinDataResult.data.status !== 'OK')
      return null;

    // Type guard to check if data has the expected structure
    const responseData = coinDataResult.data as any;
    if (!responseData.getCoins?.data?.result?.[0]) return null;

    const coinData = responseData.getCoins.data.result[0];
    const currentPrice = coinData.market_data?.current_price?.usd || 0;
    const priceChangePercentage24h =
      coinData.market_data?.price_change_percentage_24h || 0;

    return {
      symbol: coinData.symbol,
      currentPrice,
      priceChange24h: (currentPrice * priceChangePercentage24h) / 100,
      priceChangePercentage24h,
      marketCapRank: coinData.market_cap_rank,
      categories: coinData.categories,
    };
  }, [coinDataResult.data]);

  const isLoading = coinDataResult.isLoading || isLoadingPairs;
  const error = coinDataResult.error || pairsError;

  // Only log non-400 errors in development (400 errors are expected for some pairs)
  if (import.meta.env.DEV && error && !error.message.includes('400')) {
    console.error('[useMarketData] Unexpected error:', error.message, {
      pair,
      exchange,
    });
  }

  return {
    marketData,
    pairInfo: pairInfo ? { ...pairInfo, maxOrders: 200 } : null,
    isLoading,
    error: error?.message || null,
  };
}
