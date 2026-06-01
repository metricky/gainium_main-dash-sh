import type { BotFormData } from '@/types/bots/form';
import {
  BotTypesEnum,
  DCAConditionEnum,
  MAX_DCA_ORDERS,
  MAX_DCA_STEP_SCALE,
  MAX_DCA_VOLUME_SCALE,
  MIN_DCA_ORDER_STEP,
  MIN_DCA_ORDERS,
  MIN_DCA_STEP_SCALE,
  MIN_DCA_TP,
  MIN_DCA_TP_NEW,
  MIN_DCA_VOLUME_SCALE,
} from '@/types';

import {
  deriveSmartOrdersRange,
  type SmartOrdersRangeResult,
} from './smart-orders';

export type RangeSource =
  | 'default'
  | 'combo-default'
  | 'hedge-default'
  | 'override';

export interface RangeOverrideDetail {
  key: string;
  value: number;
}

export interface RangeBaseDescriptor {
  value: number;
  source: RangeSource;
  min?: number;
  max?: number | null;
}

export interface RangeBounds {
  min: number;
  max: number | null;
  source: RangeSource;
  appliedOverrides: RangeOverrideDetail[];
  base: RangeBaseDescriptor;
  metadata?: Record<string, unknown>;
}

export interface DcaDerivedRanges {
  tpPerc: RangeBounds;
  ordersCount: RangeBounds;
  step: RangeBounds;
  stepScale: RangeBounds;
  volumeScale: RangeBounds;
  smartOrders: RangeBounds;
}

type NumericCandidate = number | string | null | undefined;

const RANGE_CONTAINER_PATHS = [
  'ranges',
  'rangeOverrides',
  'metadata.ranges',
  'metadata.rangeOverrides',
  'limits',
  'constraints',
  'dcaRanges',
  'backendRanges',
  'backendLimits',
  'capabilities.ranges',
];

const ORDERS_COUNT_MIN_PATHS = [
  'ordersCountRange.min',
  'ordersCountMin',
  'minOrdersCount',
  'minimumOrdersCount',
  'ordersCount.minimum',
  'orders_count_min',
];

const ORDERS_COUNT_MAX_PATHS = [
  'ordersCountRange.max',
  'ordersCountMax',
  'maxOrdersCount',
  'maximumOrdersCount',
  'ordersCount.maximum',
  'orders_count_max',
];

const STEP_MIN_PATHS = [
  'stepRange.min',
  'stepRange.minimum',
  'stepMin',
  'minStep',
  'minimumStep',
  'stepsMin',
  'dcaStep.min',
  'scaling.step.min',
];

const STEP_MAX_PATHS = [
  'stepRange.max',
  'stepRange.maximum',
  'stepMax',
  'maxStep',
  'maximumStep',
  'stepsMax',
  'dcaStep.max',
  'scaling.step.max',
];

const SCALE_MIN_PATHS = {
  stepScale: [
    'stepScaleRange.min',
    'stepScaleMin',
    'minimumStepScale',
    'dcaStepScale.min',
  ],
  volumeScale: [
    'volumeScaleRange.min',
    'volumeScaleMin',
    'minimumVolumeScale',
    'dcaVolumeScale.min',
  ],
};

const SCALE_MAX_PATHS = {
  stepScale: [
    'stepScaleRange.max',
    'stepScaleMax',
    'maximumStepScale',
    'dcaStepScale.max',
  ],
  volumeScale: [
    'volumeScaleRange.max',
    'volumeScaleMax',
    'maximumVolumeScale',
    'dcaVolumeScale.max',
  ],
};

const SMART_ORDERS_MIN_PATHS = [
  'smartOrdersRange.min',
  'activeOrdersCountRange.min',
  'smartOrdersMin',
  'minSmartOrders',
  'minimumSmartOrders',
  'activeOrdersCountMin',
  'minimumActiveOrdersCount',
];

