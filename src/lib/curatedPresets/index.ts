/**
 * Curated-presets adapter — the extension point shared code (PresetsPicker,
 * GridPresetsPicker) uses to fetch backtested per-tier ROIs.
 *
 * Cloud registers a hook that calls the curated-presets API and returns
 * `{ tier -> {roi, generatedAt} }`. Self-hosted / sh builds leave the
 * registration unset and the no-op default returns `null`, so the Risk
 * Profile cards show no ROI chip — there is no curated worker in sh.
 *
 * Mirrors the analytics/license adapter pattern: register synchronously
 * at boot from `main.tsx` so the number of hooks called inside
 * `useCuratedPresetRois()` stays stable across renders.
 */
import { BotTypesEnum } from '../../types';

export type CuratedRoiBotType =
  | BotTypesEnum.dca
  | BotTypesEnum.combo
  | BotTypesEnum.grid;

export type CuratedPresetTier = 'short' | 'mid' | 'long';
export type CuratedPresetStrategy = 'long' | 'short';

export interface CuratedRoiTier {
  roi: number;
  /** ms epoch when the curated row was generated. Used for staleness UI. */
  generatedAt: number;
}

export type CuratedRoiByTier = Partial<
  Record<CuratedPresetTier, CuratedRoiTier>
>;

export interface UseCuratedPresetRoisArgs {
  /** Base asset, e.g. "BTC". Lookup is keyed on this + exchange. */
  coin: string | null | undefined;
  exchange: string | null | undefined;
  /**
   * Which DCA direction's ROI to surface. The curated API returns one
   * tier entry per (tier × strategy); the hook filters to the requested
   * side so the chip matches the form's current direction.
   */
  strategy?: CuratedPresetStrategy;
  /**
   * Which bot type's curated leaderboard to query. Defaults to DCA so
   * existing callers keep working; grid forms pass `BotTypesEnum.grid`
   * to surface grid-specific ROIs.
   */
  botType?: CuratedRoiBotType;
}

export type UseCuratedPresetRoisHook = (
  args: UseCuratedPresetRoisArgs,
) => CuratedRoiByTier | null;

const noopHook: UseCuratedPresetRoisHook = () => null;

let providerHook: UseCuratedPresetRoisHook = noopHook;

/**
 * Register the curated-preset-ROIs hook for this build. Cloud registers
 * a real hook backed by the `/api/curated-presets` endpoint; sh leaves
 * it unregistered and the default returns `null` for every lookup.
 * Must run synchronously before the first render.
 */
export function registerCuratedPresetRoisProvider(
  hook: UseCuratedPresetRoisHook,
): void {
  providerHook = hook;
}

/**
 * Read per-tier ROI for the given (coin, exchange, botType, strategy).
 * Returns `null` when no provider is registered, when no symbol/
 * exchange is selected, or when the backend has no curated row.
 */
export function useCuratedPresetRois(
  args: UseCuratedPresetRoisArgs,
): CuratedRoiByTier | null {
  return providerHook(args);
}
