import { IndicatorAction, IndicatorEnum, type SettingsIndicators } from '..';

export const IndicatorCategories = {
  Trend: 'trend',
  Momentum: 'momentum',
  Volatility: 'volatility',
  Volume: 'volume',
  Chart: 'chart',
  Technical: 'technical',
  Filter: 'filter',
} as const;

export type IndicatorCategory =
  (typeof IndicatorCategories)[keyof typeof IndicatorCategories];

export const IndicatorFieldTypes = {
  NUMBER: 'number',
  SELECT: 'select',
  BOOLEAN: 'boolean',
  INTERVAL: 'interval',
  STRING: 'string',
} as const;

export type IndicatorFieldType =
  (typeof IndicatorFieldTypes)[keyof typeof IndicatorFieldTypes];

type ConditionalDirective = {
  field: keyof SettingsIndicators;
  equals: unknown;
};

export interface IndicatorFieldOption {
  value: string | number | boolean;
  label: string;
  description?: string;
}

export interface IndicatorFieldDefinition {
  key: keyof SettingsIndicators;
  label: string;
  type: IndicatorFieldType;
  description?: string;
  tooltip?: string;
  tooltipURL?: string;
  defaultValue?: string | number | boolean | string[];
  required?: boolean;
  allowVariables?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: IndicatorFieldOption[];
  multiple?: boolean;
  hiddenWhen?: ConditionalDirective[];
  disabledWhen?: ConditionalDirective[];
}

export interface IndicatorDefinition {
  type: IndicatorEnum;
  label: string;
  shortLabel: string;
  category: IndicatorCategory;
  description: string;
  supportedActions: IndicatorAction[];
  fields: IndicatorFieldDefinition[];
  advancedFields?: IndicatorFieldDefinition[];
  pendingPort?: boolean;
  documentationUrl?: string;
}
