import { Activity, DollarSign, Settings, TrendingUp } from 'lucide-react';
import type { NavigationWidgetType } from '../../../stores/navigationWidgetsStore';

export interface NavigationWidgetMetadata {
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  hasOptions: boolean;
  hasNavigationView: boolean;
}

export const NAVIGATION_WIDGET_REGISTRY: Record<
  NavigationWidgetType,
  NavigationWidgetMetadata
> = {
  watchlist: {
    title: 'Watchlist',
    description: 'Monitor your favorite trading pairs with real-time prices',
    category: 'Trading',
    icon: Settings, // We'll use a proper icon later
    hasOptions: true,
    hasNavigationView: true,
  },
  'profit-over-time': {
    title: 'Profit Over Time',
    description: 'Track your profit performance over different time periods',
    category: 'Portfolio',
    icon: TrendingUp,
    hasOptions: true,
    hasNavigationView: true,
  },
  'fear-greed-index': {
    title: 'Fear & Greed Index',
    description: 'Monitor market sentiment with the Fear & Greed Index',
    category: 'Market',
    icon: Activity,
    hasOptions: false,
    hasNavigationView: true,
  },
  'portfolio-value': {
    title: 'Portfolio Value',
    description: 'Display current portfolio value with change indicators',
    category: 'Portfolio',
    icon: DollarSign,
    hasOptions: false,
    hasNavigationView: true,
  },
};

export function getNavigationWidgetMetadata(
  type: NavigationWidgetType
): NavigationWidgetMetadata | undefined {
  return NAVIGATION_WIDGET_REGISTRY[type];
}

export function getAvailableNavigationWidgetTypes(): NavigationWidgetType[] {
  return Object.keys(NAVIGATION_WIDGET_REGISTRY) as NavigationWidgetType[];
}

// Export components
export { default as FearGreedNavigationView } from './FearGreedNavigationView';
export { default as NavbarNavigationWidgets } from './NavbarNavigationWidgets';
export { default as PortfolioValueNavigationView } from './PortfolioValueNavigationView';
export { default as ProfitOverTimeNavigationView } from './ProfitOverTimeNavigationView';
export { default as WatchlistNavigationView } from './WatchlistNavigationView';
