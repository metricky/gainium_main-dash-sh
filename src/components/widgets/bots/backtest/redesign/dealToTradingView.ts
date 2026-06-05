/**
 * dealToTradingView.ts — pure transform from a backtest `PreparedDeal` into
 * the props the shared `TradingViewChart` embed needs to render a completed
 * DCA deal exactly like the manual backtester / legacy main-dash plots it:
 *
 *  - real candles (resolved from the symbol + interval by the chart datafeed),
 *  - one buy/sell ICON per filled order, from `rawDeal.transactions`,
 *  - horizontal line SEGMENTS (start→end time, NOT full-width) for every
 *    order level, the stepped averaged-entry line, and the stepped
 *    take-profit line — all sourced from `rawDeal.ordersHistory`, which the
 *    backtester pre-computes with one entry per distinct level/value
 *    (`avgLine: true` marks the synthetic average line; the take-profit
 *    SELL orders re-placed after each DCA fill give the stepped TP).
 *
 * This mirrors legacy `getOrdersForDrawing` in
 * `main-dash/components/dcabot/hooks/useDCAPage.ts`: map `ordersHistory`
 * to `{ side: avgLine ? 'GREY' : side, startTime, endTime: filledTime, price }`.
 * The chart's `renderOrderDrawings` draws each as a `trend_line` segment and
 * filters out degenerate / off-screen segments, so the lines "step" as each
 * fill shifts the average and take-profit.
 *
 * Framework-free; the component just spreads the result onto the chart.
 */

import {
  ExchangeIntervals,
  type ChartOrderDrawing,
  type PreparedDeal,
  type PreparedTransaction,
  type Symbols,
  type TransactionChart,
} from '@/types';

/** ~20 bars of padding around the deal window, in seconds, per interval. */
const PAD_BARS = 20;

/**
 * Inverse of `RESOLUTION_TO_INTERVAL_MAP` in
 * `@/utils/tradingView/historyApi.ts`: map an {@link ExchangeIntervals} value
 * (`'1h'`, `'15m'`, `'1d'`, …) to the TradingView resolution string the chart
 * expects (`'60'`, `'15'`, `'1D'`, …). Defaults to `'60'` (1h) for anything
 * unrecognized.
 */
const INTERVAL_TO_RESOLUTION: Record<ExchangeIntervals, string> = {
  [ExchangeIntervals.oneM]: '1',
  [ExchangeIntervals.threeM]: '3',
  [ExchangeIntervals.fiveM]: '5',
  [ExchangeIntervals.fifteenM]: '15',
  [ExchangeIntervals.thirtyM]: '30',
  [ExchangeIntervals.oneH]: '60',
  [ExchangeIntervals.twoH]: '120',
  [ExchangeIntervals.fourH]: '240',
  [ExchangeIntervals.eightH]: '480',
  [ExchangeIntervals.oneD]: '1D',
  [ExchangeIntervals.oneW]: '1W',
};

/** Seconds-per-bar for each TradingView resolution (used for timeframe pad). */
const RESOLUTION_SECONDS: Record<string, number> = {
  '1': 60,
  '3': 180,
  '5': 300,
  '15': 900,
  '30': 1800,
  '60': 3600,
  '120': 7200,
  '240': 14400,
  '480': 28800,
  '1D': 86400,
  '1W': 604800,
};

/**
 * Map an `ExchangeIntervals` enum value (or raw string) to a TradingView
 * resolution string. Unknown / missing → `'60'`.
 */
export function intervalToResolution(
  interval: ExchangeIntervals | string | undefined,
): string {
  if (!interval) return '60';
  return INTERVAL_TO_RESOLUTION[interval as ExchangeIntervals] ?? '60';
}

/** Coerce a price-ish string|number to a finite positive number, else null. */
function px(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) && (n as number) > 0 ? (n as number) : null;
}

/** "PAIR@EXCHANGE" string the chart's datafeed expects, or undefined. */
function symbolString(sym: Symbols | undefined): string | undefined {
  if (!sym?.pair || !sym?.exchange) return undefined;
  return `${sym.pair}@${sym.exchange}`;
}

