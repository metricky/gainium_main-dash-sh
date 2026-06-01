export type GridBacktestTab = 'history' | 'results' | 'settings';

export interface GridBacktestRange {
  from: string;
  to: string;
  interval: string;
}

export interface GridBacktestSettings {
  name?: string;
  pair: string;
  exchange: string;
  strategy: 'LONG' | 'SHORT';
  topPrice: number;
  lowPrice: number;
  levels: number;
  gridStep: number;
  budget: number;
  commission: number;
  slippage: number;
  userFee?: number;
  stopLoss?: number;
  takeProfit?: number;
  useAdvanced?: boolean;
}

export interface GridBacktestProgress {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  percent: number;
  startedAt: string;
  updatedAt?: string;
}

export interface GridBacktestFinancials {
  profitTotal: number;
  profitTotalUsd?: number;
  budget: number;
  valueChange: number;
  avgNetDaily?: number;
  annualizedReturn?: number;
}

export interface GridBacktestUsage {
  avgRealUsage: number;
  maxRealUsage: number;
  maxTheoreticalUsage?: number;
}

export interface GridBacktestRatios {
  profitFactor?: number;
  sharpeRatio?: number;
  santinoRatio?: number;
  buyAndHoldValueUsd?: number;
}

export interface GridBacktestResult {
  id: string;
  settings: GridBacktestSettings;
  financial: GridBacktestFinancials;
  usage: GridBacktestUsage;
  ratios: GridBacktestRatios;
  duration: {
    firstDataTime: string;
    lastDataTime: string;
    periodName: string;
    botWorkingTime?: string;
  };
  numerical: {
    transactionsPerDay?: number;
    buy: number;
    sell: number;
  };
  interval: string;
  note?: string;
  created: string;
  updated?: string;
  serverSide?: boolean;
  savePermanent?: boolean;
  multi?: boolean;
  multiPairs?: number;
}

export interface GridBacktestHistoryEntry extends GridBacktestResult {
  shareId?: string;
  costUsd?: number;
  imported?: boolean;
}

export interface GridBacktestHistoryResponse {
  data: GridBacktestHistoryEntry[];
  total: number;
}

export interface GridBacktestRunEstimate {
  requiredCredits: number;
  estimatedTimeSeconds: number;
}
