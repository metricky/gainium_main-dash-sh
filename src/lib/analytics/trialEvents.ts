/**
 * Trial / upgrade-funnel event registry.
 *
 * Like `paymentEvents.ts` (and unlike `events.ts`), these events are **NOT**
 * gated by the new-user window — they fire for the entire user base.
 * Rationale: starting a trial is a monetization-funnel action, and the
 * people who hit the trial dialog are frequently lapsed/returning users
 * well outside the activation window. Gating would hide most of the funnel.
 *
 * Volume stays low naturally — the dialog only renders when a user is
 * actively prompted to upgrade — so no artificial gating is needed to stay
 * under the PostHog free tier.
 *
 * The funnel we measure:
 *   trial_dialog_shown   → trial_started   (conversion)
 *
 * `source` tells us where the prompt fired so we can compare conversion of
 * the Subscription page CTA vs. the exchange-connect gate.
 */
import { track } from '@/lib/analytics';

export const TRIAL_EVENTS = {
  trial_dialog_shown: 'trial_dialog_shown',
  trial_started: 'trial_started',
} as const;

export type TrialEvent = (typeof TRIAL_EVENTS)[keyof typeof TRIAL_EVENTS];

/** Where the trial dialog was opened from. `subscription_page` = the
 *  "Claim Free Trial" CTA on /subscription. `exchange_select` = the
 *  trial gate shown when a user picks a premium-only exchange. */
export type TrialSource = 'subscription_page' | 'exchange_select';

type TrialProps = {
  source: TrialSource;
  /** Premium exchange that triggered the prompt — only set when
   *  `source === 'exchange_select'`. */
  exchange?: string;
};

export type TrialEventProps = {
  [TRIAL_EVENTS.trial_dialog_shown]: TrialProps;
  [TRIAL_EVENTS.trial_started]: TrialProps;
};

export function trackTrial<E extends TrialEvent>(
  event: E,
  properties: TrialEventProps[E]
): void {
  track(event, properties as Record<string, unknown>);
}
