/**
 * Curated-preload adapter — side-effect hook called by
 * `useBotConfigPreload` when the staged sessionStorage payload contains
 * a `curated` hint (tier, strategy, backtest window).
 *
 * Cloud registers a hook that translates the hint into
 * `useBotFormPreloadStore.setBacktestHint(...)` +
 * `setPendingPresetId(...)` so the Quick Backtest panel and the Risk
 * Profile picker can pre-arm themselves. Sh leaves the registration
 * unset and the no-op default does nothing — there are no curated
 * producers in sh, so this path never fires.
 *
 * The hint type lives here so core's `useBotConfigPreload` can pass
 * the parsed shape without importing the cloud-side store.
 */
export interface CuratedPreloadHint {
  tier: 'short' | 'mid' | 'long';
  strategy: 'long' | 'short';
  backtest: {
    interval: string;
    from: number;
    to: number;
    windowDays: number;
  };
}

export interface CuratedPreloadArgs {
  /**
   * `staged.curated` parsed from the sessionStorage `botConfig` payload.
   * `null` when nothing is staged — the hook still has to be called
   * unconditionally to keep the hook count stable.
   */
  curated: CuratedPreloadHint | null | undefined;
  /**
   * Bot type from `staged.type`. Decides whether `pendingPresetId` is
   * stored as the bare tier ('short' | 'mid' | 'long', grid) or with
   * the `-term` suffix (DCA / combo).
   */
  stagedType: string | undefined;
}

export type UseCuratedPreloadHintsHook = (args: CuratedPreloadArgs) => void;

const noopHook: UseCuratedPreloadHintsHook = () => {
  /* no curated producers in sh — nothing to do */
};

let providerHook: UseCuratedPreloadHintsHook = noopHook;

/**
 * Register the curated-preload side-effect hook for this build. Must
 * run synchronously before the first render.
 */
export function registerCuratedPreloadHintsHook(
  hook: UseCuratedPreloadHintsHook,
): void {
  providerHook = hook;
}

/**
 * Apply the curated preload hint (Quick Backtest interval + window,
 * pending Risk Profile tier). No-op when no provider is registered.
 */
export function useCuratedPreloadHints(args: CuratedPreloadArgs): void {
  providerHook(args);
}
