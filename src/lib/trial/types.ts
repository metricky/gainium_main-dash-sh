// Trial provider contract. `useTrial()` reads from a hook registered
// by the host app at boot. Trials are a cloud-only concept (they map to
// the `trial` subscription plan); self-hosted has no trials, so the
// default provider reports the trial as unavailable and premium
// exchanges stay hard-blocked there.
export interface TrialState {
  /** True when the user is eligible to start a free trial right now.
   *  Cloud resolves this from the `isTrialAvailable` query; sh is
   *  always `false`. */
  available: boolean;
}

/**
 * A React hook that returns the current trial eligibility. Each
 * implementation registers during app bootstrap via
 * `registerTrialProvider`.
 */
export type UseTrialHook = () => TrialState;
