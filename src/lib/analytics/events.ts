/**
 * Activation event registry — the only PostHog events we capture for the
 * new-user activation funnel. All other tracking should not use this module.
 *
 * Events are gated to "new users" only (see ./newUserGate). This keeps the
 * captured volume small enough to stay under the PostHog free-tier cap, since
 * the population of users in the activation window is much smaller than the
 * full user base.
 *
 * The funnel we measure:
 *   signup_completed
 *     → tutorial_completed | tutorial_skipped
 *     → exchange_connect_succeeded   (with _failed as a quality signal)
 *     → bot_created                   (split by bot_type, trading_mode)
 *     → bot_first_deal_closed         (with profit_positive)
 */
import { track } from '@/lib/analytics';
import { isNewUser } from './newUserGate';

export const ACTIVATION_EVENTS = {
  signup_completed: 'signup_completed',
  tutorial_completed: 'tutorial_completed',
  tutorial_skipped: 'tutorial_skipped',
  exchange_connect_succeeded: 'exchange_connect_succeeded',
  exchange_connect_failed: 'exchange_connect_failed',
  bot_created: 'bot_created',
  bot_first_deal_closed: 'bot_first_deal_closed',
} as const;

export type ActivationEvent =
  (typeof ACTIVATION_EVENTS)[keyof typeof ACTIVATION_EVENTS];

export type TradingMode = 'live' | 'paper' | 'demo';

export type ActivationEventProps = {
  [ACTIVATION_EVENTS.signup_completed]: Record<string, never>;
  [ACTIVATION_EVENTS.tutorial_completed]: { steps_total?: number };
  [ACTIVATION_EVENTS.tutorial_skipped]: { step_index?: number; step_id?: string };
  [ACTIVATION_EVENTS.exchange_connect_succeeded]: {
    exchange?: string;
    trading_mode: TradingMode;
  };
  [ACTIVATION_EVENTS.exchange_connect_failed]: {
    exchange?: string;
    trading_mode: TradingMode;
    reason?: string;
  };
  [ACTIVATION_EVENTS.bot_created]: {
    bot_type: string; // raw BotTypesEnum value (dca, grid, combo, hedgeDca, hedgeCombo, terminal)
    trading_mode: TradingMode;
  };
  [ACTIVATION_EVENTS.bot_first_deal_closed]: { profit_positive: boolean };
};

/**
 * Fire an activation event — no-ops for users outside the new-user window
 * or who have already activated. Use this instead of calling `track()`
 * directly for any event in `ACTIVATION_EVENTS`.
 *
 * `signup_completed` bypasses the gate because it fires exactly once per
 * user (anchored by the first-seen check in usePostHogIdentification).
 */
export function trackActivation<E extends ActivationEvent>(
  event: E,
  properties: ActivationEventProps[E],
  options?: { bypassGate?: boolean }
): void {
  if (!options?.bypassGate && !isNewUser()) return;
  track(event, properties as Record<string, unknown>);
}
