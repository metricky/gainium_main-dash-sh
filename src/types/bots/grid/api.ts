import type { BotTypesEnum, Transaction } from '@/types';
import type { BotProfitDataPoint } from '@/hooks/useBotProfitChartData';
import type { BotOrder } from '@/hooks/useBotOrders';
import type { GridBot } from '@/types/gridBot';
import type {
  GridBotSummaryMetrics,
  GridFundsSnapshot,
  GridEventsState,
  GridLeverageState,
  GridMarketOverviewState,
  GridOrdersState,
  GridProfitMetrics,
  GridTransactionsState,
  GridOverlayState,
} from './data';

export type GridPageStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface GridPageState {
  status: GridPageStatus;
  botId?: string | null;
  botType: BotTypesEnum;
  bot?: GridBot;
  metrics?: GridBotSummaryMetrics;
  funds?: GridFundsSnapshot;
  orders: GridOrdersState;
  transactions: GridTransactionsState;
  events: GridEventsState;
  charts: {
    profit: BotProfitDataPoint[];
    hasProfitData: boolean;
    metrics: GridProfitMetrics;
  };
  overlays: GridOverlayState;
  marketOverview: GridMarketOverviewState;
  leverage: GridLeverageState;
  preferences: {
    currency: GridFundsSnapshot['activeCurrency'];
    ordersView: GridOrdersState['activeTab'];
  };
  error?: string | null;
}

export interface GridPageActions {
  refresh: () => Promise<void>;
  setCurrency: (currency: GridFundsSnapshot['activeCurrency']) => void;
  setOrdersTab: (tab: GridOrdersState['activeTab']) => void;
  setMarketOverview: (state: GridMarketOverviewState) => void;
}

export interface GridPageApi {
  state: GridPageState;
  actions: GridPageActions;
  helpers: {
    formatOrder: (order: BotOrder) => GridOrdersState['rows'][number];
    formatTransaction: (
      tx: Transaction
    ) => GridTransactionsState['rows'][number];
  };
}

export interface GridPageOptions {
  botId?: string;
  botType?: BotTypesEnum;
  demo?: boolean;
}
