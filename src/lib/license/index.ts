import type { LicenseState, UseLicenseHook } from './types';

const DEFAULT_STATE: LicenseState = { isPremium: false, hasKey: false };

// Module-level provider hook. Stays as the no-op until the host app
// registers a real one in `main.tsx` (before the first render). The
// constraint is the same as the analytics adapter — register
// synchronously at boot, before `createRoot(...).render(...)`, so the
// number of hooks called inside `useLicense()` is stable from React's
// perspective on every render.
let providerHook: UseLicenseHook = () => DEFAULT_STATE;

/**
 * Register the license provider hook for this build. The host app
 * registers a hook that resolves the user's premium status (typically
 * by reading the validated license key). Must run before render.
 */
export function registerLicenseProvider(hook: UseLicenseHook): void {
  providerHook = hook;
}

/**
 * Read the current license state. Safe to call from any component;
 * returns a sensible default (`isPremium: false`) when no provider is
 * registered yet (early tests, storybook).
 */
export function useLicense(): LicenseState {
  return providerHook();
}

export type { LicenseState };
