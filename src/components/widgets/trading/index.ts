// Trading Terminal widget registry
import type { Layout } from 'react-grid-layout';
import { getCompatibilityDefaultSize } from '../DefaultWidgetSizes';
import CreateDeal from './CreateDeal';
import Favorites from './Favorites';
import MarketDepth from './MarketDepth';
import OpenOrders from './OpenOrders';
import OrderBook from './OrderBook';
import TradingChart from './TradingChart';
import TradingPanel from './TradingPanel';
import Watchlist from './Watchlist';

// Types for trading terminal widgets
export type TradingWidgetType =
  | 'trading-chart'
  | 'order-book'
  | 'trading-panel'
  | 'market-depth'
  | 'watchlist'
  | 'open-orders'
  | 'create-deal'
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

// Trading widget registry with metadata
export const TRADING_WIDGET_REGISTRY = {
  'trading-chart': {
    component: TradingChart,
    metadata: {
      title: 'Trading Chart',
      description: 'Advanced charting with indicators and drawing tools',
      category: 'Charts',
      defaultSize: getCompatibilityDefaultSize('trading-chart'),
      hasOptions: true,
    },
  },
  'order-book': {
    component: OrderBook,
    metadata: {
      title: 'Order Book',
      description: 'Real-time order book with bid/ask spread',
      category: 'Market Data',
      defaultSize: getCompatibilityDefaultSize('order-book'),
      hasOptions: false,
    },
  },
  'trading-panel': {
    component: TradingPanel,
    metadata: {
      title: 'Trading Panel',
      description: 'Buy/sell orders with limit, market, and stop orders',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('trading-panel'),
      hasOptions: true,
    },
  },
  'market-depth': {
    component: MarketDepth,
    metadata: {
      title: 'Market Depth',
      description: 'Visual market depth chart with liquidity analysis',
      category: 'Market Data',
      defaultSize: getCompatibilityDefaultSize('market-depth'),
      hasOptions: false,
    },
  },
  watchlist: {
    component: Watchlist,
    metadata: {
      title: 'Watchlist',
      description: 'Real-time price monitoring for trading pairs',
      category: 'Market Data',
      defaultSize: getCompatibilityDefaultSize('watchlist'),
      hasOptions: false,
    },
  },
  'open-orders': {
    component: OpenOrders,
    metadata: {
      title: 'Open Orders',
      description: 'Monitor active orders and manage positions',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('open-orders'),
      hasOptions: false,
    },
  },
  'create-deal': {
    component: CreateDeal,
    metadata: {
      title: 'Create Deal',
      description: 'Create new trading deals with advanced configuration',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('create-deal'),
      hasOptions: true,
    },
  },
  favorites: {
    component: Favorites,
    metadata: {
      title: 'Favorites',
      description: 'Quick coin selector with favorites management',
      category: 'Utilities',
      defaultSize: getCompatibilityDefaultSize('favorites'),
      hasOptions: false,
      header: false, // This widget has no header
    },
  },
} as const;

// Helper functions
export const getAvailableTradingWidgetTypes = () => {
  return Object.keys(TRADING_WIDGET_REGISTRY) as Array<
    keyof typeof TRADING_WIDGET_REGISTRY
  >;
};

export const getTradingWidgetMetadata = (
  type: keyof typeof TRADING_WIDGET_REGISTRY
) => {
  return TRADING_WIDGET_REGISTRY[type]?.metadata;
};

export const getTradingWidgetComponent = (
  type: keyof typeof TRADING_WIDGET_REGISTRY
) => {
  return TRADING_WIDGET_REGISTRY[type]?.component;
};