const SMART_ORDERS_MAX_PATHS = [
  'smartOrdersRange.max',
  'activeOrdersCountRange.max',
  'smartOrdersMax',
  'maxSmartOrders',
  'maximumSmartOrders',
  'activeOrdersCountMax',
  'maximumActiveOrdersCount',
];

const DEFAULT_STEP_MAX_PERCENT = 10;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const roundTo = (value: number, precision = 3): number => {
  if (!Number.isFinite(value)) {
    return value;
  }
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const normalizeNumericCandidate = (
  candidate: NumericCandidate
): number | undefined => {
  if (candidate === null || candidate === undefined) {
    return undefined;
  }

  if (typeof candidate === 'number') {
    return Number.isFinite(candidate) ? candidate : undefined;
  }

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (!trimmed) {
      return undefined;
    }

    // Remove percentage symbols and spaces while keeping numeric content
    const sanitized = trimmed.replace(/%/g, '').replace(/[^0-9.,+-]/g, '');
    if (!sanitized) {
      return undefined;
    }

    const normalized = sanitized.replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const getPropertyByPath = (target: unknown, path: string): unknown => {
  if (!path) {
    return undefined;
  }

  return path.split('.').reduce<unknown>((accumulator, segment) => {
    if (!accumulator || typeof accumulator !== 'object') {
      return undefined;
    }
    const record = accumulator as Record<string, unknown>;
    return record[segment];
  }, target);
};

const collectContainerOverrides = (
  formData: BotFormData,
  field: string,
  bound: 'min' | 'max'
): RangeOverrideDetail[] => {
  const overrides: RangeOverrideDetail[] = [];

  RANGE_CONTAINER_PATHS.forEach((containerPath) => {
    const container = getPropertyByPath(formData, containerPath);
    if (!isRecord(container)) {
      return;
    }

    const fieldValue = getPropertyByPath(container, field);
    if (!isRecord(fieldValue)) {
      return;
    }

    const candidate = getPropertyByPath(fieldValue, bound);
    const normalized = normalizeNumericCandidate(candidate as NumericCandidate);
    if (normalized !== undefined) {
      overrides.push({
        key: `${containerPath}.${field}.${bound}`,
        value: normalized,
      });
    }
  });

  return overrides;
};

const collectDirectOverrides = (
  formData: BotFormData,
  paths: string[]
): RangeOverrideDetail[] => {
  const overrides: RangeOverrideDetail[] = [];
  paths.forEach((path) => {
    const candidate = getPropertyByPath(formData, path);
    const normalized = normalizeNumericCandidate(candidate as NumericCandidate);
    if (normalized !== undefined) {
      overrides.push({ key: path, value: normalized });
    }
  });
  return overrides;
};

const dedupeOverrides = (
  overrides: RangeOverrideDetail[]
): RangeOverrideDetail[] => {
  const seen = new Set<string>();
  return overrides.filter((override) => {
    if (seen.has(override.key)) {
      return false;
    }
    seen.add(override.key);
    return true;
  });
};

const convertDecimalToPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return value;
  }
  if (Math.abs(value) <= 1) {
    return value * 100;
  }
  return value;
};

const clampValue = (
  value: number,
  bounds: { min?: number; max?: number | null }
): number => {
  let result = value;
  if (Number.isFinite(result) && typeof bounds.min === 'number') {
    result = Math.max(bounds.min, result);
  }
  if (
    Number.isFinite(result) &&
    bounds.max !== null &&
    bounds.max !== undefined &&
    Number.isFinite(bounds.max)
  ) {
    result = Math.min(result, bounds.max as number);
  }
  return result;
};

interface NumericRangeConfig {
  field: string;
  baseMin: number;
  baseMax: number | null;
  precision?: number;
  minPaths?: string[];
  maxPaths?: string[];
  minTransform?: (value: number) => number;
  maxTransform?: (value: number) => number;
  absoluteMin?: number;
  absoluteMax?: number | null;
}

