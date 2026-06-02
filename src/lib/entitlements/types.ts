/**
 * Cross-build entitlements contract.
 *
 * Cloud users are gated by subscription plan (`paidPlans` /
 * `userProfile.subscription.subscriptionPlanName`). Sh users are gated
 * by a license key (`user.licenseKey.isPremium`). Call sites shouldn't
 * have to know which mechanism is in play — they just need to know
 * whether the current user has paid access.
 *
 * The host build registers a hook via `registerEntitlementsProvider`
 * that resolves the platform-specific source. Both impls live next to
 * the adapter (sh) or in the cloud overlay (cloud).
 */
export interface EntitlementsState {
  /**
   * True when the user has paid access — covers any premium feature
   * gate (paid exchanges, premium variants, trial fall-through, etc.).
   * The single field every gate should read.
   */
  isPaid: boolean;
}

/** A React hook that returns the current entitlements state. */
export type UseEntitlementsHook = () => EntitlementsState;
