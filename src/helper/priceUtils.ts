import { getLocalPrices, getPrices } from '../helper/price';
import { logger } from '../lib/loggerInstance';
import type { Prices } from '../types';

/**
 * Example function for getting prices directly (Promise-based)
 */
export const fetchPricesExample = async (): Promise<Prices | null> => {
  try {
    const prices = await getPrices(
      false, // loadUs - whether to include Binance US
      true // returnPrice - return the prices array
    );

    if (prices && prices.length > 0) {
      logger.debug('Fetched prices:', { count: prices.length, type: 'pairs' });

      // Find specific price
      const btcPrice = prices.find(
        (p) => p.symbol === 'BTCUSDT' && p.exchange === 'binance'
      )?.price;

      if (btcPrice) {
        logger.debug('BTC Price:', { price: btcPrice });
      }

      return prices;
    }

    return null;
  } catch (error) {
    logger.error('Failed to fetch prices:', error);

    // Fallback to cached prices
    const cachedPrices = getLocalPrices();
    if (cachedPrices && cachedPrices.length > 0) {
      logger.debug('Using cached prices as fallback');
      return cachedPrices;
    }

    throw new Error('No price data available');
  }
};

/**
 * Example function for getting cached prices (synchronous)
 */
export const getCachedPricesExample = () => {
  const cachedPrices = getLocalPrices();

  if (cachedPrices && cachedPrices.length > 0) {
    logger.debug('Using cached prices:', {
      count: cachedPrices.length,
      type: 'pairs',
    });

    // Find specific prices
    const btcPrice = cachedPrices.find(
      (p) => p.symbol === 'BTCUSDT' && p.exchange === 'binance'
    )?.price;

    const ethPrice = cachedPrices.find(
      (p) => p.symbol === 'ETHUSDT' && p.exchange === 'binance'
    )?.price;

    return {
      btcPrice,
      ethPrice,
      totalPairs: cachedPrices.length,
      prices: cachedPrices,
    };
  } else {
    logger.debug('No cached prices available');
    return null;
  }
};

/**
 * Helper function for price lookup
 */
export const findPrice = (
  symbol: string,
  exchange: string,
  prices: Prices
): number | undefined => {
  return prices.find((p) => p.symbol === symbol && p.exchange === exchange)
    ?.price;
};

/**
 * Helper function for finding price across multiple exchanges
 */
export const findPriceAnyExchange = (
  symbol: string,
  preferredExchanges: string[],
  prices: Prices
): { price: number; exchange: string } | undefined => {
  for (const exchange of preferredExchanges) {
    const price = findPrice(symbol, exchange, prices);
    if (price) {
      return { price, exchange };
    }
  }

  return undefined;
};
