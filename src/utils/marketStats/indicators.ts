import type { Bar } from '@/utils/tradingView/types';

export type Candle = Pick<Bar, 'open' | 'high' | 'low' | 'close' | 'time'>;

/**
 * Wilder's ATR over `period` candles, in price units. Needs at least
 * `period + 1` candles. Returns NaN if input is too short.
 */
export const computeATR = (candles: Candle[], period = 14): number => {
  if (!Array.isArray(candles) || candles.length < period + 1) return NaN;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - prev.close),
      Math.abs(c.low - prev.close)
    );
    trs.push(tr);
  }
  // Seed with simple average of first `period` TRs, then Wilder-smooth.
  let atr = trs.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
};

/**
 * ATR as a percentage of the most recent close. The unit we actually
 * want for tuning DCA params, since every knob (TP, step) is also a %.
 */
export const computeATRPercent = (candles: Candle[], period = 14): number => {
  const atr = computeATR(candles, period);
  if (!Number.isFinite(atr)) return NaN;
  const last = candles[candles.length - 1]?.close;
  if (!last || last <= 0) return NaN;
  return (atr / last) * 100;
};

/**
 * Worst peak-to-trough drawdown over the last `window` candles
 * (or all of them if window is omitted), expressed as a positive %.
 * Uses running peak of highs vs subsequent lows.
 */
export const computeMaxDrawdownPercent = (
  candles: Candle[],
  window?: number
): number => {
  if (!Array.isArray(candles) || candles.length === 0) return NaN;
  const start =
    typeof window === 'number' && window > 0
      ? Math.max(0, candles.length - window)
      : 0;
  let peak = -Infinity;
  let worst = 0;
  for (let i = start; i < candles.length; i++) {
    const c = candles[i];
    if (c.high > peak) peak = c.high;
    if (peak > 0) {
      const dd = (peak - c.low) / peak;
      if (dd > worst) worst = dd;
    }
  }
  return worst * 100;
};

/**
 * Enumerates discrete drawdown *episodes*: each entry is the maximum
 * % decline reached between a running peak and its eventual recovery
 * (or end-of-data if it never recovered). Returns the depths as
 * positive percentages, in the order they completed.
 *
 * Useful for diagnostics but produces too few samples on persistent
 * downtrends (e.g. a year-long bear market may have only ~4 episodes).
 * For ladder-sizing percentiles, prefer `computeRollingMaxDrawdowns`,
 * which samples densely from rolling windows.
 */
export const computeDrawdownEpisodes = (candles: Candle[]): number[] => {
  if (!Array.isArray(candles) || candles.length === 0) return [];
  const episodes: number[] = [];
  let peak = candles[0].high;
  let currentMaxDd = 0;
  for (const c of candles) {
    if (c.high >= peak) {
      if (currentMaxDd > 0) {
        episodes.push(currentMaxDd * 100);
        currentMaxDd = 0;
      }
      peak = c.high;
    } else if (peak > 0) {
      const dd = (peak - c.low) / peak;
      if (dd > currentMaxDd) currentMaxDd = dd;
    }
  }
  // The trailing (still-open) episode counts too — it's a real
  // drawdown that hasn't recovered yet.
  if (currentMaxDd > 0) episodes.push(currentMaxDd * 100);
  return episodes;
};

/**
 * For each rolling window of `windowSize` consecutive candles, records
 * the worst peak-to-trough decline observed within that window. Returns
 * the depths as positive percentages, one per window start.
 *
 * This is the right primitive for "what dip should I expect over an
 * N-day horizon?" — every window is one realized N-day experience the
 * coin actually had, so percentiles read as "in P% of N-day windows
 * the drawdown stayed at or below X%".
 */
export const computeRollingMaxDrawdowns = (
  candles: Candle[],
  windowSize: number
): number[] => {
  if (
    !Array.isArray(candles) ||
    !Number.isFinite(windowSize) ||
    windowSize <= 0 ||
    candles.length < windowSize
  ) {
    return [];
  }
  const result: number[] = [];
  for (let i = 0; i + windowSize <= candles.length; i++) {
    let peak = candles[i].high;
    let maxDd = 0;
    for (let j = i; j < i + windowSize; j++) {
      const c = candles[j];
      if (c.high > peak) peak = c.high;
      if (peak > 0) {
        const dd = (peak - c.low) / peak;
        if (dd > maxDd) maxDd = dd;
      }
    }
    result.push(maxDd * 100);
  }
  return result;
};

/**
 * Inclusive-percentile of a numeric array (linear-interpolation-free
 * — picks the value at `floor(p/100 × n)`, clamped). `p=100` returns
 * the max, `p=0` the min. Empty input returns 0.
 */
export const percentile = (values: number[], p: number): number => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const clamped = Math.max(0, Math.min(100, p));
  const idx = Math.min(
    sorted.length - 1,
    Math.floor((clamped / 100) * sorted.length)
  );
  return sorted[idx];
};

/** Threshold for "enough history to calibrate". Below this we return
 *  hasFullYear=false and consumers fall back to static defaults. */
export const FULL_YEAR_CANDLES = 365;

/** Rolling window size, in daily candles, used for Short/Mid tier
 *  calibration. 30 days ≈ "typical month" horizon — long enough to
 *  smooth single-day noise, short enough to give many samples. */
export const MONTH_WINDOW_CANDLES = 30;

export interface RollingDrawdownStats {
  /** Median (50th percentile) drawdown depth across all windows, in %. */
  p50: number;
  /** 80th-percentile drawdown depth across all windows, in %. */
  p80: number;
  /** Max drawdown observed in any single window, in %. */
  p100: number;
  /** Number of rolling-window samples informing the percentiles. */
  sampleCount: number;
}

export interface MarketStats {
  /** Most recent close. */
  latestPrice: number;
  /** Candle count actually used (daily). */
  candleCount: number;
  /** True when we have at least a year of daily data. */
  hasFullYear: boolean;
  /** ATR (14) in price units. Kept for the future R:R SL feature. */
  atr: number;
  /** ATR (14) as % of latest close. */
  atrPct: number;
  /** Drawdown statistics from the candle history. */
  drawdowns: {
    /** Per-window max-drawdown distribution from rolling 30-day windows.
     *  Hundreds of samples even on persistent downtrends, so percentiles
     *  stay well-separated across tiers. */
    month: RollingDrawdownStats;
    /** The absolute worst peak-to-trough decline observed across the
     *  full candle history. Use this for "survive the worst 1y dip". */
    fullPeriodMax: number;
  };
}

const rollingStats = (depths: number[]): RollingDrawdownStats => ({
  p50: percentile(depths, 50),
  p80: percentile(depths, 80),
  p100: percentile(depths, 100),
  sampleCount: depths.length,
});

export const computeMarketStats = (candles: Candle[]): MarketStats | null => {
  if (!Array.isArray(candles) || candles.length < 15) return null;
  const latestPrice = candles[candles.length - 1].close;
  const atr = computeATR(candles, 14);
  const atrPct = computeATRPercent(candles, 14);
  if (!Number.isFinite(atr) || !Number.isFinite(atrPct)) return null;
  const month = rollingStats(
    computeRollingMaxDrawdowns(candles, MONTH_WINDOW_CANDLES)
  );
  const fullPeriodMax = computeMaxDrawdownPercent(candles);
  return {
    latestPrice,
    candleCount: candles.length,
    hasFullYear: candles.length >= FULL_YEAR_CANDLES,
    atr,
    atrPct,
    drawdowns: {
      month,
      fullPeriodMax: Number.isFinite(fullPeriodMax) ? fullPeriodMax : 0,
    },
  };
};
