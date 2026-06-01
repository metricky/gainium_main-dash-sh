import type {
  IndicatorDefinition,
  IndicatorFieldDefinition,
} from '@/types/indicators/indicatorTypes';
import type { SettingsIndicators } from '@/types';

const getOptionLabel = (
  field: IndicatorFieldDefinition,
  value: string | number | boolean
): string | undefined => {
  const options = field.options ?? [];
  return options.find((option) => String(option.value) === String(value))
    ?.label;
};

export const formatIndicatorParamValue = (
  field: IndicatorFieldDefinition,
  value: unknown
): string => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return '';
    }
    if (
      (field.type === 'select' || field.type === 'interval') &&
      field.options?.length
    ) {
      return getOptionLabel(field, trimmed) ?? trimmed;
    }
    return trimmed;
  }

  if (
    (field.type === 'select' || field.type === 'interval') &&
    field.options?.length
  ) {
    return (
      getOptionLabel(field, value as string | number | boolean) ?? String(value)
    );
  }

  return String(value);
};

export const buildIndicatorSummary = (
  definition: IndicatorDefinition,
  params: SettingsIndicators,
  maxItems = 3
): string[] => {
  const fields: IndicatorFieldDefinition[] = [
    ...definition.fields,
    ...(definition.advancedFields ?? []),
  ];

  const summary: string[] = [];
  for (const field of fields) {
    if (summary.length >= maxItems) {
      break;
    }
    const value = params?.[field.key];
    const formatted = formatIndicatorParamValue(field, value);
    if (!formatted) {
      continue;
    }
    summary.push(`${field.label}: ${formatted}`);
  }

  return summary;
};
