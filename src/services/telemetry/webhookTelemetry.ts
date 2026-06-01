import type { UseWebhookEligibilityResult } from '@/hooks/useWebhookEligibility';
import { logger } from '@/lib/loggerInstance';

export type WebhookTelemetryEventName =
  | 'webhook_surface_view'
  | 'webhook_upgrade_click'
  | 'webhook_copy_interaction'
  | 'webhook_option_interaction';

interface EmitOptions {
  event: WebhookTelemetryEventName;
  eligibility: UseWebhookEligibilityResult;
  metadata?: Record<string, unknown>;
}

const serializeEligibility = (
  eligibility: UseWebhookEligibilityResult
): Record<string, unknown> => ({
  context: eligibility.context,
  planName: eligibility.planName ?? 'none',
  hasWebhookSubscription: eligibility.hasWebhookSubscription,
  isTerminalBot: eligibility.isTerminalBot,
  canInteract: eligibility.canInteract,
  showUpgradeMessage: eligibility.showUpgradeMessage,
  showDowngradeWarning: eligibility.showDowngradeWarning,
  featureEnabled: eligibility.featureEnabled,
  reason: eligibility.reason ?? 'none',
  isLocked: eligibility.isLocked,
});

const emit = ({ event, eligibility, metadata }: EmitOptions): void => {
  const payload = {
    ...serializeEligibility(eligibility),
    ...metadata,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const globalAny = window as unknown as {
      analytics?: {
        track?: (eventName: string, data?: Record<string, unknown>) => void;
      };
      dataLayer?: Array<Record<string, unknown>>;
    };

    try {
      if (globalAny.analytics?.track) {
        globalAny.analytics.track(event, payload);
        return;
      }
    } catch (error) {
      logger.warn('Failed to forward webhook telemetry to analytics.track', {
        event,
        error,
      });
    }

    if (Array.isArray(globalAny.dataLayer)) {
      globalAny.dataLayer.push({ event, ...payload });
      return;
    }
  }

  logger.info(`[telemetry] ${event}`, payload);
};

export const trackWebhookSurfaceView = (
  eligibility: UseWebhookEligibilityResult,
  metadata?: Record<string, unknown>
): void => {
  emit({
    event: 'webhook_surface_view',
    eligibility,
    ...(metadata ? { metadata } : {}),
  });
};

export const trackWebhookUpgradeClick = (
  eligibility: UseWebhookEligibilityResult,
  metadata?: Record<string, unknown>
): void => {
  emit({
    event: 'webhook_upgrade_click',
    eligibility,
    ...(metadata ? { metadata } : {}),
  });
};

export const trackWebhookCopyInteraction = (
  eligibility: UseWebhookEligibilityResult,
  metadata: Record<string, unknown>
): void => {
  emit({ event: 'webhook_copy_interaction', eligibility, metadata });
};

export const trackWebhookOptionInteraction = (
  eligibility: UseWebhookEligibilityResult,
  metadata: Record<string, unknown>
): void => {
  emit({ event: 'webhook_option_interaction', eligibility, metadata });
};
