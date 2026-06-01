import type { Layout } from 'react-grid-layout';

// Types for trading terminal widgets

export type TradingWidgetType =
  | 'trading-chart'
  | 'order-book'
  | 'trading-panel'
  | 'market-depth'
  | 'watchlist'
  | 'open-orders'
  | 'favorites';

export type TradingWidgetConfig = {
  id: string;
  type: TradingWidgetType;
  title: string;
  layoutData: Layout;
  data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  tabs?: Array<{ id: string; title: string; data?: Record<string, unknown> }>;
  hasOptions?: boolean;
};