const resolveNumericRange = (
  formData: BotFormData,
  config: NumericRangeConfig
): RangeBounds => {
  const precision = config.precision ?? 3;
  const appliedOverrides: RangeOverrideDetail[] = [];

  let resolvedMin = config.baseMin;
  let hasOverrides = false;

  const minOverrides = dedupeOverrides([
    ...collectContainerOverrides(formData, config.field, 'min'),
    ...(config.minPaths
      ? collectDirectOverrides(formData, config.minPaths)
      : []),
  ]);

  const maxOverrides = dedupeOverrides([
    ...collectContainerOverrides(formData, config.field, 'max'),
    ...(config.maxPaths
      ? collectDirectOverrides(formData, config.maxPaths)
      : []),
  ]);

  minOverrides.forEach((override) => {
    let value = override.value;
    if (config.minTransform) {
      value = config.minTransform(value);
    }
    const clamped = clampValue(value, {
      min: config.absoluteMin ?? config.baseMin,
      max: config.absoluteMax ?? config.baseMax,
    });
    if (Number.isFinite(clamped)) {
      resolvedMin = Math.max(resolvedMin, clamped);
      appliedOverrides.push({
        key: override.key,
        value: roundTo(clamped, precision),
      });
      hasOverrides = true;
    }
  });

  const maxBounds: { min?: number; max?: number | null } = {
    min: resolvedMin,
    max: config.absoluteMax ?? config.baseMax,
  };

  const baseMax = config.baseMax;
  let tentativeMax =
    baseMax === null || baseMax === undefined
      ? Number.POSITIVE_INFINITY
      : baseMax;

  maxOverrides.forEach((override) => {
    let value = override.value;
    if (config.maxTransform) {
      value = config.maxTransform(value);
    }
    const clamped = clampValue(value, maxBounds);
    if (Number.isFinite(clamped)) {
      tentativeMax = Math.min(tentativeMax, clamped);
      appliedOverrides.push({
        key: override.key,
        value: roundTo(clamped, precision),
      });
      hasOverrides = true;
    }
  });

  let resolvedMaxSanitized: number | null;
  if (tentativeMax === Number.POSITIVE_INFINITY) {
    resolvedMaxSanitized = config.baseMax;
  } else {
    resolvedMaxSanitized = Math.max(tentativeMax, resolvedMin);
  }

  const roundedMin = roundTo(resolvedMin, precision);
  const roundedMax =
    resolvedMaxSanitized === null || resolvedMaxSanitized === undefined
      ? null
      : roundTo(resolvedMaxSanitized, precision);

  return {
    min: roundedMin,
    max: roundedMax,
    source: hasOverrides ? 'override' : 'default',
    appliedOverrides,
    base: {
      value: roundTo(config.baseMin, precision),
      source: 'default',
      min: roundTo(config.baseMin, precision),
      max:
        config.baseMax === null || config.baseMax === undefined
          ? null
          : roundTo(config.baseMax, precision),
    },
  };
};

const resolveMakerFee = (formData: BotFormData): number => {
  const maker = formData.userFee?.makerCommission;
  const normalized = normalizeNumericCandidate(maker);
  if (normalized === undefined || normalized < 0) {
    return 0;
  }
  return normalized;
};

