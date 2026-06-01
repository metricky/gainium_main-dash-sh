import type { GridBotOrderSide, GridBotStatus } from './settings';

export type GridOrderStatus =
  | 'NEW'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface GridOrder {
  id: string;
  botId: string;
  symbol: string;
  price: number;
  quantity: number;
  executedQuantity: number;
  side: GridBotOrderSide;
  status: GridOrderStatus;
  createdAt: string;
  updatedAt?: string;
  exchangeOrderId?: string;
  fee?: number;
  feeCurrency?: string;
}

export interface GridOrderBookStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
}

export interface GridOrderFilter {
  status?: GridOrderStatus;
  side?: GridBotOrderSide;
  from?: string;
  to?: string;
  search?: string;
}

export interface GridOrderQuery {
  page: number;
  pageSize: number;
  sort?: {
    field: 'price' | 'quantity' | 'createdAt' | 'status';
    direction: 'asc' | 'desc';
  };
  filter?: GridOrderFilter;
}

export interface GridTransaction {
  id: string;
  botId: string;
  orderIdBuy?: string;
  orderIdSell?: string;
  priceBuy: number;
  priceSell: number;
  amountBaseBuy: number;
  amountQuoteBuy: number;
  amountBaseSell: number;
  amountQuoteSell: number;
  profitBase: number;
  profitQuote: number;
  profitUsd?: number;
  feeBase: number;
  feeQuote: number;
  feeUsd?: number;
  side: GridBotOrderSide;
  status: GridBotStatus;
  updateTime: string;
}

export interface GridTransactionQuery {
  page: number;
  pageSize: number;
  filter?: {
    from?: string;
    to?: string;
    side?: GridBotOrderSide;
  };
}

export interface GridOrdersResponse {
  data: GridOrder[];
  total: number;
}

export interface GridTransactionsResponse {
  data: GridTransaction[];
  total: number;
}
