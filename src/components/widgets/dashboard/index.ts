// Widget wrapper and base types
export { default as WidgetWrapper } from '../WidgetWrapper';
export type {
  WidgetMetadata,
  WidgetTab,
  WidgetWrapperProps,
} from '../WidgetWrapper';

// Centralized widget types
export type { DashboardWidgetType, WidgetType } from '../../../types/widgets';

// Default widget sizes for responsive layouts
export {
  DEFAULT_WIDGET_SIZES,
  getCompatibilityDefaultSize,
  getCurrentBreakpoint,
  getDefaultWidgetSize,
  getResponsiveWidgetSizes,
  getWidgetSize,
  shouldUseDefaultSize,
  useResponsiveWidgetSize,
} from '../DefaultWidgetSizes';
export type {
  Breakpoint,
  ResponsiveWidgetSize,
  WidgetSize,
} from '../DefaultWidgetSizes';

// Import for internal use
import type { WidgetType } from '../../../types/widgets';
import {
  getCompatibilityDefaultSize,
  type WidgetSize,
} from '../DefaultWidgetSizes';

/**
 * Shape of a single entry in the dashboard widget registry. The
 * registry maps a widget `type` to the React component name + picker
 * metadata. Mutable so host apps (e.g. cloud) can extend the registry
 * at boot via `registerDashboardWidgets()`.
 */
export interface WidgetRegistryEntry {
  component: string;
  metadata: {
    id: string;
    type: string;
    title: string;
    description?: string;
    category?: string;
    defaultSize: WidgetSize;
    minSize?: { w: number; h: number };
    maxSize?: { w: number; h: number };
    hasOptions: boolean;
  };
}

/**
 * Register additional dashboard widgets at boot. Host apps with extra
 * widgets call this from `main.tsx` before the first render. Sh ships
 * only the core set declared inline below; nothing extra is registered.
 */
export function registerDashboardWidgets(
  extras: Record<string, WidgetRegistryEntry>
): void {
  Object.assign(WIDGET_REGISTRY, extras);
}

// Widget components
export { default as PortfolioValue } from './PortfolioValue';
export type { PortfolioValueProps } from './PortfolioValue';

export { default as Profit } from './Profit';
export type { ProfitProps } from './Profit';

export { default as AccumulatedProfit } from './AccumulatedProfit';
export type { AccumulatedProfitProps } from './AccumulatedProfit';

export { default as BotStatus } from './BotStatus';
export type { BotStatsProps } from './BotStatus';

export { default as BotStatsAdvanced } from './BotStatsAdvanced';
export type { BotStatsAdvancedProps } from './BotStatsAdvanced';

export { default as LatestOrders } from './LatestOrders';
export type { LatestOrdersProps } from './LatestOrders';

export { default as TopDeals } from './TopDeals';
export type { TopDealsProps } from './TopDeals';

export { default as PortfolioAllocation } from './PortfolioAllocation';
export type { PortfolioAllocationProps } from './PortfolioAllocation';

// Prefer the enhanced implementation as the canonical PortfolioBalances widget
export { default as PortfolioBalances } from './EnhancedPortfolioBalances';
export type { PortfolioBalancesProps } from './PortfolioBalances';
// Keep the legacy implementation file available for explicit imports, but export the enhanced one by default so only one widget needs maintenance.

export { default as PortfolioCategoriesAnalysis } from './PortfolioCategoriesAnalysis';
export type { PortfolioCategoriesAnalysisProps } from './PortfolioCategoriesAnalysis';

export { PortfolioExchangeDistribution } from './PortfolioExchangeDistribution';
export type { PortfolioExchangeDistributionProps } from './PortfolioExchangeDistribution';

export { default as CoinChart } from './CoinChart';
export type { CoinChartProps } from './CoinChart';

// Treemap base + the only variant that ships in the core (deals).
export { default as TreemapBase } from './TreemapBase';
export type { TreemapBaseProps } from './TreemapBase';

export { default as TreemapDeals } from './TreemapDeals';
export type { TreemapDealsProps } from './TreemapDeals';

// New: Notes widget export
export { default as NotesWidget } from './NotesWidget';
export type { NotesWidgetProps } from './NotesWidget';

// New: News RSS widget export
export { default as NewsRSS } from './NewsRSS';
export type { NewsRSSProps } from './NewsRSS';

