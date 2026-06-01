export type GridBotType = 'spot' | 'futures' | 'paper';

export type GridBotStatus =
  | 'monitoring'
  | 'open'
  | 'range'
  | 'paused'
  | 'closed'
  | 'stopped'
  | 'archive'
  | 'error';

export type GridBotMarginType = 'isolated' | 'cross';

export type GridBotOrderSide = 'BUY' | 'SELL';

export interface GridBotSettings {
  id: string;
  name: string;
  type: GridBotType;
  status: GridBotStatus;
  exchange: string;
  exchangeUUID?: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  strategy: 'LONG' | 'SHORT';
  profitCurrency: 'base' | 'quote';
  topPrice: number;
  lowPrice: number;
  gridStep: number;
  prioritize: 'gridStep' | 'levels';
  levels: number;
  ordersInAdvance: number;
  sellDisplacement: number;
  tpPerc?: number;
  slPerc?: number;
  tpTopPrice?: number;
  slLowPrice?: number;
  gridType: 'geometric' | 'arithmetic';
  budget: number;
  coinm?: boolean;
  futures?: boolean;
  marginType?: GridBotMarginType;
  leverage?: number;
  useStopLoss?: boolean;
  useTakeProfit?: boolean;
  useOrderInAdvance?: boolean;
  initialPrice?: number;
  initialBalances?: GridBotBalances;
  currentBalances?: GridBotBalances;
}

export interface GridBotBalances {
  base: number;
  quote: number;
}

export interface GridBotProfitBreakdown {
  total: number;
  totalUsd?: number;
  freeTotal?: number;
  freeTotalUsd?: number;
  daily?: number;
  dailyUsd?: number;
}

export interface GridBotRangeEstimate {
  mainAsset: string;
  secondaryAsset: string;
  mainAssetRange: [number, number];
  secondaryAssetRange: [number, number];
  estimatedMainAssetNow: number;
  estimatedSecondaryNow: number;
  estimatedMainAssetActive: number;
  estimatedSecondaryAssetTotal: number;
}

export interface GridExchangePrecision {
  base: number;
  quote: number;
  price: number;
}

export interface GridBotOrdersSummary {
  active: number;
  total: number;
  filled: number;
  cancelled: number;
}

export interface GridBotOrderLine {
  id: string;
  botId: string;
  exchangeOrderId?: string;
  price: number;
  quantity: number;
  side: GridBotOrderSide;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}
