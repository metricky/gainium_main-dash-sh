/**
 * Centralized widget types and constants for consistent usage across the application
 */

// Dashboard widget types - derived from the registry keys
export type DashboardWidgetType =
  | 'portfolio-value'
  | 'profit'
  | 'accumulated-profit'
  | 'bot-status'
  | 'bot-stats-advanced'
  | 'latest-orders'
  | 'screener'
  | 'treemap-market'
  | 'treemap-portfolio'
  | 'treemap-deals'
  | 'watchlist'
  | 'portfolio-allocation'
  | 'portfolio-balances'
  | 'coin-chart'
  | 'fear-greed-index'
  | 'indicator-heatmap-market'
  | 'indicator-heatmap-portfolio'
  | 'notes'
  | 'news-rss'
  | 'overview-quick-actions'
  | 'onboarding-steps'
  | 'curated-presets-strip';

// Extended widget types for refresh hooks (includes legacy and additional types)
export type ExtendedWidgetType =
  | DashboardWidgetType
  | 'profit-widget'
  | 'treemap-widget'
  | 'account-overview'
  | 'portfolio-profit'
  | 'unrealized-pnl'
  | 'trading-performance'
  | 'bot-performance'
  | 'positions'
  | 'open-orders'
  | 'trade-history'
  | 'bot-list'
  | 'dca-bot-list'
  | 'combo-bot-list'
  | 'hedge-bot-list'
  | 'exchanges'
  | 'balances'
  | 'wallet'
  | 'notifications'
  | 'settings'
  | 'subscription'
  | 'affiliate'
  | 'bot-stats';

// Generic widget type union
export type WidgetType = DashboardWidgetType;

// Widget query mapping for refresh hooks (includes all widget types)
export const WIDGET_QUERY_MAP: Record<string, string[]> = {
  'portfolio-value': ['portfolio-value', 'balances'],
  profit: ['profit', 'portfolio-stats'],
  'accumulated-profit': ['accumulated-profit', 'portfolio-stats'],
  'bot-status': ['bot-status', 'bots'],
  'bot-stats-advanced': ['bot-stats-advanced', 'bots'],
  'latest-orders': ['latest-orders', 'orders'],
  screener: ['screener', 'market-data'],
  'treemap-market': ['market-data', 'treemap'],
  'treemap-portfolio': ['portfolio-data', 'treemap'],
  watchlist: ['watchlist', 'market-data'],
  'portfolio-allocation': ['portfolio-allocation', 'balances'],
  'portfolio-balances': ['getBalances'],
  'coin-chart': ['coin-chart', 'market-data'],
  'fear-greed-index': ['fear-greed-index', 'market-data'],
  'indicator-heatmap-market': ['indicator-heatmap-market', 'market-data'],
  'indicator-heatmap-portfolio': [
    'indicator-heatmap-portfolio',
    'portfolio-data',
  ],
  notes: [],
  'news-rss': [],
  'onboarding-steps': [],
  // Extended types for hooks
  'profit-widget': ['getProfitByUser'],
  'treemap-widget': ['screener'],
  'account-overview': ['user', 'getPortfolioByUser'],
  'portfolio-profit': ['getProfitByUser'],
  'unrealized-pnl': ['getPortfolioByUser'],
  'trading-performance': ['getProfitByUser'],
  'bot-performance': ['botList', 'dcaBotList', 'comboBotList'],
  positions: ['getPositions'],
  'open-orders': ['getOpenOrders'],
  'trade-history': ['getTradeHistory'],
  'bot-list': ['botList'],
  'dca-bot-list': ['dcaBotList'],
  'combo-bot-list': ['comboBotList'],
  'hedge-bot-list': ['hedgeBotList'],
  exchanges: ['getExchanges'],
  balances: ['getBalances'],
  wallet: ['getBalances', 'getPortfolioByUser'],
  notifications: ['getNotifications', 'getMessageBot'],
  settings: ['user'],
  subscription: ['user', 'getSubscriptionPlans'],
  affiliate: ['getAffiliateHistory', 'getPayouts'],
  'bot-stats': ['botList', 'dcaBotList', 'comboBotList', 'hedgeBotList'],
};

// Widget type mapping for refresh hooks
export const WIDGET_TYPE_MAP: Record<string, string> = {
  'portfolio-value': 'portfolio-value',
  profit: 'profit',
  'accumulated-profit': 'accumulated-profit',
  'bot-status': 'bot-status',
  'bot-stats-advanced': 'bot-stats-advanced',
  'latest-orders': 'latest-orders',
  screener: 'screener',
  'treemap-market': 'treemap-market',
  'treemap-portfolio': 'treemap-portfolio',
  watchlist: 'watchlist',
  'portfolio-allocation': 'portfolio-allocation',
  'portfolio-balances': 'portfolio-balances',
  'coin-chart': 'coin-chart',
  'fear-greed-index': 'fear-greed-index',
  'indicator-heatmap-market': 'indicator-heatmap-market',
  'indicator-heatmap-portfolio': 'indicator-heatmap-portfolio',
  'news-rss': 'news-rss',
  // Normalized mappings
  portfoliobalances: 'portfolio-balances',
  accumulatedprofit: 'accumulated-profit',
  profitwidget: 'profit-widget',
  portfoliovalue: 'portfolio-value',
  treemapmarket: 'treemap-market',
  treemapportfolio: 'treemap-portfolio',
  treemapwidget: 'treemap-widget',
  accountoverview: 'account-overview',
  portfolioprofit: 'portfolio-profit',
  unrealizedpnl: 'unrealized-pnl',
  tradingperformance: 'trading-performance',
  botperformance: 'bot-performance',
  latestorders: 'latest-orders',
  tradehistory: 'trade-history',
  botlist: 'bot-list',
  dcabotlist: 'dca-bot-list',
  combobotlist: 'combo-bot-list',
  hedgebotlist: 'hedge-bot-list',
  openorders: 'open-orders',
  getnotifications: 'notifications',
  getmessagebot: 'notifications',
  notes: 'notes',
};

// Utility functions
export const getWidgetQueries = (widgetType: string): string[] => {
  return WIDGET_QUERY_MAP[widgetType] || [];
};

export const getWidgetTypeIdentifier = (widgetType: string): string => {
  return WIDGET_TYPE_MAP[widgetType] || widgetType;
};

export const isValidWidgetType = (
  type: string
): type is DashboardWidgetType => {
  return Object.keys(WIDGET_QUERY_MAP).includes(type as DashboardWidgetType);
};
