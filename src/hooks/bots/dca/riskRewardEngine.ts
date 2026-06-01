import type { PairPrecisionInfo } from '@/types/bots/form';
import type { DcaTradingContext } from './useDcaTradingContext';
import {
  RiskSlTypeEnum,
  RRSlTypeEnum,
  StrategyEnum,
  type BotMarginTypeEnum,
} from '@/types';

const EPSILON = 1e-8;

export const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const roundTo = (value: number, decimals: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalizedDecimals =
    Number.isFinite(decimals) && decimals >= 0 ? decimals : 0;
  const factor = 10 ** Math.min(normalizedDecimals, 12);
  return Math.round(value * factor) / factor;
};

const inferDecimalsFromStep = (step?: number): number | undefined => {
  if (!step || !Number.isFinite(step) || step <= 0) {
    return undefined;
  }

  const asString = step.toString();
  if (asString.includes('e-')) {
    const [, exponent] = asString.split('e-');
    const parsed = Number(exponent);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const decimals = asString.split('.')[1]?.length ?? 0;
  return decimals > 0 ? decimals : undefined;
};

type AggregatedBalances = DcaTradingContext['aggregatedBalances'];

const extractBalance = (
  snapshot: AggregatedBalances[keyof AggregatedBalances] | undefined
): number => {
  if (!snapshot) {
    return 0;
  }

  const free = parseNumeric(snapshot.free);
  if (typeof free === 'number' && Number.isFinite(free)) {
    return Math.max(0, free);
  }

  const total = parseNumeric(snapshot.total);
  if (typeof total === 'number' && Number.isFinite(total)) {
    return Math.max(0, total);
  }

  return 0;
};

export interface RiskRewardCalculations {
  positionSize: number;
  positionValue: number;
  availableBalance: number;
  balanceAfterOrder: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  entryPrice: number | null;
  riskAmount: number;
  rewardAmount: number;
  riskPercentage: number;
  rewardPercentage: number;
  riskRewardRatio: number;
  hasValidData: boolean;
  hasInsufficientBalance: boolean;
  validationErrors: string[];
  riskError: boolean;
  riskErrorText: string | null;
}

export interface RuntimeInputs {
  stopLossPrice?: number | undefined;
  atrValue?: number | undefined;
  atrMultiplier?: number | undefined;
  useAtrForSl?: boolean | undefined;
}

export interface RiskRewardEngineInput {
  terminal: boolean;
  latestPrice?: number | undefined;
  baseAsset?: string | undefined;
  quoteAsset?: string | undefined;
  aggregatedBalances?: AggregatedBalances;
  precisionInfo?: PairPrecisionInfo | undefined;
  strategy: StrategyEnum;
  futures: boolean;
  coinm: boolean;
  leverageInput: number;
  marginType: BotMarginTypeEnum;
  riskSlType?: RiskSlTypeEnum | undefined;
  riskSlAmountPerc?: string | undefined;
  riskSlAmountValue?: string | undefined;
  riskTpRatio?: string | undefined;
  riskUseTpRatio?: boolean | undefined;
  riskMinSl?: string | undefined;
  riskMaxSl?: string | undefined;
  riskMinPositionSize?: string | undefined;
  riskMaxPositionSize?: string | undefined;
  useRiskReward?: boolean | undefined;
  indicatorMeta: {
    usesAtr: boolean;
    atrMultiplier?: number | undefined;
  };
  runtime: RuntimeInputs;
  effectiveOptions: {
    atrMultiplier?: number;
    atrValue?: number;
    useAtrForSl?: boolean;
  };
  rrSlType: RRSlTypeEnum;
  rrSlFixedValue: string;
}

export const calculateRiskReward = (
  input: RiskRewardEngineInput
): RiskRewardCalculations => {
  const {
    terminal,
    latestPrice,
    baseAsset,
    quoteAsset,
    aggregatedBalances,
    precisionInfo,
    strategy,
    futures,
    coinm,
    leverageInput,
    marginType,
    riskSlType,
    riskSlAmountPerc,
    riskSlAmountValue,
    riskTpRatio,
    riskUseTpRatio,
    riskMinSl,
    riskMaxSl,
    riskMinPositionSize,
    riskMaxPositionSize,
    useRiskReward,
    indicatorMeta,
    runtime,
    effectiveOptions,
    rrSlFixedValue,
    rrSlType,
  } = input;

  const aggregated = aggregatedBalances ?? {
    base: { free: 0, total: 0, usd: 0 },
    quote: { free: 0, total: 0, usd: 0 },
  };

  const isLong = strategy === StrategyEnum.long;
  const riskAssetKey = futures
    ? coinm
      ? 'base'
      : 'quote'
    : isLong
      ? 'quote'
      : 'base';
  const riskSnapshot = aggregated?.[riskAssetKey] ?? {
    free: 0,
    total: 0,
    usd: 0,
  };
  const riskBalance = extractBalance(riskSnapshot);

  const defaultCalcs: RiskRewardCalculations = {
    positionSize: 0,
    positionValue: 0,
    availableBalance: riskBalance,
    balanceAfterOrder: riskBalance,
    stopLossPrice: null,
    takeProfitPrice: null,
    entryPrice: latestPrice ?? null,
    riskAmount: 0,
    rewardAmount: 0,
    riskPercentage: 0,
    rewardPercentage: 0,
    riskRewardRatio: 0,
    hasValidData: false,
    hasInsufficientBalance: false,
    validationErrors: [],
    riskError: false,
    riskErrorText: null,
  };

  const validationErrors: string[] = [];

  if (!useRiskReward) {
    return defaultCalcs;
  }

  if (!latestPrice || latestPrice <= 0) {
    validationErrors.push('No latest price');
    return {
      ...defaultCalcs,
      validationErrors,
      riskError: true,
      riskErrorText: validationErrors[0] ?? 'No latest price',
    };
  }

  if (!baseAsset || !quoteAsset) {
    validationErrors.push('Trading pair not properly configured');
    return {
      ...defaultCalcs,
      validationErrors,
      riskError: true,
      riskErrorText:
        validationErrors[0] ?? 'Trading pair not properly configured',
    };
  }

  if (riskBalance <= 0) {
    validationErrors.push('No available balance');
  }

  const pricePrecision = Math.max(0, precisionInfo?.pricePrecision ?? 8);
  const baseDecimals = inferDecimalsFromStep(precisionInfo?.baseStep) ?? 8;
  const quoteDecimals = pricePrecision;
  const riskPrecision = futures
    ? coinm
      ? baseDecimals
      : quoteDecimals
    : isLong
      ? quoteDecimals
      : baseDecimals;

  const sliderPerc = Math.max(0, parseNumeric(riskSlAmountPerc) ?? 0);
  const fixedRiskInput = Math.abs(parseNumeric(riskSlAmountValue) ?? 0);
  const rewardRatio = Math.max(0, parseNumeric(riskTpRatio) ?? 0);

  const normalizedRiskType = riskSlType || RiskSlTypeEnum.fixed;
  const percentRiskAmount = (sliderPerc / 100) * riskBalance;
  const fixedRiskRounded = roundTo(fixedRiskInput, riskPrecision + 2);
  const riskAmount =
    normalizedRiskType === RiskSlTypeEnum.perc
      ? roundTo(percentRiskAmount, riskPrecision + 2)
      : fixedRiskRounded;

  if (riskAmount <= 0) {
    validationErrors.push('Risk size is 0');
  }

  if (
    normalizedRiskType !== RiskSlTypeEnum.perc &&
    riskAmount > riskBalance + EPSILON
  ) {
    validationErrors.push('Fixed risk amount exceeds available balance');
  }

  const runtimeStopLossPrice =
    typeof runtime.stopLossPrice === 'number' &&
    Number.isFinite(runtime.stopLossPrice)
      ? runtime.stopLossPrice
      : undefined;
  const runtimeAtrValue =
    typeof runtime.atrValue === 'number' && runtime.atrValue > 0
      ? runtime.atrValue
      : undefined;
  const runtimeAtrMultiplier =
    typeof runtime.atrMultiplier === 'number' && runtime.atrMultiplier > 0
      ? runtime.atrMultiplier
      : undefined;
  const runtimeUseAtr =
    typeof runtime.useAtrForSl === 'boolean' ? runtime.useAtrForSl : undefined;

  const atrRequested =
    (runtimeUseAtr ?? effectiveOptions.useAtrForSl ?? false) ||
    indicatorMeta.usesAtr;
  const mergedAtrValue = runtimeAtrValue ?? effectiveOptions.atrValue;
  const mergedAtrMultiplier =
    runtimeAtrMultiplier ?? effectiveOptions.atrMultiplier ?? 1;

  let clampedDistanceDecimal: number | undefined;

  if (runtimeStopLossPrice && latestPrice > 0) {
    const delta = runtimeStopLossPrice - latestPrice;
    const distanceDecimal = Math.abs(delta / latestPrice);
    if (distanceDecimal > 0 && Number.isFinite(distanceDecimal)) {
      clampedDistanceDecimal = distanceDecimal;
    } else {
      validationErrors.push('Indicator-provided stop-loss price is invalid');
    }
  }

  if (!clampedDistanceDecimal && atrRequested) {
    if (
      typeof mergedAtrValue === 'number' &&
      mergedAtrValue > 0 &&
      mergedAtrMultiplier > 0
    ) {
      const atrDistance = mergedAtrValue * mergedAtrMultiplier;
      const atrDecimal = atrDistance / latestPrice;
      if (atrDecimal > 0 && Number.isFinite(atrDecimal)) {
        clampedDistanceDecimal = atrDecimal;
      } else {
        validationErrors.push(
          'ATR indicator produced invalid stop-loss distance'
        );
      }
    } else {
      validationErrors.push(
        'ATR indicator selected but no ATR value provided.'
      );
    }
  }

  if (!clampedDistanceDecimal && rrSlType === RRSlTypeEnum.fixed) {
    const fixedSlPerc = Math.abs(parseNumeric(rrSlFixedValue) ?? 0);
    if (fixedSlPerc > 0) {
      const fixedDecimal = fixedSlPerc / 100;
      if (fixedDecimal > 0 && Number.isFinite(fixedDecimal)) {
        clampedDistanceDecimal = fixedDecimal;
      } else {
        validationErrors.push('Fixed RR SL percentage is invalid');
      }
    } else {
      validationErrors.push('Fixed RR SL percentage is not set');
    }
  }

  if (!clampedDistanceDecimal || clampedDistanceDecimal <= 0) {
    validationErrors.push(
      'Stop-loss price must be provided by indicator or ATR'
    );
    return {
      ...defaultCalcs,
      validationErrors,
      availableBalance: riskBalance,
      riskError: true,
      riskErrorText:
        validationErrors[0] ??
        'Stop-loss price must be provided by indicator or ATR',
    };
  }

  const minSlLimitDecimal = (() => {
    if (terminal) {
      return undefined;
    }
    const parsed = parseNumeric(riskMinSl);
    if (parsed === undefined || parsed === null) {
      if (normalizedRiskType === RiskSlTypeEnum.perc && sliderPerc > 0) {
        return Math.abs(sliderPerc) / 100;
      }
      return undefined;
    }
    const normalized = Math.abs(parsed);
    return normalized === 0 ? undefined : normalized / 100;
  })();

  const maxSlLimitDecimal = (() => {
    if (terminal) {
      return undefined;
    }
    const parsed = parseNumeric(riskMaxSl);
    if (parsed === undefined || parsed === null) {
      return 1;
    }
    const normalized = Math.abs(parsed);
    return normalized === 0 ? undefined : normalized / 100;
  })();

  if (typeof minSlLimitDecimal === 'number') {
    clampedDistanceDecimal = Math.max(
      clampedDistanceDecimal,
      minSlLimitDecimal
    );
  }
  if (typeof maxSlLimitDecimal === 'number') {
    clampedDistanceDecimal = Math.min(
      clampedDistanceDecimal,
      maxSlLimitDecimal
    );
  }

  if (!Number.isFinite(clampedDistanceDecimal) || clampedDistanceDecimal <= 0) {
    validationErrors.push(
      isLong
        ? 'SL price higher than current price'
        : 'SL price lower than current price'
    );
    return {
      ...defaultCalcs,
      validationErrors,
      availableBalance: riskBalance,
      riskError: true,
      riskErrorText:
        validationErrors[0] ??
        (isLong
          ? 'SL price higher than current price'
          : 'SL price lower than current price'),
    };
  }

  const stopLossPriceRaw = (() => {
    const directionMultiplier = isLong ? -1 : 1;
    const candidate =
      latestPrice * (1 + directionMultiplier * clampedDistanceDecimal);
    return Number.isFinite(candidate) && candidate > 0 ? candidate : undefined;
  })();

  if (!stopLossPriceRaw) {
    validationErrors.push('Calculated stop-loss price is invalid');
    return {
      ...defaultCalcs,
      validationErrors,
      availableBalance: riskBalance,
      riskError: true,
      riskErrorText:
        validationErrors[0] ?? 'Calculated stop-loss price is invalid',
    };
  }

  // Signed risk percentage: negative for long positions (SL below entry), positive for short (SL above entry)
  const unsignedRiskPercentage = roundTo(
    clampedDistanceDecimal * 100,
    pricePrecision
  );
  const riskPercentage = isLong
    ? -unsignedRiskPercentage
    : unsignedRiskPercentage;
  const riskPercDecimal = clampedDistanceDecimal;
  const rawExposure = riskPercDecimal > 0 ? riskAmount / riskPercDecimal : 0;
  const leverageFactor = (() => {
    if (!futures) {
      return 1;
    }
    const numeric = Number(leverageInput);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return 1;
    }
    if (marginType === 'cross') {
      return 1;
    }
    return numeric;
  })();

  const marginRequired =
    leverageFactor > 0 ? rawExposure / leverageFactor : rawExposure;
  const positionSize = roundTo(marginRequired, Math.max(0, riskPrecision));
  const positionValue = (() => {
    if (!Number.isFinite(rawExposure) || rawExposure <= 0) {
      return 0;
    }
    if (riskAssetKey === 'quote') {
      return roundTo(rawExposure, pricePrecision + 2);
    }
    return roundTo(rawExposure * latestPrice, pricePrecision + 2);
  })();

  if (!Number.isFinite(positionSize) || positionSize <= 0) {
    validationErrors.push('Position size is 0');
  }

  if (positionSize > riskBalance + EPSILON) {
    validationErrors.push('Position size more than account free balance');
  }

  const balanceAfterOrder = roundTo(
    Math.max(0, riskBalance - positionSize),
    riskPrecision + 2
  );
  const stopLossPrice = roundTo(stopLossPriceRaw, pricePrecision);

  const tpMeta = (() => {
    if (!riskUseTpRatio || rewardRatio <= 0 || riskAmount <= 0) {
      return {
        rewardAmount: 0,
        rewardPercentage: 0,
        riskRewardRatio: 0,
        takeProfitPrice: null as number | null,
      };
    }

    const rewardAmountCalc = roundTo(
      riskAmount * rewardRatio,
      riskPrecision + 2
    );
    const rewardPercentage = roundTo(
      // Use unsigned percentage for reward calculation (distance only)
      unsignedRiskPercentage * rewardRatio,
      pricePrecision + 2
    );
    const signedRewardPerc = isLong ? rewardPercentage : -rewardPercentage;
    const tpCandidate = latestPrice * (1 + signedRewardPerc / 100);
    const takeProfitPrice =
      Number.isFinite(tpCandidate) && tpCandidate > 0
        ? roundTo(tpCandidate, pricePrecision)
        : null;

    if (!takeProfitPrice) {
      validationErrors.push('Calculated take-profit price is invalid');
    }

    return {
      rewardAmount: rewardAmountCalc,
      rewardPercentage,
      riskRewardRatio: rewardRatio,
      takeProfitPrice,
    };
  })();

  if (riskUseTpRatio && rewardRatio <= 0) {
    validationErrors.push('TP Ratio is not set');
  }

  const minPositionSizeParsed = parseNumeric(riskMinPositionSize);
  if (
    typeof minPositionSizeParsed === 'number' &&
    minPositionSizeParsed > 0 &&
    positionSize < minPositionSizeParsed
  ) {
    validationErrors.push(
      `Position size ${positionSize.toFixed(4)} is below minimum ${minPositionSizeParsed.toFixed(4)}`
    );
  }

  const maxPositionSizeParsed = parseNumeric(riskMaxPositionSize);
  if (
    typeof maxPositionSizeParsed === 'number' &&
    maxPositionSizeParsed > 0 &&
    positionSize > maxPositionSizeParsed
  ) {
    validationErrors.push(
      `Position size ${positionSize.toFixed(4)} exceeds maximum ${maxPositionSizeParsed.toFixed(4)}`
    );
  }

  const hasInsufficientBalance = positionSize > riskBalance + EPSILON;
  const hasValidData = validationErrors.length === 0;
  const riskError = validationErrors.length > 0;
  const riskErrorText = riskError
    ? (validationErrors[0] ?? 'Unknown validation error')
    : null;

  return {
    positionSize,
    positionValue,
    availableBalance: riskBalance,
    balanceAfterOrder,
    stopLossPrice,
    takeProfitPrice: tpMeta.takeProfitPrice,
    entryPrice: latestPrice,
    riskAmount,
    rewardAmount: tpMeta.rewardAmount,
    riskPercentage,
    rewardPercentage: tpMeta.rewardPercentage,
    riskRewardRatio: tpMeta.riskRewardRatio,
    hasValidData,
    hasInsufficientBalance,
    validationErrors,
    riskError,
    riskErrorText,
  };
};
