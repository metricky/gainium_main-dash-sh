// Manual Backtesting state management for trading simulator
export type MarginType = 'cross' | 'isolated';

export interface TakeProfitTarget {
  price: number;
  percentage: number; // Percentage of position to close at this target (0-100)
}

export interface HitTakeProfitDetails {
  targetIndex: number;
  hitTime: number;
  hitPrice: number;
  /** Portion of the remaining position (%) that was closed when this target triggered */
  percentageOfRemaining?: number;
  /** Quote amount closed when this target triggered (already adjusted for fees) */
  quoteAmount?: number;
}

export interface PositionAdjustment {
  time: number; // timestamp
  price: number; // adjustment price
  amount: number; // adjustment amount in USDT (positive for increase, negative for reduce)
  type: 'increase' | 'reduce';
  realizedPnl?: number; // for position reductions
}

export interface ChecklistSectionSelection {
  id: string;
  rulebookId: string | null;
  sectionId: string | null;
  rulebookName?: string;
  sectionName?: string;
}

export type ManualBacktestingSplitMode =
  | 'single'
  | 'vertical'
  | 'horizontal'
  | 'quad';

export interface ManualBacktestingChartSlotState {
  id: string;
  symbol: string | null;
  /** Optional preferred TradingView resolution for the slot (stringified timeframe) */
  resolution?: string | null;
}

export interface ManualBacktestingSplitLayoutState {
  mode: ManualBacktestingSplitMode;
  primarySlotId: string;
  slots: ManualBacktestingChartSlotState[];
}

export interface TradeSettings {
  direction: 'long' | 'short';
  takeProfitTargets: TakeProfitTarget[];
  stopLoss: number;
  amount: number; // Amount in USDT
  // Persist the entry amount to derive display size and ROI after adjustments/reductions
  initialAmount?: number;
  /**
   * Multi‑symbol Phase 1 (optional during migration): symbol this trade belongs to.
   * Added as optional to avoid breaking legacy persisted sessions; will become required in later phase once
   * all creation points populate it. For single‑symbol sessions this mirrors session.symbol.
   */
  symbol?: string;
  // Feature toggles
  takeProfitEnabled?: boolean; // default true
  stopLossEnabled?: boolean; // default true
  // Position adjustments during the trade
  positionAdjustments?: PositionAdjustment[];
  // Original SL/TP at trade entry (before any modifications like trailing)
  // These values are preserved for chart visualization showing the original risk/reward areas
  originalStopLoss?: number;
  originalTakeProfit?: number;
  // Futures configuration (Phase 2)
  isFutures?: boolean;
  leverage?: number;
  marginType?: MarginType;
  liquidationPrice?: number | null;
  /** Snapshot of the liquidation price at entry time so it stays stable during the trade */
  entryLiquidationPrice?: number | null;
  // Trailing stop configuration
  trailingStopEnabled?: boolean;
  /** Absolute distance between the trailing reference price and stop loss */
  trailingStopDistance?: number | null;
  /** Highest (long) or lowest (short) price reached since activation */
  trailingStopReference?: number | null;
}

// Draft (pre-trade) settings extend base trade settings with order type metadata.
// We intentionally do NOT add orderType to active TradeSettings yet to avoid
// refactors across existing lifecycle logic. Active trades are always effectively
// 'market' in Phase 1; limit support will activate in later phases once fill
// detection is implemented.
export interface DraftTradeSettings extends Partial<TradeSettings> {
  orderType?: 'market' | 'limit';
  // Required only when orderType === 'limit'. Represents desired entry price.
  limitPrice?: number;
}

export interface PendingLimitOrder {
  id: string; // uuid
  direction: 'long' | 'short';
  amount: number; // Intended position size (not yet executed)
  limitPrice: number; // Target fill price
  placedAtBarIndex: number; // Bar index at which order was placed
  placedAtTime: number; // ms timestamp
  /** Optional (Phase 1 multi‑symbol) – symbol the pending order belongs to */
  symbol?: string;
  takeProfitTargets?: TakeProfitTarget[]; // User-intended raw targets (pre-fee)
  stopLoss?: number; // Raw SL (pre-fee)
  takeProfitEnabled?: boolean;
  stopLossEnabled?: boolean;
  trailingStopEnabled?: boolean;
  trailingStopDistance?: number | null;
  isFutures?: boolean;
  leverage?: number;
  marginType?: MarginType;
  liquidationPrice?: number | null;
}