const resolveOrdersCountRange = (formData: BotFormData): RangeBounds => {
  const isComboBot = formData.type === BotTypesEnum.combo;
  const useMulti = isComboBot ? formData.combo.useMulti : formData.dca.useMulti;
  const useSmartOrders = isComboBot
    ? formData.combo.useSmartOrders
    : formData.dca.useSmartOrders;
  const _maxDealsPerPair = isComboBot
    ? formData.combo.maxDealsPerPair
    : formData.dca.maxDealsPerPair;
  const maxNumberOfOpenDeals = isComboBot
    ? formData.combo.maxNumberOfOpenDeals
    : formData.dca.maxNumberOfOpenDeals;
  const maxDealsPerPair = normalizeNumericCandidate(_maxDealsPerPair) ?? 1;
  const maxOpenDeals = normalizeNumericCandidate(maxNumberOfOpenDeals) ?? 1;
  const denominator = useMulti
    ? Math.max(1, maxDealsPerPair)
    : Math.max(1, maxOpenDeals);
  const planCeilingRaw = MAX_DCA_ORDERS / denominator;
  const planCeiling = Math.max(MIN_DCA_ORDERS, Math.floor(planCeilingRaw));

  const baseMax = planCeiling;

  const range = resolveNumericRange(formData, {
    field: 'ordersCount',
    baseMin: MIN_DCA_ORDERS,
    baseMax,
    precision: 0,
    minPaths: ORDERS_COUNT_MIN_PATHS,
    maxPaths: ORDERS_COUNT_MAX_PATHS,
    absoluteMin: MIN_DCA_ORDERS,
    absoluteMax: MAX_DCA_ORDERS,
  });

  return {
    ...range,
    metadata: {
      planCeiling,
      denominator,
      useMulti: Boolean(useMulti),
      useSmartOrders: Boolean(useSmartOrders),
    },
  };
};

const resolveStepRange = (formData: BotFormData): RangeBounds => {
  const makerFee = resolveMakerFee(formData);
  const baseMinPercent = Math.max(MIN_DCA_ORDER_STEP, makerFee * 2) * 100;
  const range = resolveNumericRange(formData, {
    field: 'step',
    baseMin: baseMinPercent,
    baseMax: DEFAULT_STEP_MAX_PERCENT,
    precision: 2,
    minPaths: STEP_MIN_PATHS,
    maxPaths: STEP_MAX_PATHS,
    minTransform: convertDecimalToPercent,
    maxTransform: convertDecimalToPercent,
    absoluteMin: MIN_DCA_ORDER_STEP * 100,
    absoluteMax: DEFAULT_STEP_MAX_PERCENT,
  });

  return {
    ...range,
    metadata: {
      makerFee,
    },
  };
};

const resolveScaleRange = (
  formData: BotFormData,
  field: 'stepScale' | 'volumeScale',
  baseMin: number,
  baseMax: number
): RangeBounds =>
  resolveNumericRange(formData, {
    field,
    baseMin,
    baseMax,
    precision: 2,
    minPaths: SCALE_MIN_PATHS[field],
    maxPaths: SCALE_MAX_PATHS[field],
    absoluteMin: baseMin,
    absoluteMax: baseMax,
  });

const resolveSmartOrdersRangeBounds = (formData: BotFormData): RangeBounds => {
  const isComboBot = formData.type === BotTypesEnum.combo;
  const dcaCondition = isComboBot
    ? formData.combo.dcaCondition
    : formData.dca.dcaCondition;
  const dcaCustom = isComboBot
    ? formData.combo.dcaCustom
    : formData.dca.dcaCustom;
  const maxDealsPerPair = isComboBot
    ? formData.combo.maxDealsPerPair
    : formData.dca.maxDealsPerPair;
  const maxNumberOfOpenDeals = isComboBot
    ? formData.combo.maxNumberOfOpenDeals
    : formData.dca.maxNumberOfOpenDeals;
  const useMulti = isComboBot ? formData.combo.useMulti : formData.dca.useMulti;
  const ordersCount = isComboBot
    ? formData.combo.ordersCount
    : formData.dca.ordersCount;
  const smartRange: SmartOrdersRangeResult = deriveSmartOrdersRange({
    ordersCount: ordersCount,
    dcaCondition: dcaCondition || DCAConditionEnum.percentage,
    dcaCustom: dcaCustom || [],
    useMulti: !useMulti,
    maxDealsPerPair: maxDealsPerPair || '1',
    maxNumberOfOpenDeals: maxNumberOfOpenDeals || '1',
  });

  const range = resolveNumericRange(formData, {
    field: 'smartOrders',
    baseMin: smartRange.min,
    baseMax: smartRange.max,
    precision: 0,
    minPaths: SMART_ORDERS_MIN_PATHS,
    maxPaths: SMART_ORDERS_MAX_PATHS,
    absoluteMin: MIN_DCA_ORDERS,
    absoluteMax: MAX_DCA_ORDERS,
  });

  const appliedOverrides = [...range.appliedOverrides];

  if (smartRange.limitSource) {
    appliedOverrides.push({
      key: `limitSource:${smartRange.limitSource}`,
      value: roundTo(smartRange.max, 0),
    });
  }

  return {
    ...range,
    appliedOverrides,
    metadata: {
      ...(range.metadata ?? {}),
      limitSource: smartRange.limitSource,
      ordersCeiling: smartRange.ordersCeiling,
      planCeiling: smartRange.planCeiling,
    },
  };
};

