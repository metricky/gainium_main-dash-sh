import type { TrialState, UseTrialHook } from './types';

const DEFAULT_STATE: TrialState = { available: false };

// Module-level provider hook. Stays as the no-op until the host app
// registers a real one in `main.tsx` (before the first render). Same
// constraint as the license/analytics adapters — register
// synchronously at boot, before `createRoot(...).render(...)`, so the
// number of hooks called inside `useTrial()` is stable from React's
// perspective on every render.
let providerHook: UseTrialHook = () => DEFAULT_STATE;

/**
 * Register the trial provider hook for this build. Cloud registers a
 * hook backed by the `isTrialAvailable` query; sh leaves the default
 * (trial never available) so premium exchanges stay hard-blocked.
 * Must run before render.
 */
export function registerTrialProvider(hook: UseTrialHook): void {
  providerHook = hook;
}

/**
 * Read the current trial eligibility. Safe to call from any component;
 * returns `{ available: false }` when no provider is registered yet.
 */
export function useTrial(): TrialState {
  return providerHook();
}

export type { TrialState };
