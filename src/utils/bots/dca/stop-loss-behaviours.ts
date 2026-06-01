import { CloseConditionEnum } from '@/types';

const EPSILON = 1e-6;

export const resolveMoveSlTriggerMax = (
  takeProfitPercentage: string | number | null | undefined,
  dealCloseCondition?: CloseConditionEnum | null,
  defaultMax: number = 100
): number => {
  // Only cap trigger at TP% when the deal closes by fixed take-profit.
  // Indicator / dynamic-AR / webhook closes can run beyond tpPerc.
  if (
    dealCloseCondition != null &&
    dealCloseCondition !== CloseConditionEnum.tp
  ) {
    return defaultMax;
  }

  const numeric = Number(takeProfitPercentage);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.max(numeric, 0.1);
  }

  return defaultMax;
};

export const resolveMoveSlValueMax = (
  triggerPercentage: string | number | null | undefined,
  triggerMax: number
): number => {
  const numeric = Number(triggerPercentage);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }

  return triggerMax;
};

export const resolveMinMoveSlTrigger = (minStopLossPercent: number): number => {
  return Math.max(0.1, minStopLossPercent);
};

export const formatMinMoveSlTrigger = (minTrigger: number): string => {
  const formatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: minTrigger >= 1 ? 1 : 2,
    maximumFractionDigits: 3,
  });

  return formatter.format(minTrigger);
};

export interface MoveSlValidationResult {
  trigger?: string;
  value?: string;
}

export interface MoveSlValidationParams {
  moveSlEnabled: boolean;
  trigger: string | number | null | undefined;
  value: string | number | null | undefined;
  tpPerc: string | number | null | undefined;
  dealCloseCondition?: CloseConditionEnum | null;
  minTrigger: number;
  formattedMinTrigger: string;
  epsilon?: number;
}

export const validateMoveSlConfiguration = ({
  moveSlEnabled,
  trigger,
  value,
  tpPerc,
  dealCloseCondition,
  minTrigger,
  formattedMinTrigger,
  epsilon = EPSILON,
}: MoveSlValidationParams): MoveSlValidationResult => {
  if (!moveSlEnabled) {
    return {};
  }

  const triggerNumeric = Number(trigger);
  const valueNumeric = Number(value);
  const tpPercNumeric = Number(tpPerc);

  const errors: MoveSlValidationResult = {};

  if (!Number.isFinite(triggerNumeric) || triggerNumeric < minTrigger) {
    errors.trigger = `Trigger % must be at least ${formattedMinTrigger}.`;
  } else if (
    // Only enforce the TP cap when the deal closes by fixed take-profit.
    // Indicator / dynamic-AR / webhook closes can run beyond tpPerc.
    (dealCloseCondition == null ||
      dealCloseCondition === CloseConditionEnum.tp) &&
    Number.isFinite(tpPercNumeric) &&
    tpPercNumeric > 0 &&
    triggerNumeric - tpPercNumeric > epsilon
  ) {
    errors.trigger = "Trigger % can't exceed the take profit %.";
  }

  if (!Number.isFinite(valueNumeric) || valueNumeric < 0) {
    errors.value = "Move to % must be zero or positive.";
  } else if (
    Number.isFinite(triggerNumeric) &&
    triggerNumeric > 0 &&
    valueNumeric >= triggerNumeric - epsilon
  ) {
    errors.value = "Move to % must be less than the trigger %.";
  }

  return errors;
};
