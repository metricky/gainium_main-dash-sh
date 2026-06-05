import {
  StrategyEnum,
  type BuyAndHoldEquity,
  type DCABacktestingResult,
  type DCABacktestingResultHistory,
  type DCABotSettings,
  type ExchangeEnum,
  type ExchangeIntervals,
  type PreparedDeal,
  type PreparedGrid,
  type SplitTime,
} from '@/types';

/**
 * Adapter layer between a raw DCA backtest result and the redesigned
 * results UI. Pure, framework-free. The UI renders ONLY against the
 * interfaces below; nothing downstream touches the raw engine types.
 *
 * Every optional engine field is guarded (`?? 0` / `?? null`). The result
 * fed in may be the *fresh* in-memory result (has `deals`, `portfolio`,
 * `buyAndHoldEquity`) or a *saved* history object (those arrays stripped).
 * The `has*` booleans let panels degrade gracefully either way.
 */

/** One point on the equity / buy&hold timeline. */
export interface EquityPointVM {
  t: number; // epoch ms (from portfolio[].x)
  eq: number; // portfolio value (portfolio[].y)
  bh: number | null; // buy & hold value at t (null if no B&H series)
}

/** One rung of the safety-order ladder for a deal. */
export interface SafetyLevelVM {
  idx: number; // 1-based SO number
  dev: number; // price deviation % below entry (positive magnitude)
  price: number; // rung trigger price
  filled: boolean; // did price trade down to this rung?
  at: number | null; // fill time (epoch ms) or null if unfilled
}

/** One bar of the per-deal price series for the chart. */
export interface DealCandleVM {
  t: number; // epoch ms
  o: number;
  h: number;
  l: number;
  c: number;
}

/** A single deal, fully resolved for the inspector + scatter. */
export interface DealVM {
  no: number; // 1-based display index
  id: string;
  pair: string; // e.g. "BTC/USDC"
  status: 'open' | 'closed';
  out: 'win' | 'loss' | 'open';
  pnlPerc: number;
  pnlUsd: number;
  entry: number; // start price
  avg: number; // averaged entry
  closePrice: number | null; // null while open
  tp: number | null; // planned take-profit price (from settings)
  durationH: number; // duration in hours
  filled: number; // safety orders filled (levels.complete)
  maxSo: number; // max safety orders (levels.max)
  volume: number;
  startTime: number; // epoch ms
  closeTime: number | null; // epoch ms or null while open
  safety: SafetyLevelVM[];
  /** Per-deal price series for the chart. Empty if unreconstructable. */
  candles: DealCandleVM[];
  /** index into `candles` for entry bar; -1 if no candles. */
  entryIdx: number;
  /** index into `candles` for close bar; -1 if open/no candles. */
  closeIdx: number;
}

/** Headline KPIs + series for Overview + modal header. */
export interface BacktestViewModel {
  // identity / header
  pair: string;
  exchange: string;
  direction: string; // "Long" | "Short" (from settings.strategy)
  strategy: string; // "DCA"
  interval: ExchangeIntervals | string;
  from: number; // duration.firstDataTime
  to: number; // duration.lastDataTime

  // headline KPIs
  netPerc: number; // financial.netProfitTotalPerc
  netUsd: number; // financial.netProfitTotalUsd
  avgDailyPerc: number; // financial.avgNetDailyPerc
  avgDailyUsd: number; // financial.avgNetDailyUsd
  maxDdPerc: number; // financial.maxDrawDownEquityPerc ?? maxDrawDownPerc
  maxDdUsd: number; // financial.maxDrawDownEquityUsd ?? maxDrawDownUsd
  profitFactor: number | null; // ratios.profitFactor (null if not finite)
  annualizedPerc: number | null; // financial.annualizedReturn ?? null
  sharpe: number; // ratios.sharpe
  sortino: number; // ratios.sortino
  avgDealDurH: number; // duration.avgDealDuration -> hours
  maxDealDurH: number; // duration.maxDealDurationTime -> hours

  // counts
  deals: number; // numerical.all
  wins: number; // numerical.profit
  losses: number; // numerical.loss
  open: number; // numerical.open
  winRate: number; // wins/(wins+losses)*100 (0 if denom 0)

  // series
  equity: EquityPointVM[]; // [] if hasEquityCurve === false
  dealList: DealVM[]; // [] if hasDeals === false

  // availability flags (drive graceful degradation)
  hasDeals: boolean;
  hasEquityCurve: boolean;
  hasBuyAndHold: boolean;

