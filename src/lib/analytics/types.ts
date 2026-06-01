// Analytics provider contract. The dispatcher in `./index.ts` is the
// only thing call sites see; the host app may register a real provider
// (PostHog, Segment, etc) at boot, or leave it unregistered so the
// dispatcher short-circuits to a no-op.
export interface AnalyticsProvider {
  /** Initialize the underlying SDK. Called once when the provider is
   *  registered. Should be idempotent. */
  init(): void;

  /** Fire a custom event. */
  track(eventName: string, properties?: Record<string, unknown>): void;

  /** Associate the current session with a user + optional traits.
   *  Call this on login. */
  identify(userId: string, traits?: Record<string, unknown>): void;

  /** Drop the current user association. Call on logout. */
  reset(resetDeviceId?: boolean): void;

  /** Track a route change. Implementations are expected to debounce /
   *  dedupe internally. */
  pageview(): void;

  /** True once `init()` has resolved successfully. Used as a guard by
   *  callers that don't want to do work when analytics is disabled. */
  isReady(): boolean;
}