export interface TradeResult {
  direction: 'long' | 'short'; // Add trade direction for chart visualization
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  roi: number;
  duration: number; // in milliseconds
  amount: number; // Position size in USDT
  /** Multi‑symbol Phase 1: symbol attribution (optional while legacy trades migrate) */
  symbol?: string;
  // Total capital invested over the trade (initial + all increases). Used for display/ROI in UI.
  amountInvested?: number;
  // Futures leverage (optional)
  leverage?: number;
  // Number of bars between entry and exit (ManualBacktesting uses 1h bars)
  durationBars?: number;
  // Chart timeframe/resolution used during the trade (e.g., '60' for 1h, '15' for 15m)
  chartPeriod?: string;
  // Balance snapshot at entry and after applying pnl
  balanceBefore?: number;
  balanceAfter?: number;
  // Checklist completion summary for quick display in tables/cards
  checklistMarkedCount?: number;
  checklistTotalCount?: number;
  exitReason:
    | 'takeProfit'
    | 'takeProfitPartial'
    | 'stopLoss'
    | 'liquidation'
    | 'barLimit'
    | 'periodEnd'
    | 'manual';
  // For partial TP exits, track which target was hit
  takeProfitTargetIndex?: number;
  // Optional TP/SL levels used during the trade (for chart rendering)
  takeProfit?: number | undefined;
  stopLoss?: number | undefined;
  // Original TP/SL levels at trade entry (before any modifications like trailing)
  originalTakeProfit?: number | undefined;
  originalStopLoss?: number | undefined;
  // Preserve the original TP targets array for chart visualization
  takeProfitTargets?: TakeProfitTarget[];
  // Preserve partial exit details for chart visualization
  partialExitDetails?: HitTakeProfitDetails[];
  // Preserve position adjustments for chart visualization
  positionAdjustments?: PositionAdjustment[];
  // Snapshot of checklist at execution time: only included fields to display later
  checklistSnapshot?: {
    enabled: boolean;
    items: Array<{
      id: string;
      name: string;
      required: boolean;
      checked: boolean;
      rulebookId?: string | null;
      rulebookName?: string;
      sectionId?: string | null;
      sectionName?: string;
    }>;
  };
}

export interface EquityPoint {
  time: number; // timestamp
  balance: number; // balance after the trade
  pnl: number; // trade PnL that caused this balance change
  tradeCount: number; // cumulative trade count
}

export interface ManualBacktestingState {
  // Manual Backtesting initialization
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Balance tracking
  startingBalance: number;
  currentBalance: number;
  equityHistory: EquityPoint[]; // Track balance evolution over time
  totalRealizedPnl: number; // Track total realized PnL from position adjustments
  // Cumulative realized PnL for the currently active trade (partial TPs + reductions).
  // This is reset when a trade starts and cleared on finalize/clear. Used to avoid
  // double counting already-applied realized PnL when computing the final trade result.
  realizedPnlSoFar?: number;

  // Current trade state
  isTradeActive: boolean;
  tradeSettings: TradeSettings | null;
  entryPrice: number | null;
  entryTime: number | null;
  // Track which TP targets have been hit (for partial exits)
  hitTakeProfitTargets: number[];
  // Track when each TP target was hit (for chart visualization)
  hitTakeProfitDetails: HitTakeProfitDetails[];
  /** Real-time position size after partial exits and manual adjustments (quote currency) */
  currentPositionSize?: number;

  // Trade history for chart visualization
  completedTrades: TradeResult[];

  // Manual Backtesting flow
  isManualBacktestingEnded: boolean;
  ManualBacktestingEndReason:
    | 'tradeCompleted'
    | 'dataEnd'
    | 'manual'
    | 'bankrupt'
    | null;
  // Persist checklist state during an active trade (survives reloads)
  activeChecklistSnapshot?: {
    enabled: boolean;
    items: Array<{
      id: string;
      name: string;
      required: boolean;
      checked: boolean;
      description?: string;
      rulebookId?: string | null;
      rulebookName?: string;
      sectionId?: string | null;
      sectionName?: string;
    }>;
  } | null;
  activeChecklistSelection?: ChecklistSectionSelection[] | null;
  /** Persist the last successfully used checklist selection to preload future trades */
  lastChecklistSelection?: ChecklistSectionSelection[] | null;

