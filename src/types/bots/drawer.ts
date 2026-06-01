import type { AdditionalBotData, Bot, ComboBot, DCABot } from '..';

export type DrawerBotType =
  | 'signal'
  | 'grid'
  | 'dca'
  | 'terminal'
  | 'combo'
  | 'hedgeDca'
  | 'hedgeCombo';

export type DrawerBotStatus = 'active' | 'paused' | 'stopped' | 'error';

export interface DrawerBotSettings {
  step?: string;
  volumeScale?: string;
  stepScale?: string;
  ordersCount?: number;
  activeOrdersCount?: number;
  useTp?: boolean;
  tpPerc?: string;
  useSl?: boolean;
  slPerc?: string;
  orderSizeType?: string;
  profitCurrency?: string;
  startCondition?: string;
  startOrderType?: string;
  strategy?: string;
  orderFixedIn?: string;
  orderSize?: string;
  useDca?: boolean;
  useSmartOrders?: boolean;
}

export interface DrawerBotRawData {
  stats?: {
    chart?: Array<{
      equity?: number;
      realizedProfit?: number;
      buyAndHold?: number;
      time: number;
    }>;
  };
  [key: string]: unknown;
}

export interface DrawerBotUsage {
  current?: number;
  currentUsd?: number;
  max?: number;
  base?: number;
  quote?: number;
}

export interface DrawerGridDetails {
  topPrice?: number;
  lowPrice?: number;
  currentPrice?: number;
  gridStep?: number;
  levelsTotal?: number;
  levelsActiveBuy?: number;
  levelsActiveSell?: number;
}

export interface DrawerComboDetails {
  pairCount?: number;
  pairs?: string[];
  totalQuoteUsage?: number;
  totalBaseUsage?: number;
  initialQuoteBalance?: number;
  currentQuoteBalance?: number;
}

export interface DrawerHedgeDcaDetails {
  longBotId: string;
  shortBotId: string;
  longSymbol: string;
  shortSymbol: string;
  aggregatedProfit: number;
  longProfit: number;
  shortProfit: number;
  longUsage: number;
  shortUsage: number;
  longBalance: { base: number; quote: number };
  shortBalance: { base: number; quote: number };
}

export interface DrawerHedgeComboDetails {
  longBotId: string;
  shortBotId: string;
  pairCount: number;
  pairs: string[];
  aggregatedProfit: number;
  longProfit: number;
  shortProfit: number;
  totalQuoteUsage: number;
  longQuoteUsage: number;
  shortQuoteUsage: number;
}

export interface DrawerBotExtra {
  grid?: DrawerGridDetails;
  combo?: DrawerComboDetails;
  hedgeDca?: DrawerHedgeDcaDetails;
  hedgeCombo?: DrawerHedgeComboDetails;
  [key: string]: unknown;
}

export type DrawerBot = (DCABot | ComboBot | Bot) & AdditionalBotData;

/* export interface DrawerBot {
  id: string;
  name: string;
  type: DrawerBotType;
  exchange: string;
  exchangeUUID?: string;
  symbol: string;
  symbols: string[];
  pair: string;
  coinPair: string;
  strategy: string;
  status: DrawerBotStatus;
  scanner?: string;
  color?: string;
  baseAsset?: string;
  quoteAsset?: string;
  profit: number;
  profitUsd: number;
  pnlPercent: number;
  invested: number;
  investedUsd: number;
  runtime: string;
  totalProfitUsd: number;
  totalProfitPercent: number;
  value: number;
  avgDaily: number;
  avgDailyPerc?: number; // Average daily percentage (Grid bots only)
  annualizedReturn: number;
  tradingTime: string;
  created: string;
  usage: number;
  deals: number;
  currentCost: number;
  maxCost: number;
  currentBaseUsage?: number;
  maxBaseUsage?: number;
  workingTime?: number; // Total working time in milliseconds (Grid bots only)
  workingDays?: number; // Working time in days (Grid bots only)
  unrealizedPnl?: number;
  unrealizedPnlUsd?: number;
  unrealizedPnlPercent?: number;
  openTrades?: number;
  closedTrades?: number;
  rawData?: DrawerBotRawData;
  settings?: DrawerBotSettings;
  currentUsage?: DrawerBotUsage;
  extra?: DrawerBotExtra;
} */
