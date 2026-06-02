import { BotTypesEnum, type DCABot, type DCABotSettings } from '@/types';
/* import type { DcaBot } from '@/types/dcaBot'; */

// NOTE: a `WEBHOOK_PLAN_NAMES` constant used to live here, listing four
// plan names against which webhook eligibility was matched. It became
// stale every time cloud added a new tier (edge / elite / legend /
// master / mini / prime / vip1-4 / trial). Eligibility now flows
// through `useEntitlements().isPaid` in `useWebhookEligibility`, so
// every paid plan (and any sh license-key premium) unlocks webhooks
// uniformly. This comment exists so the rename isn't surprising to
// future readers looking up the constant.

export const TERMINAL_TYPE_TOKEN = 'terminal';

export type WebhookEligibilityReason =
  | 'feature-disabled'
  | 'plan-locked'
  | 'missing-bot'
  | null;

export interface WebhookEligibilityInput {
  /** Whether the runtime kill-switch leaves gating active. Defaults to true. */
  featureEnabled?: boolean;
  /** Whether the bot (or form) represents a terminal strategy. */
  isTerminalBot: boolean;
  /** Whether the current subscription plan includes webhook automation. */
  hasWebhookSubscription: boolean;
  /** Whether we are editing an existing bot which may already have webhook data. */
  isEditMode?: boolean;
}

export interface WebhookEligibilityState {
  /** True when users can interact with webhook payloads (copy, tab switch, etc.). */
  canInteract: boolean;
  /** True when we should show an upgrade banner. */
  showUpgradeMessage: boolean;
  /** True when an edit-mode downgrade needs a warning about read-only state. */
  showDowngradeWarning: boolean;
  /** Whether we are preventing interaction due to gating. */
  isLocked: boolean;
  /** Machine friendly reason for analytics. */
  reason: WebhookEligibilityReason;
}

export function computeWebhookEligibility(
  input: WebhookEligibilityInput
): WebhookEligibilityState {
  const {
    featureEnabled = true,
    isTerminalBot,
    hasWebhookSubscription,
    isEditMode = false,
  } = input;

  if (!featureEnabled) {
    return {
      canInteract: true,
      showUpgradeMessage: false,
      showDowngradeWarning: false,
      isLocked: false,
      reason: 'feature-disabled',
    };
  }

  if (!isTerminalBot) {
    return {
      canInteract: true,
      showUpgradeMessage: false,
      showDowngradeWarning: false,
      isLocked: false,
      reason: null,
    };
  }

  if (hasWebhookSubscription) {
    return {
      canInteract: true,
      showUpgradeMessage: false,
      showDowngradeWarning: false,
      isLocked: false,
      reason: null,
    };
  }

  return {
    canInteract: false,
    showUpgradeMessage: true,
    showDowngradeWarning: isEditMode,
    isLocked: true,
    reason: 'plan-locked',
  };
}

export type TerminalCandidate =
  | string
  | undefined
  | null
  | { value?: string | null };

export function normalizeTypeCandidate(
  candidate: TerminalCandidate
): string | null {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    return trimmed.length ? trimmed.toLowerCase() : null;
  }

  if (typeof candidate === 'object' && 'value' in candidate) {
    const rawValue = candidate.value ?? null;
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      return trimmed.length ? trimmed.toLowerCase() : null;
    }
  }

  return null;
}

export function isTerminalFromCandidates(
  ...candidates: TerminalCandidate[]
): boolean {
  return candidates
    .map((candidate) => normalizeTypeCandidate(candidate))
    .filter((value): value is string => Boolean(value))
    .some((value) => value === TERMINAL_TYPE_TOKEN);
}

export function isTerminalBot(bot?: DCABot | null): boolean {
  if (!bot || bot.type !== BotTypesEnum.dca) {
    return false;
  }

  return isTerminalFromCandidates(
    (bot.settings as DCABotSettings)?.type,
    (bot as unknown as { type?: string })?.type
  );
}

export function isTerminalFromFormData(formData: unknown): boolean {
  if (!formData || typeof formData !== 'object') {
    return false;
  }

  const typedFormData = formData as {
    type?: string | null;
    botType?: string | null;
    strategy?: string | null;
    settings?: { type?: string | null } | null;
  };

  return isTerminalFromCandidates(
    typedFormData.type,
    typedFormData.botType,
    typedFormData.strategy,
    typedFormData.settings?.type
  );
}
