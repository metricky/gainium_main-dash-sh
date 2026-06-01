import type { DCABot, Prices } from '../../types';
import { logger } from '../loggerInstance';
import { findUSDRate } from './unrealizedPnL';

/**
 * Math helper functions matching the old dashboard's math.ts
 */
class MathHelper {
  convertFromExponential(num: number, precision: number): string {
    return Number(num)
      .toFixed(Math.min(precision, 20))
      .replace(/(\.\d*?[1-9])0+$/, '$1')
      .replace(/\.*$/, '');
  }

  round(_num: number, precision = 2, down = false, up = false): number {
    let num = `${_num}`;
    if (`${_num}`.indexOf('e') !== -1) {
      num = this.convertFromExponential(_num, precision + 2);
    }
    const intPart = num.split('.')[0];
    // Handle precision overflow (matches old dashboard - lines 17-19)
    if ((intPart?.length ?? 0) + precision > 20) {
      precision = 20 - intPart.length;
    }

    if (down) {
      const res = Number(
        `${Math.floor(Number(`${num}e${precision}`))}e-${precision}`
      );
      return isNaN(res) ? 0 : res;
    }
    if (up) {
      const res = Number(
        `${Math.ceil(Number(`${num}e${precision}`))}e-${precision}`
      );
      return isNaN(res) ? 0 : res;
    }
    const res = Number(
      `${Math.round(Number(`${num}e${precision}`))}e-${precision}`
    );
    return isNaN(res) ? 0 : res;
  }
}

const math = new MathHelper();

/**
 * Helper function to sum balances with USD conversion (matches old dashboard)
 */
const sumBalances = (
  balances: { key: string; value: number }[],
  rates: {
    [key: string]: { symbol: string; price: number; exchange?: string };
  },
  symbols: {
    key: string;
    value: { symbol: string; baseAsset: string; quoteAsset: string };
  }[],
  base?: boolean
): number => {
  const result = balances.reduce((acc, { key, value }) => {
    const sym = symbols.filter(
      (s) => s.value.baseAsset === key || s.value.quoteAsset === key
    );
    if (!sym.length) return acc;
    const rate = sym.map((s) => rates[s.value.symbol]).filter(Boolean)[0];
    if (!rate) return acc;
    const contribution = value * (base ? 1 / rate.price : rate.price);
    logger.info(
      `[sumBalances] ${key}: ${value} * ${base ? 1 / rate.price : rate.price} = ${contribution}`
    );
    return acc + contribution;
  }, 0);
  logger.info(`[sumBalances] Total result: ${result}, base: ${base}`);
  return result;
};

/**
 * Helper function to sum pure balances (matches old dashboard)
 */
const sumPureBalances = (
  balances: { key: string; value: number }[]
): number => {
  const result = balances.reduce((acc, { key, value }) => {
    logger.info(`[sumPureBalances] ${key}: ${value}`);
    return acc + value;
  }, 0);
  logger.info(`[sumPureBalances] Total result: ${result}`);
  return result;
};

/**
 * Complex unrealized P&L calculation matching old dashboard logic EXACTLY
 * This implements the sophisticated calculation from the old dashboard's utils.tsx
 */
