import { useMemo } from 'react';
import useUserProfile from '@/hooks/useUserProfile';
/* import type { DcaBot } from '@/types/dcaBot'; */
import { isWebhookGatingEnabled } from '@/config/featureFlags';
import {
  computeWebhookEligibility,
  isTerminalBot,
  isTerminalFromFormData,
  type WebhookEligibilityState,
  WEBHOOK_PLAN_NAMES,
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

  const featureEnabled = useMemo(() => isWebhookGatingEnabled(), []);

  const planName = useMemo(() => {
    const rawPlan = userProfile?.subscription?.subscriptionPlanName;
    return rawPlan ? rawPlan.toLowerCase() : null;
  }, [userProfile?.subscription?.subscriptionPlanName]);

  const hasWebhookSubscription = useMemo(() => {
    if (!planName) {
      return false;
    }

    return WEBHOOK_PLAN_NAMES.has(planName);
  }, [planName]);

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
