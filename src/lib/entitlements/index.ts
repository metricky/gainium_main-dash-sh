import type { EntitlementsState, UseEntitlementsHook } from './types';

const DEFAULT_STATE: EntitlementsState = { isPaid: false };

// Module-level provider hook. Stays as the no-op until the host app
// registers a real one in `main.tsx` (before the first render). The
// constraint mirrors `useLicense()` / `track()`: register
// synchronously at boot, before `createRoot(...).render(...)`, so the
// number of hooks called inside `useEntitlements()` is stable from
// React's perspective on every render.
let providerHook: UseEntitlementsHook = () => DEFAULT_STATE;

/**
 * Register the entitlements provider hook for this build. The host app
 * registers a hook that resolves whether the current user has paid
 * access (cloud: subscription plan; sh: premium license). Must run
 * before render.
 */
export function registerEntitlementsProvider(
  hook: UseEntitlementsHook
): void {
  providerHook = hook;
}

/**
 * Read the current entitlements state. Safe to call from any component;
 * returns a sensible default (`isPaid: false`) when no provider is
 * registered yet (early tests, storybook).
 *
 * Example:
 *   const { isPaid } = useEntitlements();
 *   if (!isPaid) { ...show upgrade CTA... }
 */
export function useEntitlements(): EntitlementsState {
  return providerHook();
}

export type { EntitlementsState };
