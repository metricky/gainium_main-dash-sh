import { useMemo } from 'react';
import useUserProfile from '@/hooks/useUserProfile';
/* import type { DcaBot } from '@/types/dcaBot'; */
import { isWebhookGatingEnabled } from '@/config/featureFlags';
import { useEntitlements } from '@/lib/entitlements';
import {
  computeWebhookEligibility,
  isTerminalBot,
  isTerminalFromFormData,
  type WebhookEligibilityState,
} from '@/lib/webhookEligibility';
import type { DCABot } from '@/types';

export type WebhookEligibilityContext =
  | 'modal'
  | 'drawer'
  | 'deal-start'
  | 'take-profit'
  | 'stop-loss';

export interface UseWebhookEligibilityOptions {
  bot?: DCABot | null;
  formData?: unknown;
  isEditMode?: boolean;
  /** Optional override when terminal determination is computed upstream. */
  isTerminalOverride?: boolean;
  context?: WebhookEligibilityContext;
}

export interface UseWebhookEligibilityResult extends WebhookEligibilityState {
  planName: string | null;
  hasWebhookSubscription: boolean;
  isTerminalBot: boolean;
  featureEnabled: boolean;
  context: WebhookEligibilityContext;
}

const DEFAULT_CONTEXT: WebhookEligibilityContext = 'modal';

export function useWebhookEligibility(
  options: UseWebhookEligibilityOptions = {}
): UseWebhookEligibilityResult {
  const {
    bot,
    formData,
    isEditMode = false,
    isTerminalOverride,
    context,
  } = options;
  const { userProfile } = useUserProfile();
  // Webhook eligibility is "the user has paid access of any kind."
  // Previously we matched against a hardcoded `WEBHOOK_PLAN_NAMES` set
  // of four plan names, which excluded the newer cloud tiers (edge,
  // elite, legend, master, mini, prime, vip1-4, trial). The
  // entitlements adapter resolves this uniformly: cloud → any plan in
  // `paidPlans`; sh → `useLicense().isPremium`.
  const { isPaid } = useEntitlements();

  const featureEnabled = useMemo(() => isWebhookGatingEnabled(), []);

  // `planName` stays on the result for analytics/labels only — it does
  // NOT drive the gating decision anymore.
  const planName = useMemo(() => {
    const rawPlan = userProfile?.subscription?.subscriptionPlanName;
    return rawPlan ? rawPlan.toLowerCase() : null;
  }, [userProfile?.subscription?.subscriptionPlanName]);

  const hasWebhookSubscription = isPaid;

  const isTerminal = useMemo(() => {
    if (typeof isTerminalOverride === 'boolean') {
      return isTerminalOverride;
    }

    if (bot) {
      return isTerminalBot(bot);
    }

    if (formData) {
      return isTerminalFromFormData(formData);
    }

    return false;
  }, [bot, formData, isTerminalOverride]);

  const eligibility = useMemo(() => {
    if (!bot && !formData && typeof isTerminalOverride !== 'boolean') {
      return {
        canInteract: false,
        showUpgradeMessage: false,
        showDowngradeWarning: false,
        isLocked: true,
        reason: 'missing-bot' as const,
      } satisfies WebhookEligibilityState;
    }

    return computeWebhookEligibility({
      featureEnabled,
      isTerminalBot: isTerminal,
      hasWebhookSubscription,
      isEditMode,
    });
  }, [
    featureEnabled,
    hasWebhookSubscription,
    isEditMode,
    isTerminal,
    bot,
    formData,
    isTerminalOverride,
  ]);

  return {
    ...eligibility,
    planName,
    hasWebhookSubscription,
    isTerminalBot: isTerminal,
    featureEnabled,
    context: context ?? DEFAULT_CONTEXT,
  };
}

export default useWebhookEligibility;