  // Results
  tradeResult: TradeResult | null;
  score: number;
  // Persistence of progression: index (0-based) of the last emitted bar (current visible bar)
  // When resuming a session we will start from lastBarIndex + 1 (so next bar to emit)
  lastBarIndex?: number | undefined; // optional for backward compatibility with persisted sessions
  totalBars?: number;
  // Time-based progress tracking (independent of timeframe/bars)
  currentTimeMs?: number | null; // Current timestamp in the session
  sessionTimeProgress?: number; // Progress as percentage (0-100) based on time elapsed
  // Persist last-used TP/SL switches per session
  lastTakeProfitEnabled?: boolean;
  lastStopLossEnabled?: boolean;
  // Persist last-used allocations for TP targets (percentages adding to 100)
  lastTpPercentages?: number[];
  // Persist last-used SL quick percent (distance from current price)
  lastSlPercent?: number | null;
  // Persist position size mode and risk configuration
  positionSizeMode?: 'amount' | 'risk';
  riskPercent?: number;
  riskBasis?: 'percent' | 'amount';
  riskAmount?: number | null;
  // Persist TP input mode (price vs risk:reward) and last used RR ratios per target
  tpMode?: 'price' | 'rr';
  lastRrRatios?: number[];
  // Persist SL input mode and last used RR ratio reference
  slMode?: 'price' | 'rr';
  lastSlRrRatio?: number | null;
  // Persist dual timeframe configuration & progress
  chartPeriod?: string | undefined; // TradingView chart timeframe (e.g. '60')
  playbackPeriod?: string | undefined; // Playback step timeframe (e.g. '15')
  syncTimeframes?: boolean | undefined; // Sync chart and playback periods (default true)
  lastPlaybackIndex?: number | undefined; // Last emitted/processed playback bar index (dual timeframe)
  lastChartBarIndex?: number | undefined; // Last visible chart bar index (dual timeframe)
  // Phase 1: scaffold for pending limit order (unused until Phase 3 activation)
  pendingOrder?: PendingLimitOrder | null;
  // Phase 2 – split layout orchestration metadata (persisted per session)
  splitLayout?: ManualBacktestingSplitLayoutState | null;
  // Persist last-used futures configuration across drafts/symbol switches
  lastIsFutures?: boolean;
  lastLeverage?: number | null;
  lastMarginType?: MarginType;
  lastLiquidationPrice?: number | null;
  /** Accumulated practice time in milliseconds (only active user interaction counted) */
  practiceTimeMs?: number;
}

export const STARTING_BALANCE = 10000; // USDT
// Removed MAX_PRICE_DEVIATION - no longer limiting TP/SL to 10% from current price

export const initialManualBacktestingState: ManualBacktestingState = {
  isInitialized: false,
  isLoading: false,
  error: null,

  startingBalance: STARTING_BALANCE,
  currentBalance: STARTING_BALANCE,
  equityHistory: [
    {
      time: Date.now(),
      balance: STARTING_BALANCE,
      pnl: 0,
      tradeCount: 0,
    },
  ], // Initialize with starting balance
  totalRealizedPnl: 0,
  realizedPnlSoFar: 0,

  isTradeActive: false,
  tradeSettings: null,
  entryPrice: null,
  entryTime: null,
  hitTakeProfitTargets: [],
  hitTakeProfitDetails: [],
  currentPositionSize: 0,

  completedTrades: [], // Initialize empty trade history

  isManualBacktestingEnded: false,
  ManualBacktestingEndReason: null,

  tradeResult: null,
  score: 0,
  lastBarIndex: undefined,
  totalBars: 0,
  currentTimeMs: null,
  sessionTimeProgress: 0,
  lastTakeProfitEnabled: true,
  lastStopLossEnabled: true,
  lastTpPercentages: [100],
  lastSlPercent: null,
  positionSizeMode: 'amount',
  riskPercent: 1,
  riskBasis: 'percent',
  riskAmount: null,
  tpMode: 'price',
  lastRrRatios: [],
  slMode: 'price',
  lastSlRrRatio: null,
  activeChecklistSnapshot: null,
  activeChecklistSelection: null,
  lastChecklistSelection: null,
  chartPeriod: '60',
  playbackPeriod: '60',
  syncTimeframes: true,
  lastPlaybackIndex: undefined,
  lastChartBarIndex: undefined,
  pendingOrder: null,
  splitLayout: null,
  lastIsFutures: false,
  lastLeverage: 1,
  lastMarginType: 'cross',
  lastLiquidationPrice: null,
  practiceTimeMs: 0,
};

