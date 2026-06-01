import type { BotOrder } from '@/hooks/useBotOrders';
import type { BotEvent } from '@/hooks/useBotEvents';
import type { AvgPrice, LeverageBracket, Transaction } from '@/types';

export type GridCurrency = 'base' | 'quote' | 'usd';

export interface GridBotSummaryMetrics {
  workingTime: string;
  activeOrders: number;
  totalOrders: number;
  filledOrders: number;
  status: string;
  statusReason?: string | null;
  transactions: {
    buy: number;
    sell: number;
  };
  levels: {
    active: number;
    total: number;
  };
  profitUsd: number;
  profitTotal: number;
  dailyProfitUsd: number;
}

export interface GridFundsSnapshotEntry {
  label: string;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface GridFundsSnapshot {
  activeCurrency: GridCurrency;
  baseAsset: string;
  quoteAsset: string;
  usdRate: number;
  lastPrice: number;
  current: {
    invested: GridFundsSnapshotEntry;
    free: GridFundsSnapshotEntry;
    total: GridFundsSnapshotEntry;
    botProfit: GridFundsSnapshotEntry;
    breakEvenPrice?: number;
  };
  initial: {
    invested: GridFundsSnapshotEntry;
    base: GridFundsSnapshotEntry;
    quote: GridFundsSnapshotEntry;
    usd: GridFundsSnapshotEntry;
  };
  futures?: {
    leverage?: number;
    notionalValue?: number;
    pnl?: GridFundsSnapshotEntry;
  };
}

export interface GridOrdersRow {
  id: string;
  clientOrderId: string;
  price: number;
  quantity: number;
  executedQuantity: number;
  status: string;
  side: string;
  time: number;
  baseAsset: string;
  quoteAsset: string;
  type: string;
}

export interface GridOrdersState {
  rows: GridOrdersRow[];
  total: number;
  page: number;
  isLoading: boolean;
  error?: string | null;
  activeTab: 'open' | 'completed';
  raw: BotOrder[];
}

export interface GridTransactionsRow {
  id: string;
  time: number;
  side: string;
  price: number;
  amountBase: number;
  amountQuote: number;
  profitBase: number;
  profitQuote: number;
  profitUsd?: number;
  feeBase: number;
  feeQuote: number;
}

export interface GridTransactionsState {
  rows: GridTransactionsRow[];
  isLoading: boolean;
  error?: string | null;
  raw: Transaction[];
}

export interface GridEventsState {
  items: BotEvent[];
  total: number;
  isLoading: boolean;
  error?: string | null;
}

export interface GridProfitMetrics {
  totalProfit: number;
  averageDaily: number;
  averageWeekly: number;
  averageMonthly: number;
  bestDay: number;
  worstDay: number;
  profitableDays: number;
  totalDays: number;
}

export interface GridOverlayAvgPriceState {
  lines: AvgPrice[];
  hasData: boolean;
  isLoading: boolean;
  error?: string | null;
}

export interface GridOverlayState {
  avgPrice: GridOverlayAvgPriceState;
}

export interface GridMarketOverviewState {
  showTradingView: boolean;
  showOrders: boolean;
  showTransactions: boolean;
}

export interface GridLeverageState {
  brackets: LeverageBracket[];
  isLoading: boolean;
  error?: string | null;
}
