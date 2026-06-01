/**
 * Payment / monetization event registry.
 *
 * Unlike `events.ts` (activation), these events are **NOT** gated by the
 * new-user window — they fire for the entire user base. Rationale:
 *   - Paying users are almost never inside the new-user window, so gating
 *     would zero-out the funnel.
 *   - The volume here is naturally low because the event only fires when
 *     someone actively tries to top up, so it stays under PostHog's free
 *     tier without artificial gating.
 *
 * The funnel we measure:
 *   checkout_submitted   → payment_succeeded   (conversion)
 *                        \ payment_failed      (quality signal, with `reason`)
 *
 * Always include `method` so PostHog can break the funnel down by
 * provider (stripe / paypal / bitcart / manual) without us maintaining
 * one event per provider.
 */
import { track } from '@/lib/analytics';

export const PAYMENT_EVENTS = {
  checkout_submitted: 'checkout_submitted',
  payment_succeeded: 'payment_succeeded',
  payment_failed: 'payment_failed',
} as const;

export type PaymentEvent = (typeof PAYMENT_EVENTS)[keyof typeof PAYMENT_EVENTS];

export type PaymentMethod = 'stripe' | 'paypal' | 'bitcart' | 'manual';

/** Stage at which the failure happened — useful for finding which provider
 *  step is breaking. `create` = order/invoice creation API call. `confirm` =
 *  user-facing checkout step (Stripe confirm, PayPal popup, Bitcart modal).
 *  `capture` = post-checkout settlement (Stripe SubscriptionReturn, PayPal
 *  captureOrder). `submit` = ManualPaymentForm submission. `expired` = the
 *  user let the invoice expire (Bitcart only). */
export type PaymentFailureStage =
  | 'create'
  | 'confirm'
  | 'capture'
  | 'submit'
  | 'expired';

export type PaymentEventProps = {
  [PAYMENT_EVENTS.checkout_submitted]: {
    method: PaymentMethod;
    amount: number;
  };
  [PAYMENT_EVENTS.payment_succeeded]: {
    method: PaymentMethod;
    amount: number;
    /** `true` for manual payments — balance isn't credited until an admin
     *  reviews the screenshot. Lets dashboards split "money in hand"
     *  from "money pending review". */
    manual_review?: boolean;
  };
  [PAYMENT_EVENTS.payment_failed]: {
    method: PaymentMethod;
    amount: number;
    stage: PaymentFailureStage;
    reason?: string;
  };
};

export function trackPayment<E extends PaymentEvent>(
  event: E,
  properties: PaymentEventProps[E]
): void {
  track(event, properties as Record<string, unknown>);
}
