import type { BotFormData } from '@/types/bots/form';
import type { IndicatorConfig, IndicatorGroup } from '@/types/indicators';
import { CloseConditionEnum, StartConditionEnum, StrategyEnum } from '@/types';
type GroupLogicValue = IndicatorGroup['logic'];

type CreateGroupIdFn = () => string;

type MaybeIndicatorGroup = IndicatorGroup | null | undefined;

export const generateStartGroupId: CreateGroupIdFn = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `start-group-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export interface StartIndicatorCollectionsInput {
  groups?: MaybeIndicatorGroup[] | null;
  indicatorLogic?: GroupLogicValue;
  createGroupId?: CreateGroupIdFn;
}

export interface StartIndicatorCollectionsResult {
  groups: IndicatorGroup[];
}

export const collectStartIndicatorIntervals = (
  startCondition: BotFormData['dca']['startCondition'],
  indicators: IndicatorConfig[]
) => {
  const intervals = new Set<string>();

  if (startCondition !== StartConditionEnum.ti) {
    return intervals;
  }

  for (const indicator of indicators) {
    intervals.add(indicator.indicatorInterval);
  }

  return intervals;
};

export const shouldDisplayHigherTimeframeLimiter = (
  startCondition: BotFormData['dca']['startCondition'],
  intervals: Set<string>
) => startCondition === StartConditionEnum.ti && intervals.size > 1;

export const deriveStartIndicatorAlerts = (input: {
  startCondition: BotFormData['dca']['startCondition'];
  totalIndicators: number;
}) => {
  const { startCondition, totalIndicators } = input;
  const isTi = startCondition === StartConditionEnum.ti;

  return {
    shouldShowEmptyStartIndicatorAlert: isTi && totalIndicators === 0,
    shouldShowDisabledStartIndicatorAlert: isTi && totalIndicators > 0,
  };
};

export interface DealStartWebhookAvailabilityInput {
  startCondition: BotFormData['dca']['startCondition'];
  strategy?: BotFormData['dca']['strategy'];
  useMulti?: boolean;
  useTp?: boolean;
  useSl?: boolean;
  dealCloseCondition?: BotFormData['dca']['dealCloseCondition'];
  dealCloseConditionSL?: BotFormData['dca']['dealCloseConditionSL'];
  primarySymbol: string;
  symbolExamples: string[];
}

export const resolveDealStartWebhookAvailability = (
  input: DealStartWebhookAvailabilityInput
) => {
  const {
    startCondition,
    strategy,
    useMulti,
    useTp,
    useSl,
    dealCloseCondition,
    dealCloseConditionSL,
    primarySymbol,
    symbolExamples,
  } = input;

  const normalizedDirection: BotFormData['dca']['strategy'] =
    strategy === StrategyEnum.short ? StrategyEnum.short : StrategyEnum.long;
  const multi = Boolean(useMulti);
  const closeCondition = normalizeCloseCondition(dealCloseCondition);
  const slCondition = normalizeCloseCondition(dealCloseConditionSL);

  const baseFundsEnabled = !multi || normalizedDirection === StrategyEnum.short;
  const quoteFundsEnabled = !multi || normalizedDirection === StrategyEnum.long;

  const scopedExamples =
    symbolExamples.length > 0 ? symbolExamples : [primarySymbol];

  return {
    multi,
    openDeal: startCondition === StartConditionEnum.tradingviewSignals,
    closeDeal: Boolean(useTp) && closeCondition === CloseConditionEnum.webhook,
    closeDealSl: Boolean(useSl) && slCondition === CloseConditionEnum.webhook,
    addBase: baseFundsEnabled,
    addQuote: quoteFundsEnabled,
    reduceBase: baseFundsEnabled,
    reduceQuote: quoteFundsEnabled,
    changePairs: multi,
    primarySymbol,
    symbolExamples: scopedExamples,
  } as const;
};

const normalizeCloseCondition = (
  value?: BotFormData['dca']['dealCloseCondition'] | string | null
): CloseConditionEnum => {
  if (!value) {
    return CloseConditionEnum.tp;
  }

  if (value === 'percentage') {
    return CloseConditionEnum.tp;
  }

  const allowed = Object.values(CloseConditionEnum) as string[];
  if (allowed.includes(value)) {
    return value as CloseConditionEnum;
  }

  return CloseConditionEnum.tp;
};