  // raw passthrough for the reused Stats/Analysis tabs
  raw: DCABacktestingResultHistory;
}

/** Optional identity hints when the fresh result lacks symbol/exchange. */
export interface BacktestViewModelMeta {
  symbol?: string;
  exchange?: string;
  baseAsset?: string;
  quoteAsset?: string;
}

const MS_PER_HOUR = 3_600_000;

/** Coerce anything (string | number | undefined) to a finite number. */
function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? (n as number) : fallback;
}

/** Convert a `SplitTime` ({d,h,min,s} as strings) to fractional hours. */
function splitToHours(split?: SplitTime): number {
  if (!split) return 0;
  const d = num(split.d);
  const h = num(split.h);
  const min = num(split.min);
  const s = num(split.s);
  return d * 24 + h + min / 60 + s / 3600;
}

/**
 * Derive a sane hours value from one of the engine's raw duration numbers,
 * cross-checked against an authoritative `SplitTime`. The engine emits
 * `duration.avgDealDuration` / `maxDealDurationTime` as raw numbers whose
 * unit (ms vs s) is ambiguous; the matching `SplitTime` is unambiguous, so
 * we prefer it and fall back to the numeric field (assumed ms) only when
 * the split is absent.
 */
function durationToHours(raw: number | undefined, split?: SplitTime): number {
  const fromSplit = splitToHours(split);
  if (fromSplit > 0) return fromSplit;
  const n = num(raw);
  if (n <= 0) return 0;
  return n / MS_PER_HOUR;
}

/** Resolve "BASE/QUOTE" from a `PreparedDeal.symbol` (a `Symbols` object). */
function pairFromDeal(deal: PreparedDeal): string {
  const sym = deal.symbol;
  if (sym?.pair) return sym.pair;
  const base = sym?.baseAsset?.name;
  const quote = sym?.quoteAsset?.name;
  if (base && quote) return `${base}/${quote}`;
  return '';
}

/** "Long" | "Short" from settings.strategy; defaults to "Long". */
function directionFromSettings(settings?: DCABotSettings): string {
  return settings?.strategy === StrategyEnum.short ? 'Short' : 'Long';
}

function isLong(settings?: DCABotSettings): boolean {
  return settings?.strategy !== StrategyEnum.short;
}

/**
 * Build the per-deal price path from its transactions. Each transaction
 * becomes a degenerate OHLC bar at its execution price (the chart renders
 * these as connected points / a line). Returns bars sorted by time.
 */
function candlesFromDeal(deal: PreparedDeal): DealCandleVM[] {
  const txns = deal.transactions ?? [];
  const bars: DealCandleVM[] = [];
  for (const txn of txns) {
    const isBuy = txn.side === 'BUY';
    const price = num(isBuy ? txn.priceBuy : txn.priceSell);
    if (!Number.isFinite(price) || price <= 0) continue;
    bars.push({ t: txn.updateTime, o: price, h: price, l: price, c: price });
  }
  bars.sort((a, b) => a.t - b.t);
  return bars;
}

/** index of the first candle at or after `t`; clamped to [0, len-1]; -1 if empty. */
function nearestCandleIdx(candles: DealCandleVM[], t: number | null): number {
  if (candles.length === 0 || t == null) return -1;
  for (let i = 0; i < candles.length; i += 1) {
    if (candles[i].t >= t) return i;
  }
  return candles.length - 1;
}

/**
 * Reconstruct the planned safety-order ladder from settings and mark the
 * rungs that filled. Deviation per rung is NOT stored per-rung, so we
 * recompute the planned geometric ladder (`step * stepScale^k`) and flag
 * the first `levels.complete` rungs as filled. Best-effort fill times are
 * matched from `filledOrders` / `ordersHistory` by nearest price.
 */