/**
 * Build one buy/sell execution ICON per FILLED order. The executions of a
 * backtest deal live in `filledOrders` (each a grid order with a `filledTime`
 * and `side`) — same source the deals table uses — not in `transactions`,
 * which is empty for backtests. We fall back to `transactions` only if a deal
 * carries no filled orders. Zero/invalid prices are skipped. Time stays in
 * ms — the chart normalizes ms→s internally.
 */
function transactionsFromDeal(
  rawDeal: PreparedDeal,
): (TransactionChart & { entity?: undefined })[] {
  const out: (TransactionChart & { entity?: undefined })[] = [];

  for (const o of rawDeal.filledOrders ?? []) {
    const price = px(o.price);
    if (price == null || o.filledTime == null) continue;
    out.push({
      id: o.id,
      side: String(o.side).toUpperCase() === 'BUY' ? 'buy' : 'sell',
      time: o.filledTime,
      price,
    });
  }
  if (out.length > 0) return out;

  // Fallback: live/manual results that populate `transactions` instead.
  const txns: PreparedTransaction[] = rawDeal.transactions ?? [];
  for (const txn of txns) {
    const isBuy = String(txn.side).toUpperCase() === 'BUY';
    const price = px(isBuy ? txn.priceBuy : txn.priceSell);
    if (price == null) continue;
    out.push({
      id: txn._id,
      side: isBuy ? 'buy' : 'sell',
      time: txn.updateTime,
      price,
    });
  }
  return out;
}

/**
 * Build the horizontal line SEGMENTS for the deal from `ordersHistory`, the
 * legacy way. Each entry becomes a `{ price, side, startTime, endTime }`
 * segment: green for BUY levels, red for SELL (take-profit) levels, grey for
 * the synthetic averaged-entry line (`avgLine`). `startTime` is when the level
 * was placed; `endTime` is its fill/cancel time, falling back to the deal's
 * effective end so an order still open at deal close runs to the edge. Because
 * the backtester re-places the TP (and re-emits the avg line) after every DCA
 * fill, these segments naturally "step".
 */
function orderDrawingsFromDeal(
  rawDeal: PreparedDeal,
  fallbackEndMs: number,
): ChartOrderDrawing[] {
  const history = rawDeal.ordersHistory ?? [];
  const out: ChartOrderDrawing[] = [];
  for (const o of history) {
    const price = px(o.price);
    if (price == null) continue;
    const startTime = o.startTime ?? fallbackEndMs;
    const endTime = o.filledTime ?? fallbackEndMs;
    out.push({
      price,
      side: o.avgLine ? 'GREY' : String(o.side),
      startTime,
      endTime,
    });
  }
  return out;
}

/** Shape returned by {@link dealToTradingView}. */
export interface DealTradingViewProps {
  symbol: string | undefined;
  availableSymbols: Symbols[];
  interval: string;
  initialTimeframe: { from: number; to: number };
  transactions: (TransactionChart & { entity?: undefined })[];
  ordersForDrawing: ChartOrderDrawing[];
}

/**
 * Transform a `PreparedDeal` into the read-only embed props for
 * `TradingViewChart`. `intervalResolution` is the run-level resolution
 * (constant across deals), already mapped via {@link intervalToResolution}.
 * `fallbackEndMs` is the deal's effective end (its close time, or the
 * backtest's last data time for a still-open deal) — used as the end of any
 * order segment that never filled.
 */
export function dealToTradingView(
  rawDeal: PreparedDeal,
  intervalResolution: string,
  fallbackEndMs: number,
): DealTradingViewProps {
  const sym = rawDeal.symbol;
  const symbol = symbolString(sym);
  const availableSymbols = sym ? [sym] : [];

  const barSeconds = RESOLUTION_SECONDS[intervalResolution] ?? 3600;
  const pad = PAD_BARS * barSeconds;
  const endMs = rawDeal.closedTime ?? fallbackEndMs;
  const startSec = Math.floor((rawDeal.startTime || fallbackEndMs) / 1000);
  const endSec = Math.floor((endMs || fallbackEndMs) / 1000);
  const initialTimeframe = {
    from: startSec - pad,
    to: endSec + pad,
  };

  return {
    symbol,
    availableSymbols,
    interval: intervalResolution,
    initialTimeframe,
    transactions: transactionsFromDeal(rawDeal),
    ordersForDrawing: orderDrawingsFromDeal(rawDeal, endMs || fallbackEndMs),
  };
}
