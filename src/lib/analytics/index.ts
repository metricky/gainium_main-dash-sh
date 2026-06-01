import type { AnalyticsProvider } from './types';

// Module-level provider slot. Stays `null` when no provider is registered,
// so every dispatcher below is effectively a no-op at that point.
// No analytics SDK is imported by this file directly — keeps the bundle lean.
let provider: AnalyticsProvider | null = null;

/**
 * Register the analytics provider for this build. Call once during app
 * bootstrap. Calling twice replaces the previous provider — useful in tests,
 * ignored in production.
 */
export function registerAnalyticsProvider(p: AnalyticsProvider): void {
  provider = p;
  try {
    p.init();
  } catch {
    // Surface in dev; never throw out of bootstrap.
    if (import.meta.env.DEV) {
      console.error('[analytics] provider.init() threw');
    }
  }
}

/** True when a provider is registered AND ready. */
export function isReady(): boolean {
  return !!provider?.isReady();
}

/** Fire a custom event. Silent no-op when no provider is registered. */
export function track(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  provider?.track(eventName, properties);
}

/** Associate the session with a user. Silent no-op without a provider. */
export function identify(
  userId: string,
  traits?: Record<string, unknown>
): void {
  provider?.identify(userId, traits);
}

/** Clear the session's user association. Silent no-op without a provider. */
export function reset(resetDeviceId = false): void {
  provider?.reset(resetDeviceId);
}

/** Track a navigation. Provider is expected to debounce internally. */
export function pageview(): void {
  provider?.pageview();
}

export type { AnalyticsProvider };
