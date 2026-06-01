import type { OrderData } from '@/types';
import type { TransformedTrade } from '@/types/dcaDeal';

export type OrderSide = 'SELL' | 'BUY';

export interface TradeLevels {
  /** Upper reference line price (nearest sell at/above current price). */
  topLine?: number;
  /** Order side that produced `topLine` — drives its colour (SELL=red, BUY=green). */
  topSide?: OrderSide;
  /** Lower reference line price (a stop, or nearest buy at/below current price). */
  bottomLine?: number;
  /** Order side that produced `bottomLine`. */
  bottomSide?: OrderSide;
}

/**
 * Derives the two horizontal reference lines drawn on a trade card's
 * sparkline from the deal's open orders.
 *
 * - `topLine`: the nearest SELL at/above the current price, falling back to the
 *   lowest SELL overall. For a long this is the take-profit; for a short, a
 *   safety/averaging sell. Always a SELL.
 * - `bottomLine`: a stop order's price if one exists, otherwise the nearest BUY
 *   at/below the current price (falling back to the highest BUY). For a long
 *   this is a safety/averaging buy; for a short, the take-profit.
 *
 * Each line also reports the order **side** it came from. The card colours a
 * line by side — SELL = red, BUY = green — matching the trading-desk convention
 * (TP/SL on a long are sells, hence red; safety buys are green) and working
 * identically for shorts.
 *
 * Pure and dependency-free (no React). Non-finite results are dropped.
 */
export function deriveTradeLevels(
  trade: TransformedTrade,
  orders: OrderData[],
  currentPrice: number | null
): TradeLevels {
  const open = orders.filter(
    (o) =>
      o.dealId === trade.id &&
      (o.status === 'NEW' || o.status === 'PARTIALLY_FILLED')
  );

  const sells = open.filter((o) => o.side === 'SELL');
  const buys = open.filter((o) => o.side === 'BUY');

  const finite = (n: number): boolean => Number.isFinite(n);
  const hasPrice = currentPrice !== null && Number.isFinite(currentPrice);

  const result: TradeLevels = {};

  // Top line: nearest SELL >= currentPrice, else lowest SELL overall.
  if (sells.length > 0) {
    const sellPrices = sells.map((o) => Number(o.price)).filter(finite);
    if (sellPrices.length > 0) {
      const above = hasPrice
        ? sellPrices.filter((p) => p >= (currentPrice as number))
        : [];
      const top =
        above.length > 0 ? Math.min(...above) : Math.min(...sellPrices);
      if (finite(top)) {
        result.topLine = top;
        result.topSide = 'SELL';
      }
    }
  }

  // Bottom line: stop order price if present, else nearest BUY <= currentPrice,
  // else highest BUY overall.
  // Detect a stop ONLY by typeOrder === 'stop'. (Using `stopPrice > 0` here is
  // too broad — regular TP/limit orders can carry a stopPrice, which would
  // hijack the bottom line and suppress the DCA buy line entirely.)
  const slOrder = open.find((o) => o.typeOrder === 'stop');
  if (slOrder) {
    const stop = Number(slOrder.stopPrice);
    const slLevel = finite(stop) && stop > 0 ? stop : Number(slOrder.price);
    if (finite(slLevel)) {
      result.bottomLine = slLevel;
      result.bottomSide = slOrder.side === 'BUY' ? 'BUY' : 'SELL';
    }
  } else if (buys.length > 0) {
    const buyPrices = buys.map((o) => Number(o.price)).filter(finite);
    if (buyPrices.length > 0) {
      const below = hasPrice
        ? buyPrices.filter((p) => p <= (currentPrice as number))
        : [];
      const bottom =
        below.length > 0 ? Math.max(...below) : Math.max(...buyPrices);
      if (finite(bottom)) {
        result.bottomLine = bottom;
        result.bottomSide = 'BUY';
      }
    }
  }

  return result;
}
