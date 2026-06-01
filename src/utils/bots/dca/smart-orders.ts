import { MAX_DCA_ORDERS, MIN_DCA_ORDERS, type DCABotSettings } from '@/types';

export type SmartOrdersLimitSource =
  | 'ordersCount'
  | 'customOrders'
  | 'maxDealsPerPair'
  | 'maxNumberOfOpenDeals';

export interface SmartOrdersRangeResult {
  min: number;
  max: number;
  ordersCeiling: number;
  planCeiling: number;
  limitSource: SmartOrdersLimitSource | null;
}

const sanitizePositiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = Math.trunc(value);
    return normalized > 0 ? normalized : fallback;
  }

  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed > 0 ? parsed : fallback;
};

const sanitizeNonNegativeInteger = (
  value: unknown,
  fallback: number
): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = Math.trunc(value);
    return normalized >= 0 ? normalized : fallback;
  }

  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed >= 0 ? parsed : fallback;
};

export const deriveSmartOrdersRange = (
  formData: Pick<
    DCABotSettings,
    | 'ordersCount'
    | 'dcaCondition'
    | 'dcaCustom'
    | 'useMulti'
    | 'maxDealsPerPair'
    | 'maxNumberOfOpenDeals'
  >
): SmartOrdersRangeResult => {
  const ordersCount = sanitizePositiveInteger(
    formData.ordersCount,
    MIN_DCA_ORDERS
  );

  const customOrdersCount =
    formData.dcaCondition === 'custom'
      ? sanitizeNonNegativeInteger(formData.dcaCustom?.length ?? 0, 0)
      : null;

  const maxDealsPerPair = sanitizePositiveInteger(formData.maxDealsPerPair, 1);
  const maxNumberOfOpenDeals = sanitizePositiveInteger(
    formData.maxNumberOfOpenDeals,
    1
  );

  const planDenominator = formData.useMulti
    ? maxDealsPerPair
    : maxNumberOfOpenDeals;
  const rawPlanCeiling = Math.floor(MAX_DCA_ORDERS / planDenominator);
  const planCeiling = rawPlanCeiling > 0 ? rawPlanCeiling : MIN_DCA_ORDERS;

  const effectiveCustomCeiling =
    customOrdersCount && customOrdersCount > 0 ? customOrdersCount : undefined;

  const limitCandidates: Array<{
    source: SmartOrdersLimitSource;
    value: number;
  }> = [
    { source: 'ordersCount', value: ordersCount },
    {
      source: formData.useMulti ? 'maxDealsPerPair' : 'maxNumberOfOpenDeals',
      value: planCeiling,
    },
  ];

  if (typeof effectiveCustomCeiling === 'number') {
    limitCandidates.push({
      source: 'customOrders',
      value: effectiveCustomCeiling,
    });
  }

  const minimalLimit = limitCandidates.reduce((acc, candidate) => {
    if (candidate.value < acc) {
      return candidate.value;
    }
    return acc;
  }, Number.POSITIVE_INFINITY);

  const resolvedMax = Math.max(MIN_DCA_ORDERS, Math.trunc(minimalLimit));

  const primaryLimiter =
    limitCandidates.find(
      (candidate) => Math.trunc(candidate.value) === resolvedMax
    )?.source ?? null;

  return {
    min: MIN_DCA_ORDERS,
    max: resolvedMax,
    ordersCeiling: ordersCount,
    planCeiling,
    limitSource: primaryLimiter,
  };
};

export const buildSmartOrdersHelperMessage = (
  range: SmartOrdersRangeResult
): string => {
  const base = `From ${range.min} to ${range.max}`;

  switch (range.limitSource) {
    case 'maxDealsPerPair':
      return `${base} (limited by max deals per pair setting)`;
    case 'maxNumberOfOpenDeals':
      return `${base} (limited by max open deals setting)`;
    case 'customOrders':
      return `${base} (limited by defined custom orders)`;
    case 'ordersCount':
    default:
      return base;
  }
};