/**
 * Validate trade settings against current price
 */
export function validateTradeSettings(
  settings: DraftTradeSettings,
  currentPrice: number
): string[] {
  const errors: string[] = [];

  if (!settings.direction) {
    errors.push('Trade direction (long/short) must be selected');
  }

  // Basic Phase 1 validation for limit orders (full validation rules deferred to Phase 7)
  if (settings.orderType === 'limit') {
    if (settings.limitPrice == null || settings.limitPrice <= 0) {
      errors.push('Limit price must be greater than 0');
    }
  }

  const tpEnabled = settings.takeProfitEnabled !== false; // default true
  const slEnabled = settings.stopLossEnabled !== false; // default true

  if (tpEnabled) {
    if (
      !settings.takeProfitTargets ||
      settings.takeProfitTargets.length === 0
    ) {
      errors.push('At least one take profit target must be set');
    }
  }

  if (slEnabled) {
    if (!settings.stopLoss || settings.stopLoss <= 0) {
      errors.push('Stop loss must be greater than 0');
    }
  }

  if (!settings.amount || settings.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (settings.amount && settings.amount > STARTING_BALANCE) {
    errors.push(`Amount cannot exceed ${STARTING_BALANCE} USDT`);
  }

  if (settings.isFutures) {
    const leverage = settings.leverage ?? 0;
    if (!Number.isFinite(leverage) || leverage < 1 || leverage > 50) {
      errors.push('Leverage must be between 1x and 50x for futures trades');
    }
    if (!settings.marginType) {
      errors.push('Margin type must be selected for futures trades');
    }
  }

  if (
    settings.direction &&
    tpEnabled &&
    settings.takeProfitTargets &&
    (slEnabled ? settings.stopLoss !== undefined : true)
  ) {
    // Validate each TP target
    let totalPercentage = 0;
    let previousPrice = 0;

    for (let i = 0; i < settings.takeProfitTargets.length; i++) {
      const target = settings.takeProfitTargets[i];

      if (target.price < 0) {
        errors.push(
          `Take profit target ${i + 1} must be greater than or equal to 0`
        );
      }

      if (target.percentage < 0 || target.percentage > 100) {
        errors.push(
          `Take profit target ${i + 1} percentage must be between 0 and 100`
        );
      }

      totalPercentage += target.percentage;

      // Check TP vs SL and current price boundaries (only if price is set)
      if (target.price > 0) {
        if (settings.direction === 'long') {
          if (slEnabled && settings.stopLoss !== undefined) {
            if (target.price <= settings.stopLoss) {
              errors.push(
                `For long positions, take profit target ${i + 1} must be higher than stop loss`
              );
            }
          }
          if (target.price <= currentPrice) {
            errors.push(
              `For long positions, take profit target ${i + 1} must be higher than current price`
            );
          }
        } else {
          if (slEnabled && settings.stopLoss !== undefined) {
            if (target.price >= settings.stopLoss) {
              errors.push(
                `For short positions, take profit target ${i + 1} must be lower than stop loss`
              );
            }
          }
          if (target.price >= currentPrice) {
            errors.push(
              `For short positions, take profit target ${i + 1} must be lower than current price`
            );
          }
        }
      }
      if (i > 0 && target.price > 0 && previousPrice > 0) {
        if (settings.direction === 'long' && target.price <= previousPrice) {
          errors.push(
            `Take profit target ${i + 1} must be higher than target ${i}`
          );
        }
        if (settings.direction === 'short' && target.price >= previousPrice) {
          errors.push(
            `Take profit target ${i + 1} must be lower than target ${i}`
          );
        }
      }

      previousPrice = target.price;

      // Removed price deviation limits - TP can be any distance from current price
    }

    if (totalPercentage > 100) {
      errors.push('Total take profit percentages cannot exceed 100%');
    }
  }

  if (slEnabled && settings.stopLoss) {
    // Removed price deviation limits - SL can be any distance from current price

    if (settings.direction === 'long' && settings.stopLoss >= currentPrice) {
      errors.push(
        'For long positions, stop loss must be lower than current price'
      );
    }
    if (settings.direction === 'short' && settings.stopLoss <= currentPrice) {
      errors.push(
        'For short positions, stop loss must be higher than current price'
      );
    }
  }

  return errors;
}

/** Type guard for PendingLimitOrder */
export function isPendingLimitOrder(
  value: unknown
): value is PendingLimitOrder {
  if (!value || typeof value !== 'object') return false;
  return (
    'limitPrice' in value &&
    typeof (value as { limitPrice?: unknown }).limitPrice === 'number'
  );
}

/**
 * Check which TP targets are hit by this bar (returns all hit targets, not just first)
 */
export function checkAllTargetsHitInBar(
  bar: { open: number; high: number; low: number; close: number } | null,
  tradeSettings: TradeSettings,
  hitTargets: number[] = []
): number[] {
  if (!bar || tradeSettings.takeProfitEnabled === false) return [];
  const hitInThisBar: number[] = [];

  if (tradeSettings.direction === 'long') {
    for (let i = 0; i < tradeSettings.takeProfitTargets.length; i++) {
      if (
        !hitTargets.includes(i) &&
        bar.high >= tradeSettings.takeProfitTargets[i].price
      ) {
        hitInThisBar.push(i);
      }
    }
  } else {
    for (let i = 0; i < tradeSettings.takeProfitTargets.length; i++) {
      if (
        !hitTargets.includes(i) &&
        bar.low <= tradeSettings.takeProfitTargets[i].price
      ) {
        hitInThisBar.push(i);
      }
    }
  }

  return hitInThisBar;
}

/**
 * Check if current bar's high/low hits take profit or stop loss (wick-based detection)
 * Priority: Stop Loss is checked first as it's more important for risk management
 */
export function checkTradeExitWithBar(
  bar: { open: number; high: number; low: number; close: number } | null,
  tradeSettings: TradeSettings,
  hitTargets: number[] = []
): {
  exitReason:
    | 'takeProfit'
    | 'takeProfitPartial'
    | 'stopLoss'
    | 'liquidation'
    | null;
  targetIndex?: number;
} {
  if (!bar) return { exitReason: null };

  const liquidationPrice =
    tradeSettings.isFutures &&
    (tradeSettings.entryLiquidationPrice != null ||
      tradeSettings.liquidationPrice != null)
      ? (tradeSettings.entryLiquidationPrice ?? tradeSettings.liquidationPrice)
      : null;

  if (tradeSettings.direction === 'long') {
    if (
      liquidationPrice != null &&
      liquidationPrice > 0 &&
      bar.low <= liquidationPrice
    ) {
      return { exitReason: 'liquidation' };
    }
    // For long positions: check SL first (low hit SL), then TP (high hit TP)
    if (
      tradeSettings.stopLossEnabled !== false &&
      bar.low <= tradeSettings.stopLoss
    ) {
      return { exitReason: 'stopLoss' };
    }

    // Check TP targets that haven't been hit yet
    if (tradeSettings.takeProfitEnabled !== false) {
      for (let i = 0; i < tradeSettings.takeProfitTargets.length; i++) {
        if (
          !hitTargets.includes(i) &&
          bar.high >= tradeSettings.takeProfitTargets[i].price
        ) {
          const isLastTarget =
            hitTargets.length + 1 === tradeSettings.takeProfitTargets.length;
          return {
            exitReason: isLastTarget ? 'takeProfit' : 'takeProfitPartial',
            targetIndex: i,
          };
        }
      }
    }
  } else {
    if (
      liquidationPrice != null &&
      liquidationPrice > 0 &&
      bar.high >= liquidationPrice
    ) {
      return { exitReason: 'liquidation' };
    }
    // For short positions: check SL first (high hit SL), then TP (low hit TP)
    if (
      tradeSettings.stopLossEnabled !== false &&
      bar.high >= tradeSettings.stopLoss
    ) {
      return { exitReason: 'stopLoss' };
    }

    // Check TP targets that haven't been hit yet
    if (tradeSettings.takeProfitEnabled !== false) {
      for (let i = 0; i < tradeSettings.takeProfitTargets.length; i++) {
        if (
          !hitTargets.includes(i) &&
          bar.low <= tradeSettings.takeProfitTargets[i].price
        ) {
          const isLastTarget =
            hitTargets.length + 1 === tradeSettings.takeProfitTargets.length;
          return {
            exitReason: isLastTarget ? 'takeProfit' : 'takeProfitPartial',
            targetIndex: i,
          };
        }
      }
    }
  }

  return { exitReason: null };
}

/**
 * Check if current price hits take profit or stop loss (legacy close-based detection)
 */
export function checkTradeExit(
  currentPrice: number,
  tradeSettings: TradeSettings,
  hitTargets: number[] = []
): {
  exitReason:
    | 'takeProfit'
    | 'takeProfitPartial'
    | 'stopLoss'
    | 'liquidation'
    | null;
  targetIndex?: number;
} {
  const liquidationPrice =
    tradeSettings.isFutures &&
    (tradeSettings.entryLiquidationPrice != null ||
      tradeSettings.liquidationPrice != null)
      ? (tradeSettings.entryLiquidationPrice ?? tradeSettings.liquidationPrice)
      : null;

  if (tradeSettings.direction === 'long') {
    if (
      liquidationPrice != null &&
      liquidationPrice > 0 &&
      currentPrice <= liquidationPrice
    ) {
      return { exitReason: 'liquidation' };
    }
    // For long positions: profit when price goes up, loss when price goes down
    // Check TP targets that haven't been hit yet
    if (tradeSettings.takeProfitEnabled !== false) {
      for (let i = 0; i < tradeSettings.takeProfitTargets.length; i++) {
        if (
          !hitTargets.includes(i) &&
          currentPrice >= tradeSettings.takeProfitTargets[i].price
        ) {
          const isLastTarget =
            hitTargets.length + 1 === tradeSettings.takeProfitTargets.length;
          return {
            exitReason: isLastTarget ? 'takeProfit' : 'takeProfitPartial',
            targetIndex: i,
          };
        }
      }
    }
    if (
      tradeSettings.stopLossEnabled !== false &&
      currentPrice <= tradeSettings.stopLoss
    ) {
      return { exitReason: 'stopLoss' };
    }
  } else {
    if (
      liquidationPrice != null &&
      liquidationPrice > 0 &&
      currentPrice >= liquidationPrice
    ) {
      return { exitReason: 'liquidation' };
    }
    // For short positions: profit when price goes down, loss when price goes up
    // Check TP targets that haven't been hit yet
    if (tradeSettings.takeProfitEnabled !== false) {
      for (let i = 0; i < tradeSettings.takeProfitTargets.length; i++) {
        if (
          !hitTargets.includes(i) &&
          currentPrice <= tradeSettings.takeProfitTargets[i].price
        ) {
          const isLastTarget =
            hitTargets.length + 1 === tradeSettings.takeProfitTargets.length;
          return {
            exitReason: isLastTarget ? 'takeProfit' : 'takeProfitPartial',
            targetIndex: i,
          };
        }
      }
    }
    if (
      tradeSettings.stopLossEnabled !== false &&
      currentPrice >= tradeSettings.stopLoss
    ) {
      return { exitReason: 'stopLoss' };
    }
  }

  return { exitReason: null };
}

/**
 * Calculate trade result
 */
export function calculateTradeResult(
  entryPrice: number,
  exitPrice: number,
  entryTime: number,
  exitTime: number,
  amount: number,
  direction: 'long' | 'short',
  exitReason:
    | 'takeProfit'
    | 'takeProfitPartial'
    | 'stopLoss'
    | 'liquidation'
    | 'barLimit'
    | 'periodEnd'
    | 'manual',
  takeProfitTargets?: TakeProfitTarget[],
  stopLoss?: number,
  takeProfitTargetIndex?: number,
  tradingFee: number = 0.1, // Trading fee percentage (default 0.1%)
  positionAdjustments?: PositionAdjustment[], // Include position adjustments if available
  partialExitDetails?: HitTakeProfitDetails[], // Include partial exit details if available
  options: {
    isFutures?: boolean;
    leverage?: number;
    balanceBeforeTrade?: number;
  } = {}
): TradeResult {
  let pnl: number;
  const leverageMultiplier = options.isFutures
    ? Math.max(1, options.leverage ?? 1)
    : 1;
  const effectiveQuote = amount * leverageMultiplier;

  if (direction === 'long') {
    const positionSize = effectiveQuote / entryPrice; // Base amount
    pnl = (exitPrice - entryPrice) * positionSize;
  } else {
    // Short position: profit when price goes down
    const positionSize = effectiveQuote / entryPrice; // Base amount
    pnl = (entryPrice - exitPrice) * positionSize;
  }

  // Apply trading fees: fee applied to both buy and sell (2 * fee * amount)
  const totalFees = (effectiveQuote * tradingFee * 2) / 100;
  pnl = pnl - totalFees;

  // ROI should be calculated relative to balance at trade start, not just the position size
  const roiBase = options.balanceBeforeTrade ?? amount;
  const roi = roiBase > 0 ? (pnl / roiBase) * 100 : 0;
  const duration = exitTime - entryTime;

  const result: TradeResult = {
    direction,
    entryPrice,
    exitPrice,
    entryTime,
    exitTime,
    pnl,
    roi,
    duration,
    amount,
    exitReason,
    takeProfit:
      takeProfitTargets && takeProfitTargets.length > 0
        ? takeProfitTargets[0].price
        : undefined,
    stopLoss,
    ...(takeProfitTargets && { takeProfitTargets }), // Only include if defined
    ...(positionAdjustments && { positionAdjustments }), // Include position adjustments if available
    ...(partialExitDetails && { partialExitDetails }), // Include partial exit details if available
  };

  if (takeProfitTargetIndex !== undefined) {
    result.takeProfitTargetIndex = takeProfitTargetIndex;
  }

  return result;
}

/**
 * Calculate ManualBacktesting score based on ROI and time efficiency
 */
export function calculateManualBacktestingScore(
  tradeResult: TradeResult
): number {
  const { roi, duration } = tradeResult;

  // Base score from ROI (scaled to be positive)
  const roiScore = Math.max(0, roi + 100); // Minimum 0, adds 100 to make neutral trades score 100

  // Time efficiency bonus (shorter trades get higher multiplier)
  const maxDurationHours = 168; // 1 week
  const durationHours = duration / (1000 * 60 * 60);
  const timeEfficiency = Math.max(0.1, 1 - durationHours / maxDurationHours);

  // Final score calculation
  let score = roiScore * timeEfficiency;

  // Guardrail: never rate profitable trades as "Poor"
  // If ROI >= 0, ensure a minimum score that maps to at least "Average"
  if (roi >= 0) {
    score = Math.max(score, 100);
  }

  return Math.round(score);
}

/**
 * Get score rating based on score value
 */
export function getScoreRating(score: number): {
  rating: string;
  color: string;
  description: string;
} {
  if (score >= 150) {
    return {
      rating: 'Excellent',
      color: 'text-green-600',
      description: 'Outstanding trading performance!',
    };
  } else if (score >= 120) {
    return {
      rating: 'Good',
      color: 'text-blue-600',
      description: 'Solid trading skills demonstrated.',
    };
  } else if (score >= 100) {
    return {
      rating: 'Average',
      color: 'text-yellow-600',
      description: 'Decent performance, room for improvement.',
    };
  } else if (score >= 70) {
    return {
      rating: 'Below Average',
      color: 'text-orange-600',
      description: 'Consider reviewing your strategy.',
    };
  } else {
    return {
      rating: 'Poor',
      color: 'text-red-600',
      description: "This trade didn't go as planned.",
    };
  }
}