function buildSafetyLadder(
  deal: PreparedDeal,
  settings: DCABotSettings | undefined,
  long: boolean,
): SafetyLevelVM[] {
  const entry = num(deal.startPrice);
  const settingsMax = settings ? Math.trunc(num(settings.ordersCount)) : 0;
  const dealMax = num(deal.levels?.max);
  const maxSo = Math.max(settingsMax, dealMax, 0);
  if (maxSo <= 0 || entry <= 0) return [];

  const step = settings ? num(settings.step) : 0;
  const stepScale = settings ? num(settings.stepScale, 1) : 1;
  const completed = num(deal.levels?.complete);

  // Best-effort fill-time lookup table from grids that have a fill time.
  const fills: PreparedGrid[] = [
    ...(deal.filledOrders ?? []),
    ...(deal.ordersHistory ?? []),
  ].filter((g) => g?.filledTime != null && Number.isFinite(g.price));

  const fillTimeForPrice = (price: number): number | null => {
    if (fills.length === 0 || !Number.isFinite(price)) return null;
    let best: PreparedGrid | null = null;
    let bestDelta = Infinity;
    for (const g of fills) {
      const delta = Math.abs(g.price - price);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = g;
      }
    }
    return best?.filledTime ?? null;
  };

  const ladder: SafetyLevelVM[] = [];
  for (let k = 0; k < maxSo; k += 1) {
    const dev = step > 0 ? step * Math.pow(stepScale, k) : 0;
    const price = long
      ? entry * (1 - dev / 100)
      : entry * (1 + dev / 100);
    const filled = k < completed;
    ladder.push({
      idx: k + 1,
      dev,
      price,
      filled,
      at: filled ? fillTimeForPrice(price) : null,
    });
  }
  return ladder;
}

/** Take-profit price from the averaged entry + settings.tpPerc. */
function tpPrice(
  avg: number,
  settings: DCABotSettings | undefined,
  long: boolean,
): number | null {
  if (!settings || !settings.useTp) return null;
  const tpPerc = num(settings.tpPerc);
  if (tpPerc <= 0 || avg <= 0) return null;
  return long ? avg * (1 + tpPerc / 100) : avg * (1 - tpPerc / 100);
}

/** Adapt a single `PreparedDeal` into a `DealVM`. */
function buildDealVM(
  deal: PreparedDeal,
  index: number,
  settings: DCABotSettings | undefined,
): DealVM {
  const long = isLong(settings);
  const status: 'open' | 'closed' = deal.status === 'open' ? 'open' : 'closed';
  const pnlPerc = num(deal.profit?.perc);
  const out: DealVM['out'] =
    status === 'open' ? 'open' : pnlPerc >= 0 ? 'win' : 'loss';

  const entry = num(deal.startPrice);
  const avg = num(deal.avgPrice);
  const closePrice =
    deal.closePrice != null && Number.isFinite(deal.closePrice)
      ? deal.closePrice
      : null;
  const closeTime =
    deal.closedTime != null && Number.isFinite(deal.closedTime)
      ? deal.closedTime
      : null;

  const candles = candlesFromDeal(deal);
  const safety = buildSafetyLadder(deal, settings, long);

  return {
    no: deal.number ?? index + 1,
    id: deal.id,
    pair: pairFromDeal(deal),
    status,
    out,
    pnlPerc,
    pnlUsd: num(deal.profit?.totalUsd),
    entry,
    avg,
    closePrice,
    tp: tpPrice(avg, settings, long),
    durationH: splitToHours(deal.splitDuration),
    filled: num(deal.levels?.complete),
    maxSo: num(deal.levels?.max),
    volume: num(deal.volume),
    startTime: num(deal.startTime),
    closeTime,
    safety,
    candles,
    entryIdx: nearestCandleIdx(candles, num(deal.startTime)),
    closeIdx: status === 'open' ? -1 : nearestCandleIdx(candles, closeTime),
  };
}

/**
 * Align the buy & hold series onto the portfolio timeline using a sorted,
 * step-hold lookup: for each portfolio point we take the B&H value at the
 * closest sample with `time <= x`. Returns a fast index-based matcher.
 */
function makeBuyAndHoldMatcher(
  series: BuyAndHoldEquity[] | undefined,
): (x: number) => number | null {
  if (!series || series.length === 0) return () => null;
  const sorted = [...series].sort((a, b) => a.time - b.time);
  return (x: number): number | null => {
    let lo = 0;
    let hi = sorted.length - 1;
    let result: number | null = null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid].time <= x) {
        result = sorted[mid].value;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    // Before the first B&H sample: fall back to the earliest value so the
    // line starts at the same origin rather than being null.
    return result ?? sorted[0].value;
  };
}

/**
 * Synthesize a `DCABacktestingResultHistory` wrapper for the reused
 * Stats/Analysis tabs. When the input is already a history object, the
 * relevant identity fields exist and we pass them through; when it's the
 * fresh result they're absent, so we fill from `meta` + `settings`.
 */
