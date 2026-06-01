// Plan-limits adapter. Cloud has a tiered subscription model (free /
// paid) with caps on things like the number of trading pairs a single
// DCA bot can manage; sh has no plans and no caps. Shared form / utility
// code reads through `getPlanLimits()`; sh's default returns
// "unrestricted"; cloud registers a provider at boot via
// `registerPlanLimitsProvider()` that maps a plan name to real caps.

/** Effective plan caps for the current user. */
export interface PlanLimits {
  /** When true, the user cannot enable multi-pair mode (free-tier gate). */
  multiPairRestricted: boolean;
  /** Hard cap on the number of pairs allowed when multi is enabled. */
  maxAllowedPairs: number;
  /** True when the user is on a free / trial plan — drives "upgrade for
   *  higher limits" prompts. Always `false` in sh (no plan tiers). */
  isFreePlan: boolean;
}

/** Default applied when no provider is registered. Multi-pair is
 *  enabled and the cap is set to a value the bot runtime can actually
 *  manage — running with thousands of pairs is too heavy in practice. */
const DEFAULT_LIMITS: PlanLimits = {
  multiPairRestricted: false,
  maxAllowedPairs: 500,
  isFreePlan: false,
};

export type PlanLimitsResolver = (planName?: string | null) => PlanLimits;

let resolver: PlanLimitsResolver | null = null;

/**
 * Register the plan-limits resolver. Cloud calls this from `main.tsx`
 * before the first render. Subsequent calls replace the previous
 * resolver (useful in tests).
 */
export function registerPlanLimitsProvider(fn: PlanLimitsResolver): void {
  resolver = fn;
}

/** Resolve the caps for the given plan name. */
export function getPlanLimits(planName?: string | null): PlanLimits {
  return resolver ? resolver(planName) : DEFAULT_LIMITS;
}
