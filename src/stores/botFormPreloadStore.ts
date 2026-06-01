/**
 * One-shot preload bus for the bot creation form.
 *
 * Writers (curated-presets widget, BotCard "Copy to live", etc.) stage a
 * `botConfig` in sessionStorage and navigate to `/bot/new`. The
 * `TradingBotNew` page consumes that on mount, builds an
 * `initialFormData` for `<BotFormProvider>`, AND pushes the optional
 * backtest hint here so the Quick Backtest dialog can pre-arm itself
 * when it opens — without TradingBotNew having to thread props through
 * the panel/widget stack.
 *
 * This store is intentionally tiny and "consume once": every reader is
 * expected to call `consumeBacktestHint()` which atomically returns and
 * clears the value. No persistence — a refresh wipes it.
 */
import { create } from 'zustand';

export interface BacktestHint {
  /** Bar interval, e.g. '15m'. Matches `ExchangeIntervals` values. */
  interval: string;
  /** Window start (unix ms). */
  from: number;
  /** Window end (unix ms). */
  to: number;
  /** Optional human label shown on the form's info chip. */
  label?: string;
}

interface State {
  pending: BacktestHint | null;
  /**
   * Quick Setup tier id ('short-term' | 'mid-term' | 'long-term') the
   * curated-presets widget wants the form to auto-select. Lets the
   * form pre-highlight the matching tier card and skip its own
   * Mid-term auto-pick — which would otherwise overwrite the seeded
   * DCA values with locally-calibrated Mid-term values.
   */
  pendingPresetId: string | null;
  setBacktestHint: (hint: BacktestHint | null) => void;
  consumeBacktestHint: () => BacktestHint | null;
  setPendingPresetId: (id: string | null) => void;
  consumePendingPresetId: () => string | null;
}

export const useBotFormPreloadStore = create<State>((set, get) => ({
  pending: null,
  pendingPresetId: null,
  setBacktestHint: (hint) => set({ pending: hint }),
  consumeBacktestHint: () => {
    const v = get().pending;
    if (v) set({ pending: null });
    return v;
  },
  setPendingPresetId: (id) => set({ pendingPresetId: id }),
  consumePendingPresetId: () => {
    const v = get().pendingPresetId;
    if (v) set({ pendingPresetId: null });
    return v;
  },
}));