function toHistory(
  result: DCABacktestingResult | DCABacktestingResultHistory,
  settings: DCABotSettings,
  meta: BacktestViewModelMeta | undefined,
): DCABacktestingResultHistory {
  const maybeHistory = result as Partial<DCABacktestingResultHistory>;
  return {
    ...(result as DCABacktestingResult),
    symbol: maybeHistory.symbol ?? meta?.symbol ?? '',
    baseAsset: maybeHistory.baseAsset ?? meta?.baseAsset ?? '',
    quoteAsset: maybeHistory.quoteAsset ?? meta?.quoteAsset ?? '',
    _id: maybeHistory._id ?? result._id ?? '',
    time: maybeHistory.time ?? Date.now(),
    exchange: maybeHistory.exchange ?? (meta?.exchange as ExchangeEnum),
    exchangeUUID: maybeHistory.exchangeUUID ?? '',
    settings: maybeHistory.settings ?? settings,
    savePermanent: maybeHistory.savePermanent ?? false,
    userId: maybeHistory.userId ?? '',
  };
}

/**
 * Convert a real DCA backtest result (+ its settings) into the ViewModel
 * the redesigned results UI renders against.
 *
 * @param result  fresh in-memory `DCABacktestingResult` OR a saved
 *                `DCABacktestingResultHistory` (the latter has `deals`,
 *                `portfolio`, `buyAndHoldEquity` stripped).
 * @param settings the DCA bot settings used for the run (numeric fields are
 *                strings; parsed here).
 * @param meta    optional identity hints used only when the fresh result
 *                lacks `symbol` / `exchange`.
 */
export function buildBacktestViewModel(
  result: DCABacktestingResult | DCABacktestingResultHistory,
  settings: DCABotSettings,
  meta?: BacktestViewModelMeta,
): BacktestViewModel {
  const financial = result.financial;
  const duration = result.duration;
  const numerical = result.numerical;
  const ratios = result.ratios;

  const deals = result.deals ?? [];
  const portfolio = result.portfolio ?? [];
  const buyAndHold = result.buyAndHoldEquity ?? [];

  const hasDeals = deals.length > 0;
  const hasEquityCurve = portfolio.length > 0;
  const hasBuyAndHold = buyAndHold.length > 0;

  // Equity series with step-hold B&H alignment.
  const matchBH = makeBuyAndHoldMatcher(result.buyAndHoldEquity);
  const equity: EquityPointVM[] = portfolio.map((p) => ({
    t: p.x,
    eq: p.y,
    bh: hasBuyAndHold ? matchBH(p.x) : null,
  }));

  const dealList: DealVM[] = deals.map((deal, i) =>
    buildDealVM(deal, i, settings),
  );

  const wins = num(numerical?.profit);
  const losses = num(numerical?.loss);
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  const profitFactorRaw = num(ratios?.profitFactor, NaN);
  const profitFactor = Number.isFinite(profitFactorRaw)
    ? profitFactorRaw
    : null;

  const annualizedPerc =
    financial?.annualizedReturn != null &&
    Number.isFinite(financial.annualizedReturn)
      ? financial.annualizedReturn
      : null;

  const maybeHistory = result as Partial<DCABacktestingResultHistory>;
  const pair =
    meta?.symbol ?? maybeHistory.symbol ?? (hasDeals ? pairFromDeal(deals[0]) : '');
  const exchange =
    meta?.exchange ?? (maybeHistory.exchange as string | undefined) ?? '';

  return {
    pair,
    exchange,
    direction: directionFromSettings(settings),
    strategy: 'DCA',
    interval: result.interval,
    from: num(duration?.firstDataTime),
    to: num(duration?.lastDataTime),

    netPerc: num(financial?.netProfitTotalPerc),
    netUsd: num(financial?.netProfitTotalUsd),
    avgDailyPerc: num(financial?.avgNetDailyPerc),
    avgDailyUsd: num(financial?.avgNetDailyUsd),
    maxDdPerc: num(
      financial?.maxDrawDownEquityPerc ?? financial?.maxDrawDownPerc,
    ),
    maxDdUsd: num(financial?.maxDrawDownEquityUsd ?? financial?.maxDrawDownUsd),
    profitFactor,
    annualizedPerc,
    sharpe: num(ratios?.sharpe),
    sortino: num(ratios?.sortino),
    avgDealDurH: durationToHours(
      duration?.avgDealDuration,
      duration?.avgSplitDealDuration,
    ),
    maxDealDurH: durationToHours(
      duration?.maxDealDurationTime,
      duration?.maxDealDuration,
    ),

    deals: num(numerical?.all),
    wins,
    losses,
    open: num(numerical?.open),
    winRate,

    equity,
    dealList,

    hasDeals,
    hasEquityCurve,
    hasBuyAndHold,

    raw: toHistory(result, settings, meta),
  };
}
