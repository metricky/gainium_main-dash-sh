import {
  DONCHIAN_BAND_VALUES,
  INDICATOR_CATALOG,
  MARKET_STRUCTURE_TYPE_VALUES,
  MARKET_STRUCTURE_VALUE_GROUPS,
} from './indicatorCatalog';
import {
  IndicatorCategories,
  type IndicatorCategory,
  type IndicatorDefinition,
  type IndicatorFieldDefinition,
} from './indicatorTypes';
import type {
  IndicatorParamPrimitive,
  IndicatorParamsState,
} from './indicatorParams';
import {
  DCValueEnum,
  ExchangeIntervals,
  IndicatorAction,
  IndicatorEnum,
  IndicatorSection,
  IndicatorStartConditionEnum,
  ppValueEnum,
  ppValueTypeEnum,
  type SettingsIndicators,
} from '..';

const collectFields = (
  definition: IndicatorDefinition
): IndicatorFieldDefinition[] => [
  ...definition.fields,
  ...(definition.advancedFields ?? []),
];

const getFallbackDefault = (field: IndicatorFieldDefinition) => {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  if (field.type === 'boolean') {
    return false;
  }
  if (field.type === 'select' && field.options?.length) {
    return field.options[0]?.value;
  }
  return undefined;
};

export const getIndicatorDefinition = (
  type: IndicatorEnum
): IndicatorDefinition => {
  const definition = INDICATOR_CATALOG[type];
  if (!definition) {
    throw new Error(`Indicator definition for ${type} is not registered.`);
  }
  return definition;
};

export const listIndicatorsByCategory = (
  category?: IndicatorCategory
): IndicatorDefinition[] =>
  Object.values(INDICATOR_CATALOG).filter((indicator) =>
    category ? indicator.category === category : true
  );

export const listIndicatorsForAction = (
  action: IndicatorAction
): IndicatorDefinition[] =>
  Object.values(INDICATOR_CATALOG).filter((indicator) =>
    indicator.supportedActions.includes(action)
  );

export const listPendingIndicators = (): IndicatorDefinition[] =>
  Object.values(INDICATOR_CATALOG).filter((indicator) => indicator.pendingPort);

export const groupIndicatorsByCategory = (): Record<
  IndicatorCategory,
  IndicatorDefinition[]
> => {
  const categories = Object.values(IndicatorCategories) as IndicatorCategory[];
  return categories.reduce<Record<IndicatorCategory, IndicatorDefinition[]>>(
    (acc, category) => {
      acc[category] = listIndicatorsByCategory(category);
      return acc;
    },
    {} as Record<IndicatorCategory, IndicatorDefinition[]>
  );
};

export const indicatorSupportsAction = (
  type: IndicatorEnum,
  action: IndicatorAction
): boolean => getIndicatorDefinition(type).supportedActions.includes(action);

export const getIndicatorDocumentationUrl = (
  type: IndicatorEnum
): string | undefined => getIndicatorDefinition(type).documentationUrl;

export const getIndicatorDefaultParams = (
  type: IndicatorEnum,
  action: IndicatorAction,
  section?: IndicatorSection | undefined
): IndicatorParamsState => {
  const definition = getIndicatorDefinition(type);
  return collectFields(definition).reduce<IndicatorParamsState>(
    (acc, field) => {
      const value = getFallbackDefault(field);
      if (value !== undefined) {
        (acc as Record<string, NonNullable<IndicatorParamPrimitive>>)[
          field.key
        ] = value as NonNullable<IndicatorParamPrimitive>;
      }
      return acc;
    },
    {
      type,
      indicatorAction: action,
      section,
      indicatorLength: 14,
      indicatorValue: '70',
      indicatorCondition: IndicatorStartConditionEnum.cu,
      indicatorInterval: ExchangeIntervals.oneH,
      groupId: '',
      uuid: '',
    } as IndicatorParamsState
  );
};

export const validateIndicatorParams = (
  type: IndicatorEnum,
  params: Record<string, unknown>
): string[] => {
  const definition = getIndicatorDefinition(type);
  const missing: string[] = [];

  collectFields(definition).forEach((field) => {
    if (!field.required) {
      return;
    }
    const value = params[field.key];
    if (value === undefined || value === null || value === '') {
      missing.push(field.key);
    }
  });
  const errors = [...missing];

  const getParam = <Value = unknown>(
    key: keyof SettingsIndicators
  ): Value | undefined => params[key] as Value | undefined;

  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim().length) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    }
    return Number.NaN;
  };

  switch (type) {
    case IndicatorEnum.pp: {
      const ppType = getParam<ppValueTypeEnum>('ppType');
      const ppValue = getParam<ppValueEnum>('ppValue');

      if (!ppType || !MARKET_STRUCTURE_TYPE_VALUES.has(ppType)) {
        errors.push('ppType');
        break;
      }

      const valueSet =
        ppType === 'Price Based'
          ? MARKET_STRUCTURE_VALUE_GROUPS.price
          : ppType === 'Event Based'
            ? MARKET_STRUCTURE_VALUE_GROUPS.event
            : MARKET_STRUCTURE_VALUE_GROUPS.market;

      if (!ppValue || !valueSet.has(ppValue)) {
        errors.push('ppValue');
      }

      if (ppType === 'Price Based') {
        const ensureNonNegativeInteger = (
          fieldKey: keyof SettingsIndicators
        ) => {
          const numeric = toNumber(getParam(fieldKey));
          if (!Number.isFinite(numeric) || numeric < 0) {
            errors.push(fieldKey);
          }
        };

        (
          [
            'ppHighLeft',
            'ppHighRight',
            'ppLowLeft',
            'ppLowRight',
          ] as (keyof SettingsIndicators)[]
        ).forEach(ensureNonNegativeInteger);

        const multiplier = toNumber(getParam('ppMult'));
        if (!Number.isFinite(multiplier) || multiplier < 0) {
          errors.push('ppMult');
        }
      }
      break;
    }
    case IndicatorEnum.ath: {
      const threshold = toNumber(getParam('indicatorValue'));
      if (!Number.isFinite(threshold) || threshold < 0) {
        errors.push('value');
      }

      const lookback = toNumber(getParam('athLookback'));
      if (!Number.isFinite(lookback) || lookback < 1) {
        errors.push('athLookback');
      }
      break;
    }
    case IndicatorEnum.dc: {
      const dcValue = getParam<DCValueEnum>('dcValue');
      if (!dcValue || !DONCHIAN_BAND_VALUES.has(dcValue)) {
        errors.push('dcValue');
      }
      break;
    }
    default:
      break;
  }

  return Array.from(new Set(errors));
};

export const resolveIndicatorActionScope = (
  action: IndicatorAction
): IndicatorDefinition[] => {
  switch (action) {
    case IndicatorAction.startDeal:
      return listIndicatorsForAction(IndicatorAction.startDeal);
    case IndicatorAction.startDca: {
      const startDcaIndicators = listIndicatorsForAction(
        IndicatorAction.startDca
      );
      if (startDcaIndicators.length > 0) {
        return startDcaIndicators;
      }
      return listIndicatorsForAction(IndicatorAction.startDeal);
    }
    case IndicatorAction.closeDeal:
      return listIndicatorsForAction(IndicatorAction.closeDeal);
    case IndicatorAction.riskReward:
      return listIndicatorsForAction(IndicatorAction.riskReward);
    case IndicatorAction.stopBot:
      return listIndicatorsForAction(IndicatorAction.stopBot);
    case IndicatorAction.startBot:
      return listIndicatorsForAction(IndicatorAction.startBot);
    default:
      return [];
  }
};
