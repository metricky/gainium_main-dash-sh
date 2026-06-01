import type React from 'react';
import {
  AccumulatedProfitIcon,
  BotStatsAdvancedIcon,
  BotStatusIcon,
  CategoriesAnalysisIcon,
  CoinChartIcon,
  DefaultWidgetIcon,
  ExchangeDistributionIcon,
  FearGreedIcon,
  HeatmapIcon,
  HistogramIcon,
  IndicatorHeatmapIcon,
  LatestOrdersIcon,
  MarketCapAnalysisIcon,
  MetricChartIcon,
  MetricTableIcon,
  NewsRSSIcon,
  NotesIcon,
  OnboardingStepsIcon,
  OverviewQuickActionsIcon,
  PerformanceAnalysisIcon,
  PortfolioAllocationIcon,
  PortfolioBalancesIcon,
  PortfolioValueIcon,
  ProfitIcon,
  ScatterIcon,
  ScreenerIcon,
  TreemapDealsIcon,
  TreemapMarketIcon,
  TreemapPortfolioIcon,
  WatchlistIcon,
  type WidgetIconProps,
} from './WidgetIcons';

// Map of widget types to their icons
export const WIDGET_ICONS: Record<string, React.FC<WidgetIconProps>> = {
  // Dashboard widgets
  'portfolio-value': PortfolioValueIcon,
  profit: ProfitIcon,
  'profit-over-time': ProfitIcon,
  'accumulated-profit': AccumulatedProfitIcon,
  'bot-status': BotStatusIcon,
  'bot-stats-advanced': BotStatsAdvancedIcon,
  'latest-orders': LatestOrdersIcon,
  screener: ScreenerIcon,
  'portfolio-allocation': PortfolioAllocationIcon,
  'portfolio-balances': PortfolioBalancesIcon,
  'portfolio-categories-analysis': CategoriesAnalysisIcon,
  'portfolio-market-cap-analysis': MarketCapAnalysisIcon,
  'portfolio-performance-analysis': PerformanceAnalysisIcon,
  'portfolio-exchange-distribution': ExchangeDistributionIcon,
  'coin-chart': CoinChartIcon,
  'treemap-market': TreemapMarketIcon,
  'treemap-portfolio': TreemapPortfolioIcon,
  'treemap-deals': TreemapDealsIcon,
  'fear-greed-index': FearGreedIcon,
  'indicator-heatmap-market': IndicatorHeatmapIcon,
  'indicator-heatmap-portfolio': IndicatorHeatmapIcon,
  watchlist: WatchlistIcon,
  notes: NotesIcon,
  'news-rss': NewsRSSIcon,
  'overview-quick-actions': OverviewQuickActionsIcon,
  'onboarding-steps': OnboardingStepsIcon,
  // Report widgets
  'metric-chart': MetricChartIcon,
  'metric-table': MetricTableIcon,
  histogram: HistogramIcon,
  scatter: ScatterIcon,
  heatmap: HeatmapIcon,
};

// Helper to get icon component for a widget type
export const getWidgetIcon = (
  widgetType: string
): React.FC<WidgetIconProps> => {
  return WIDGET_ICONS[widgetType] || DefaultWidgetIcon;
};