const TAKE_PROFIT_OVERRIDE_KEYS = [
  'minTpFloor',
  'minTpMinimum',
  'minimumTakeProfit',
  'minTakeProfit',
];

const roundPercent = (value: number): number =>
  Math.round(Number(value) * 1000) / 1000;

const normalizePercentCandidate = (value: unknown): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  const numeric =
    typeof value === 'number'
      ? value
      : Number.parseFloat(String(value).replace(',', '.'));

  if (!Number.isFinite(numeric) || numeric < 0) {
    return undefined;
  }

  if (numeric === 0) {
    return 0;
  }

  if (numeric > 1000) {
    return undefined;
  }

  if (numeric < 0.01) {
    return roundPercent(numeric * 100);
  }

  return roundPercent(numeric);
};

const resolveBaseRange = (
  formData: BotFormData
): {
  value: number;
  source: RangeSource;
} => {
  const isCombo = formData.type === 'combo';
  const isHedge =
    formData.type === 'hedgeCombo' || formData.type === 'hedgeDca';

  if (isCombo) {
    return {
      value: roundPercent(MIN_DCA_TP_NEW * 100),
      source: 'combo-default',
    };
  }

  if (isHedge) {
    return {
      value: roundPercent(MIN_DCA_TP_NEW * 100),
      source: 'hedge-default',
    };
  }

  return {
    value: roundPercent(MIN_DCA_TP * 100),
    source: 'default',
  };
};

export const resolveTakeProfitRange = (formData: BotFormData): RangeBounds => {
  const base = resolveBaseRange(formData);
  const appliedOverrides: RangeOverrideDetail[] = [];

  const formDataRecord = formData as unknown as Record<string, unknown>;

  TAKE_PROFIT_OVERRIDE_KEYS.forEach((key) => {
    const candidate = formDataRecord[key];
    const normalized = normalizePercentCandidate(candidate);
    if (normalized !== undefined) {
      appliedOverrides.push({ key, value: normalized });
    }
  });

  const min = appliedOverrides.reduce<number>(
    (accumulator, override) => Math.max(accumulator, override.value),
    base.value
  );

  return {
    min: roundPercent(min),
    max: null,
    source: appliedOverrides.length > 0 ? 'override' : base.source,
    appliedOverrides,
    base,
  };
};

export const resolveDcaRanges = (formData: BotFormData): DcaDerivedRanges => ({
  tpPerc: resolveTakeProfitRange(formData),
  ordersCount: resolveOrdersCountRange(formData),
  step: resolveStepRange(formData),
  stepScale: resolveScaleRange(
    formData,
    'stepScale',
    MIN_DCA_STEP_SCALE,
    MAX_DCA_STEP_SCALE
  ),
  volumeScale: resolveScaleRange(
    formData,
    'volumeScale',
    MIN_DCA_VOLUME_SCALE,
    MAX_DCA_VOLUME_SCALE
  ),
  smartOrders: resolveSmartOrdersRangeBounds(formData),
});