export const calculateComplexUnrealizedPnL = (
  dcaBot: DCABot,
  prices: Prices = [],
  allFees?: Array<{ exchange: string; symbol: string; fee: number }>
): number => {
  try {
    // Get bot settings
    const settings = dcaBot.settings;
    const long = settings.strategy === 'LONG';
    const futures = settings.futures;
    const coinm = settings.coinm;

    // Get exchange info
    const exchange = dcaBot.exchange;

    // Get current and initial balances
    const currentBalances = dcaBot.currentBalances;
    const initialBalances = dcaBot.initialBalances;

    // DEBUG: Log all input data
    logger.info('[ComplexValue] DEBUG - Bot data:', {
      botId: dcaBot._id,
      botName: dcaBot.settings?.name,
      strategy: settings.strategy,
      long,
      futures,
      coinm,
      exchange,
      currentBalances,
      initialBalances,
      pricesCount: prices.length,
      symbol: dcaBot.symbol,
    });

    if (!currentBalances || !initialBalances) {
      console.warn('[ComplexValue] Missing balance data for bot:', dcaBot._id, {
        currentBalances,
        initialBalances,
      });
      return 0;
    }

    // Calculate USD rate for the bot's quote asset (matches old dashboard logic)
    const quoteAsset = dcaBot.symbol?.[0]?.value?.quoteAsset || 'USDT';
    const baseAsset = dcaBot.symbol?.[0]?.value?.baseAsset || 'BTC';

    // Convert Prices to PriceData format (ensure exchange is always present)
    const priceData = prices.map((p) => ({
      symbol: p.symbol,
      price: p.price,
      exchange: p.exchange || 'all',
    }));

    const usdRate = futures
      ? coinm
        ? findUSDRate(baseAsset, priceData, exchange)
        : findUSDRate(quoteAsset, priceData, exchange)
      : long
        ? findUSDRate(quoteAsset, priceData, exchange)
        : findUSDRate(baseAsset, priceData, exchange);

    if (!usdRate || usdRate === 0) {
      logger.warn('[ComplexValue] No USD rate found for:', quoteAsset);
      return 0;
    }

    // Note: usdRatesQuote and usdRatesBase are created but not used in the current implementation
    // They are kept for future use if needed for combo bot calculations

    // Create bot symbols array (matches old dashboard exactly)
    const botSymbols = dcaBot.symbol.concat(
      ...currentBalances.base.flatMap((bv) => {
        const quoteKey = currentBalances.quote[0]?.key || 'USDT';
        const name1 = `${bv.key}${quoteKey}`;
        const name2 = `${bv.key}-${quoteKey}`;
        return [
          {
            key: name1,
            value: {
              symbol: name1,
              baseAsset: bv.key,
              quoteAsset: quoteKey,
            },
          },
          {
            key: name2,
            value: {
              symbol: name2,
              baseAsset: bv.key,
              quoteAsset: quoteKey,
            },
          },
        ];
      }),
      ...currentBalances.quote.flatMap((qv) => {
        const name1 = `${qv.key}${currentBalances.quote[0]?.key || 'USDT'}`;
        const name2 = `${qv.key}-${currentBalances.quote[0]?.key || 'USDT'}`;
        return [
          {
            key: name1,
            value: {
              symbol: name1,
              baseAsset: qv.key,
              quoteAsset: currentBalances.quote[0]?.key || 'USDT',
            },
          },
          {
            key: name2,
            value: {
              symbol: name2,
              baseAsset: qv.key,
              quoteAsset: currentBalances.quote[0]?.key || 'USDT',
            },
          },
        ];
      })
    );

    // Create findRates object (matches old dashboard)
    const findRates = botSymbols.reduce((acc, { key: _key, value }) => {
      const rate = priceData.find((p) => p.symbol === value.symbol) || {
        symbol: value.symbol,
        price: 0,
        exchange: 'all',
      };
      logger.info(`[findRates] ${value.symbol}: ${rate.price}`);
      return {
        ...acc,
        [value.symbol]: rate,
      };
    }, {});

    // Calculate currentValues and maxValue (matches old dashboard)
    const active =
      (dcaBot.usage?.current?.quote || 0) !== 0 ||
      (dcaBot.usage?.current?.base || 0) !== 0;
    let currentValues = 0;
    // let maxValue = 0; // Not used for non-combo bots
    let unPnl = 0;
    let unPnlPerc = 0;

    if (active) {
      // Calculate currentValues (matches old dashboard logic)
      currentValues = math.round(
        (futures
          ? coinm
            ? dcaBot.usage?.current?.base || 0
            : dcaBot.usage?.current?.quote || 0
          : long
            ? dcaBot.usage?.current?.quote || 0
            : dcaBot.usage?.current?.base || 0) * usdRate
      );

      // Calculate maxValue (matches old dashboard logic - line 486-493)
      // maxValue = math.round(
      //   (futures
      //     ? coinm
      //       ? (dcaBot.usage?.max?.base || 0)
      //       : (dcaBot.usage?.max?.quote || 0)
      //     : long
      //     ? (dcaBot.usage?.max?.quote || 0)
      //     : (dcaBot.usage?.max?.base || 0)) * usdRate
      // );
    }

    // Check if we have valid rates (matches old dashboard logic)
    if (
      active &&
      Object.values(findRates).some(
        (r) =>
          typeof r === 'object' &&
          r !== null &&
          'price' in r &&
          (r as { price: number }).price !== 0
      )
    ) {
      // Calculate unPnl based on strategy and futures mode (EXACT old dashboard logic)
      unPnl = long
        ? sumBalances(currentBalances.base, findRates, botSymbols) +
          sumPureBalances(currentBalances.quote) -
          sumPureBalances(initialBalances.quote)
        : sumBalances(currentBalances.quote, findRates, botSymbols, true) -
          (sumPureBalances(initialBalances.base) -
            sumPureBalances(currentBalances.base));

      if (futures) {
        if (coinm) {
          unPnl = long
            ? sumPureBalances(currentBalances.base) +
              sumBalances(currentBalances.quote, findRates, botSymbols, true) -
              sumBalances(initialBalances.quote, findRates, botSymbols, true)
            : sumBalances(currentBalances.quote, findRates, botSymbols, true) -
              (sumPureBalances(initialBalances.base) -
                sumPureBalances(currentBalances.base));
        } else {
          unPnl = long
            ? sumBalances(currentBalances.base, findRates, botSymbols) +
              sumPureBalances(currentBalances.quote) -
              sumPureBalances(initialBalances.quote)
            : sumPureBalances(currentBalances.quote) -
              (sumBalances(initialBalances.base, findRates, botSymbols) -
                sumBalances(currentBalances.base, findRates, botSymbols));
        }
      }

      // Apply USD rate conversion (matches old dashboard - line 666)
      unPnl *= usdRate;

      // Handle dealsReduceForBot (matches old dashboard logic - line 756+)
      // For non-combo bots: usage = currentValues (line 754)
      let usage = currentValues;
      let tpUsage = 0;

      if (dcaBot.dealsReduceForBot?.length) {
        for (const d of dcaBot.dealsReduceForBot) {
          const u = math.round(
            futures ? (coinm ? d.base : d.quote) : long ? d.quote : d.base
          );
          usage += u;
          tpUsage += u;
          unPnl += d.profitUsd;
        }
      }

      // Calculate unPnlPerc with proper fee logic (matches old dashboard - lines 773-785)
      // Use actual fee from allFees array like old dashboard does
      const fee =
        allFees?.find(
          (f) =>
            f.exchange === dcaBot.exchangeUUID &&
            f.symbol === dcaBot.settings.pair[0]
        )?.fee ?? 0.002; // fallback to 0.002 if not found
      const combo = false; // DCA bots are not combo bots

      if (!combo && !tpUsage) {
        // No take profit usage - apply standard fee calculation (line 773-776)
        unPnlPerc = unPnl / usage;
        unPnlPerc -= fee * 2;
        unPnl = usage * unPnlPerc;
      }
      if (!combo && tpUsage) {
        // Has take profit usage - apply different fee calculation (line 778-781)
        const feeAmount = Math.max(0, usage - tpUsage) * fee;
        unPnl -= feeAmount;
        unPnlPerc = unPnl / usage;
      }
      if (combo) {
        // Combo bot logic (line 783-784) - not applicable for DCA bots
        unPnlPerc = unPnl / usage;
      }

      // Round unPnlPerc (matches old dashboard)
      unPnlPerc = math.round(unPnlPerc * 100, 2);
    }

    // Round to 2 decimal places (matches old dashboard exactly)
    const result = active ? math.round(unPnl, 2, unPnl < 0, unPnl > 0) : 0;

    // DEBUG: Log detailed calculation steps
    logger.info('[ComplexValue] DEBUG - Detailed calculation:', {
      botId: dcaBot._id,
      botName: dcaBot.settings?.name,
      strategy: settings.strategy,
      long,
      futures,
      coinm,
      baseAsset,
      quoteAsset,
      currentBalancesBase: currentBalances.base,
      currentBalancesQuote: currentBalances.quote,
      initialBalancesBase: initialBalances.base,
      initialBalancesQuote: initialBalances.quote,
      botSymbols: botSymbols.slice(0, 3), // Show first 3 symbols
      findRates: Object.keys(findRates).slice(0, 3), // Show first 3 rate keys
      currentValues,
      unPnl,
      unPnlPerc,
      usdRate,
      pricesCount: prices.length,
      dealsReduceForBot: dcaBot.dealsReduceForBot?.length || 0,
      finalResult: result,
    });

    return result;
  } catch (error) {
    logger.error('[ComplexValue] Error calculating unrealized P&L:', error);
    return 0;
  }
};

/**
 * Get current market prices for the bot's trading pair
 */
export const getBotMarketPrice = (
  dcaBot: DCABot,
  prices: Prices = []
): number => {
  const symbol = dcaBot.symbol?.[0]?.value?.symbol;
  const exchange = dcaBot.exchange;

  if (!symbol) return 0;

  // Find the price for this bot's symbol and exchange
  const priceData = prices.find(
    (p) => p.symbol === symbol && p.exchange === exchange
  );

  return priceData?.price || 0;
};

/**
 * Calculate value change percentage
 */
export const calculateValueChangePercent = (
  currentValue: number,
  initialValue: number
): number => {
  if (initialValue === 0) return 0;
  return ((currentValue - initialValue) / initialValue) * 100;
};