// New: Overview Quick Actions widget export
export { default as OverviewQuickActions } from './OverviewQuickActions';
export type { OverviewQuickActionsProps } from './OverviewQuickActions';

// Trading widgets available in dashboard
export { default as Watchlist } from '../trading/Watchlist';
export type { WatchlistProps } from '../trading/Watchlist';

// Core dashboard widget registry. Mutable so host apps can extend it
// at boot via `registerDashboardWidgets()`. Cloud-only widgets are
// added through that hook from cloud's own `main.tsx`.
export const WIDGET_REGISTRY: Record<string, WidgetRegistryEntry> = {
  'portfolio-value': {
    component: 'PortfolioValue',
    metadata: {
      id: 'portfolio-value',
      type: 'portfolio-value',
      title: 'Portfolio Value',
      description:
        'Real-time portfolio value chart with time filters. Learn more: /help/portfolio-value',
      category: 'Portfolio',
      defaultSize: getCompatibilityDefaultSize('portfolio-value'),
      minSize: { w: 4, h: 3 },
      maxSize: { w: 6, h: 7 },
      hasOptions: true,
    },
  },
  profit: {
    component: 'Profit',
    metadata: {
      id: 'profit',
      type: 'profit',
      title: 'Profit over time',
      description:
        'Profit analysis with statistics and charts. Learn more: /help/profit-stats',
      category: 'Analytics',
      defaultSize: getCompatibilityDefaultSize('profit'),
      minSize: { w: 4, h: 3 },
      maxSize: { w: 6, h: 7 },
      hasOptions: true,
    },
  },
  'accumulated-profit': {
    component: 'AccumulatedProfit',
    metadata: {
      id: 'accumulated-profit',
      type: 'accumulated-profit',
      title: 'Accumulated Profit',
      description: 'Track accumulated profit over time',
      category: 'Analytics',
      defaultSize: getCompatibilityDefaultSize('accumulated-profit'),
      minSize: { w: 4, h: 3 },
      maxSize: { w: 6, h: 7 },
      hasOptions: true,
    },
  },
  'bot-status': {
    component: 'BotStatus',
    metadata: {
      id: 'bot-status',
      type: 'bot-status',
      title: 'Status',
      description: 'Bot & deal status',
      category: 'Bots',
      defaultSize: getCompatibilityDefaultSize('bot-status'),
      minSize: { w: 4, h: 3 },
      maxSize: { w: 6, h: 7 },
      hasOptions: true,
    },
  },
  'bot-stats-advanced': {
    component: 'BotStatsAdvanced',
    metadata: {
      id: 'bot-stats-advanced',
      type: 'bot-stats-advanced',
      title: 'Bot Stats',
      description:
        'Analyze selected DCA & Combo bots: realized profit, allocated capital, trades, and aggregated profit/equity charts. Learn more: /help/bankroll, /help/confidence-grade',
      category: 'Bots',
      defaultSize: getCompatibilityDefaultSize('bot-stats-advanced'),
      minSize: { w: 6, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'latest-orders': {
    component: 'LatestOrders',
    metadata: {
      id: 'latest-orders',
      type: 'latest-orders',
      title: 'Latest Orders',
      description: 'Real-time trading orders history with order details',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('latest-orders'),
      minSize: { w: 6, h: 4 },
      maxSize: { w: 12, h: 8 },
      hasOptions: true,
    },
  },
  'portfolio-allocation': {
    component: 'PortfolioAllocation',
    metadata: {
      id: 'portfolio-allocation',
      type: 'portfolio-allocation',
      title: 'Portfolio Allocation',
      description: 'Portfolio allocation with asset distribution',
      category: 'Portfolio',
      defaultSize: getCompatibilityDefaultSize('portfolio-allocation'),
      minSize: { w: 4, h: 3 },
      maxSize: { w: 6, h: 7 },
      hasOptions: true,
    },
  },
  'portfolio-balances': {
    component: 'PortfolioBalances',
    metadata: {
      id: 'portfolio-balances',
      type: 'portfolio-balances',
      title: 'Portfolio Balances',
      description: 'Portfolio balances with token amounts and current prices',
      category: 'Portfolio',
      defaultSize: getCompatibilityDefaultSize('portfolio-balances'),
      minSize: { w: 6, h: 4 },
      maxSize: { w: 12, h: 8 },
      hasOptions: true,
    },
  },
  'portfolio-categories-analysis': {
    component: 'PortfolioCategoriesAnalysis',
    metadata: {
      id: 'portfolio-categories-analysis',
      type: 'portfolio-categories-analysis',
      title: 'Categories Analysis',
      description:
        'Portfolio distribution by asset categories (DeFi, Layer 1, etc.)',
      category: 'Portfolio',
      defaultSize: getCompatibilityDefaultSize('portfolio-categories-analysis'),
      minSize: { w: 6, h: 4 },
      maxSize: { w: 12, h: 8 },
      hasOptions: true,
    },
  },
  'portfolio-exchange-distribution': {
    component: 'PortfolioExchangeDistribution',
    metadata: {
      id: 'portfolio-exchange-distribution',
      type: 'portfolio-exchange-distribution',
      title: 'Exchange Distribution',
      description:
        'Portfolio value breakdown across exchanges with risk analysis',
      category: 'Portfolio',
      defaultSize: getCompatibilityDefaultSize(
        'portfolio-exchange-distribution'
      ),
      minSize: { w: 6, h: 4 },
      maxSize: { w: 12, h: 8 },
      hasOptions: true,
    },
  },
  'coin-chart': {
    component: 'CoinChart',
    metadata: {
      id: 'coin-chart',
      type: 'coin-chart',
      title: 'Coin Chart',
      description: 'Interactive coin chart with TradingView integration',
      category: 'Market',
      defaultSize: getCompatibilityDefaultSize('coin-chart'),
      minSize: { w: 4, h: 4 },
      maxSize: { w: 12, h: 8 },
      hasOptions: true,
    },
  },
  // Treemap variants
  'treemap-deals': {
    component: 'TreemapDeals',
    metadata: {
      id: 'treemap-deals',
      type: 'treemap-deals',
      title: 'Treemap: Deals',
      description:
        'Interactive DCA deals treemap showing deal allocation by current cost with value percentage coloring',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('marketcap-prices'),
      minSize: { w: 4, h: 4 },
      maxSize: { w: 12, h: 8 },
      hasOptions: true,
    },
  },
  watchlist: {
    component: 'Watchlist',
    metadata: {
      id: 'watchlist',
      type: 'watchlist',
      title: 'Watchlist',
      description: 'Real-time price monitoring for trading pairs',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('watchlist'),
      minSize: { w: 4, h: 4 },
      maxSize: { w: 8, h: 8 },
      hasOptions: false,
    },
  },
  notes: {
    component: 'NotesWidget',
    metadata: {
      id: 'notes',
      type: 'notes',
      title: 'Notes',
      description: 'Markdown notes widget for personal annotations',
      category: 'Utilities',
      defaultSize: getCompatibilityDefaultSize('notes'),
      minSize: { w: 4, h: 4 },
      maxSize: { w: 8, h: 8 },
      hasOptions: true,
    },
  },
  'news-rss': {
    component: 'NewsRSS',
    metadata: {
      id: 'news-rss',
      type: 'news-rss',
      title: 'News RSS',
      description: 'RSS news feed reader with customizable sources',
      category: 'News',
      defaultSize: getCompatibilityDefaultSize('news-rss'),
      minSize: { w: 4, h: 4 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'overview-quick-actions': {
    component: 'OverviewQuickActions',
    metadata: {
      id: 'overview-quick-actions',
      type: 'overview-quick-actions',
      title: 'Quick Actions',
      description: 'Quick access to create trades and bots',
      category: 'Utilities',
      defaultSize: getCompatibilityDefaultSize('overview-quick-actions'),
      minSize: { w: 2, h: 2 },
      maxSize: { w: 4, h: 4 },
      hasOptions: false,
    },
  },
};

// Helper function to get widget metadata by type
export const getWidgetMetadata = (type: WidgetType) => {
  const registry = WIDGET_REGISTRY[type];
  if (!registry) {
    throw new Error(`Widget type "${type}" is not registered`);
  }
  return registry.metadata;
};

/** Returns true when the given widget type is currently registered. */
export const isWidgetTypeAvailable = (type: string): boolean =>
  type in WIDGET_REGISTRY;

// Get all available widget types
export const getAvailableWidgetTypes = (): WidgetType[] => {
  return Object.keys(WIDGET_REGISTRY) as WidgetType[];
};
