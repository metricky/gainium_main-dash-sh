import type { DcaTradingContext } from '@/hooks/bots/dca/useDcaTradingContext';
import { BotTypesEnum, DCAConditionEnum, type DCACustom } from '@/types';
import type { BotFormData } from '@/types/bots/form';
import { resolveBaseOrderContext } from './base-order-context';
import { deriveSmartOrdersRange } from './smart-orders';

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toPositiveInteger = (value: unknown, fallback = 0): number => {
  const numeric = Math.trunc(toNumber(value, fallback));
  return numeric > 0 ? numeric : fallback;
};

const toNonNegativeInteger = (value: unknown, fallback = 0): number => {
  const numeric = Math.trunc(toNumber(value, fallback));
  return numeric >= 0 ? numeric : fallback;
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

const EPSILON = 1e-9;

export interface CapitalSummaryResult {
  ordersCount: number;
  maxDeals: number;
  volumeScale: number;
  orderSize: number;
  /** Start (base) order size, in the order-size currency. */
  baseOrderSize: number;
  totalPerDeal: number;
  totalPerBot: number;
  costPerDeal: number;
  costPerBot: number;
  plannedDeviation: number;
  percentageMode: boolean;
  leverage: number;
  smartOrders: {
    enabled: boolean;
    activeCount: number;
  };
  requiredNowNotional: number;
  requiredNowCost: number;
  currencyLabel: string;
  availableBalance: number;
  overspend: boolean;
  missingCapital: number;
  slackPercentage: number | null;
}

interface CapitalSummaryInput {
  formData: BotFormData;
  tradingContext: DcaTradingContext;
}

const buildPerOrderSeries = (
  baseOrderSize: number,
  ratio: number,
  orders: number
): number[] => {
  if (!Number.isFinite(baseOrderSize) || baseOrderSize <= 0 || orders <= 0) {
    return [];
  }

  if (!Number.isFinite(ratio) || ratio <= 0) {
    ratio = 1;
  }

  const series: number[] = new Array(Math.max(0, orders));
  let current = baseOrderSize;
  for (let index = 0; index < series.length; index += 1) {
    series[index] = current;
    current *= ratio;
  }
  return series;
};

export const computePlannedDeviation = (
  ordersCount: number,
  baseStep: number,
  stepScale: number
): number => {
  if (!Number.isFinite(baseStep) || baseStep <= 0 || ordersCount <= 0) {
    return 0;
  }

  if (!Number.isFinite(stepScale) || stepScale <= 0) {
    stepScale = 1;
  }

  let cumulative = 0;
  let stepValue = baseStep;

  for (let index = 0; index < ordersCount; index += 1) {
    cumulative += stepValue;
    stepValue *= stepScale;
  }

  return cumulative;
};

export const deriveCapitalSummary = ({
  formData,
  tradingContext,
}: CapitalSummaryInput): CapitalSummaryResult => {
  const isComboBot = formData.type === BotTypesEnum.combo;
  const dcaCondition = isComboBot
    ? formData.combo.dcaCondition
    : formData.dca.dcaCondition;
  const dcaCustom = isComboBot
    ? formData.combo.dcaCustom
    : formData.dca.dcaCustom;
  const _ordersCount = isComboBot
    ? formData.combo.ordersCount
    : formData.dca.ordersCount;
  const maxNumberOfOpenDeals = isComboBot
    ? formData.combo.maxNumberOfOpenDeals
    : formData.dca.maxNumberOfOpenDeals;
  const maxDealsPerPair = isComboBot
    ? formData.combo.maxDealsPerPair
    : formData.dca.maxDealsPerPair;
  const _orderSize = isComboBot
    ? formData.combo.orderSize
    : formData.dca.orderSize;
  const orderSizeType = isComboBot
    ? formData.combo.orderSizeType
    : formData.dca.orderSizeType;
  const _baseOrderSize = isComboBot
    ? formData.combo.baseOrderSize
    : formData.dca.baseOrderSize;
  const _volumeScale = isComboBot
    ? formData.combo.volumeScale
    : formData.dca.volumeScale;
  const step = isComboBot ? formData.combo.step : formData.dca.step;
  const stepScale = isComboBot
    ? formData.combo.stepScale
    : formData.dca.stepScale;
  const _leverage = isComboBot
    ? formData.combo.leverage
    : formData.dca.leverage;
  const futures = isComboBot ? formData.combo.futures : formData.dca.futures;
  const coinm = isComboBot ? formData.combo.coinm : formData.dca.coinm;
  const useSmartOrders = isComboBot
    ? formData.combo.useSmartOrders
    : formData.dca.useSmartOrders;
  const _activeOrdersCount = isComboBot
    ? formData.combo.activeOrdersCount
    : formData.dca.activeOrdersCount;
  const useMulti = isComboBot ? formData.combo.useMulti : formData.dca.useMulti;
  const useDca = isComboBot ? formData.combo.useDca : formData.dca.useDca;
  const strategy = isComboBot ? formData.combo.strategy : formData.dca.strategy;
  const isCustomDca = dcaCondition === DCAConditionEnum.custom;
  const customOrders = Array.isArray(dcaCustom)
    ? (dcaCustom as DCACustom[])
    : [];

  let ordersCount = toPositiveInteger(_ordersCount, 0);
  const maxDeals = Math.max(1, toPositiveInteger(maxNumberOfOpenDeals, 1));
  const orderSize = Math.max(0, toNumber(_orderSize, 0));
  const volumeScaleRaw = toNumber(_volumeScale, 1);
  const volumeScale = volumeScaleRaw > 0 ? volumeScaleRaw : 1;
  const leverageRaw = toNumber(_leverage, 1);
  const leverage = futures ? Math.max(1, leverageRaw) : 1;

  let perOrderSeries: number[];
  let plannedDeviation: number;
  let percentageMode =
    orderSizeType === 'percFree' || orderSizeType === 'percTotal';

  if (!useDca) {
    // DCA averaging is turned off — the bot fires only the base order, so no
    // safety/DCA orders should be counted toward per-deal or per-bot capital.
    perOrderSeries = [];
    plannedDeviation = 0;
    ordersCount = 0;
  } else if (isCustomDca && customOrders.length > 0) {
    perOrderSeries = customOrders.map((order) =>
      Math.max(0, toNumber(order.size, 0))
    );
    plannedDeviation = customOrders.reduce(
      (acc, order) => acc + Math.max(0, toNumber(order.step, 0)),
      0
    );
    ordersCount = perOrderSeries.length;
    percentageMode = false;
  } else {
    perOrderSeries = buildPerOrderSeries(orderSize, volumeScale, ordersCount);
    plannedDeviation = computePlannedDeviation(
      ordersCount,
      toNumber(step, 0),
      toNumber(stepScale, 1)
    );
  }

  const baseOrderSize = toNumber(_baseOrderSize, 0);
  const totalPerDeal =
    baseOrderSize + perOrderSeries.reduce((acc, value) => acc + value, 0);
  const totalPerBot = totalPerDeal * maxDeals;

  const costPerDeal = leverage > 0 ? totalPerDeal / leverage : totalPerDeal;
  const costPerBot = leverage > 0 ? totalPerBot / leverage : totalPerBot;

  const smartOrdersRange = deriveSmartOrdersRange({
    ordersCount:
      perOrderSeries.length > 0 ? `${perOrderSeries.length}` : `${ordersCount}`,
    dcaCondition: dcaCondition || DCAConditionEnum.percentage,
    dcaCustom: dcaCustom || [],
    useMulti: !!useMulti,
    maxDealsPerPair: maxDealsPerPair || '1',
    maxNumberOfOpenDeals: maxNumberOfOpenDeals || '1',
  });

  const smartOrdersEnabled = Boolean(useSmartOrders);
  const activeOrdersCount = smartOrdersEnabled
    ? clamp(
        toNonNegativeInteger(_activeOrdersCount, smartOrdersRange.min),
        smartOrdersRange.min,
        smartOrdersRange.max
      )
    : smartOrdersRange.min;

  const activeOrdersEffective = Math.min(
    activeOrdersCount,
    perOrderSeries.length
  );
  const requiredNowPerDeal = smartOrdersEnabled
    ? baseOrderSize +
      perOrderSeries
        .slice(0, activeOrdersEffective)
        .reduce((acc, value) => acc + value, 0)
    : totalPerDeal;

  const requiredNowNotional = Math.min(
    totalPerBot,
    requiredNowPerDeal * maxDeals
  );
  const requiredNowCost =
    leverage > 0 ? requiredNowNotional / leverage : requiredNowNotional;

  const resolveOrderContextParams: Parameters<
    typeof resolveBaseOrderContext
  >[0] = {
    currencyReference: orderSizeType,
    strategy: strategy,
    aggregatedBalances: tradingContext.aggregatedBalances,
    futures: Boolean(futures),
    coinm: Boolean(coinm),
    baseAsset: tradingContext.baseAsset ?? 'QUOTE',
    quoteAsset: tradingContext.quoteAsset ?? 'BASE',
    latestPrice: tradingContext.latestPrice ?? 0,
  };

  if (tradingContext.baseAsset) {
    resolveOrderContextParams.baseAsset = tradingContext.baseAsset;
  }
  if (tradingContext.quoteAsset) {
    resolveOrderContextParams.quoteAsset = tradingContext.quoteAsset;
  }
  if (typeof tradingContext.latestPrice === 'number') {
    resolveOrderContextParams.latestPrice = tradingContext.latestPrice;
  }

  const { currencyLabel, availableBalance } = resolveBaseOrderContext(
    resolveOrderContextParams
  );

  const overspend = !percentageMode && costPerBot > availableBalance + EPSILON;
  const missingCapital = overspend ? costPerBot - availableBalance : 0;

  const slackPercentage =
    !percentageMode && availableBalance > 0
      ? ((availableBalance - costPerBot) / availableBalance) * 100
      : null;

  return {
    ordersCount,
    maxDeals,
    volumeScale,
    orderSize,
    baseOrderSize,
    totalPerDeal,
    totalPerBot,
    costPerDeal,
    costPerBot,
    plannedDeviation,
    percentageMode,
    leverage,
    smartOrders: {
      enabled: smartOrdersEnabled,
      activeCount: smartOrdersEnabled ? activeOrdersEffective : 0,
    },
    requiredNowNotional,
    requiredNowCost,
    currencyLabel,
    availableBalance,
    overspend,
    missingCapital,
    slackPercentage,
  };
};
