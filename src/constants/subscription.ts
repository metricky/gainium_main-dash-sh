import { ExchangeEnum } from '@/types/exchange.types';

// Exchanges that require a paid subscription
export const paidExchanges = [
  ExchangeEnum.binance,
  ExchangeEnum.binanceCoinm,
  ExchangeEnum.binanceUsdm,
  ExchangeEnum.binanceUS,
  ExchangeEnum.coinbase,
  ExchangeEnum.binanceAll,
  ExchangeEnum.binanceSpot,
  ExchangeEnum.okx,
  ExchangeEnum.okxAll,
  ExchangeEnum.okxInverse,
  ExchangeEnum.okxLinear,
  ExchangeEnum.okxSpot,
];

// Subscription plans that are considered "paid" (not free)
// Must match backend's NewSubscriptionName enum values (lowercase)
export const paidPlans = [
  'advanced',
  'basic',
  'pro',
  'enterprise',
  'edge',
  'elite',
  'legend',
  'master',
  'mini',
  'prime',
  'vip1',
  'vip2',
  'vip3',
  'vip4',
  'trial',
];

export const freePairs = 50;
export const paidPairs = 500;
