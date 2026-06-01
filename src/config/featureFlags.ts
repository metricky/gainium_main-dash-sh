const toBoolean = (
  value: string | boolean | undefined | null,
  defaultValue: boolean
): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return defaultValue;
};

export const isWebhookGatingEnabled = (): boolean =>
  toBoolean(import.meta.env['VITE_FEATURE_WEBHOOK_GATING'], true);

export default {
  isWebhookGatingEnabled,
};
