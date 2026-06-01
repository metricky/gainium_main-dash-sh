import React from 'react';
import {
  useWidgetSettings,
  type ChartWidgetSettings,
} from '../../../hooks/useWidgetSettings';
import WidgetWrapper, { type WidgetMenuActions } from '../WidgetWrapper';
import TradingViewChart from '../shared/TradingViewChart/TradingViewChart';

// Define TradingChart-specific settings that extend ChartWidgetSettings
export interface TradingChartWidgetSettings extends ChartWidgetSettings {
  symbol: string;
  interval: string;
  buyPrice: number;
}

export interface TradingChartProps {
  widgetId?: string;
  isEditable?: boolean;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: WidgetMenuActions;
  data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  symbol?: string;
  interval?: string;
  buyPrice?: number;
  onBuyPriceChange?: (price: number) => void;
}

const TradingChart: React.FC<TradingChartProps> = ({
  widgetId = 'trading-chart',
  isEditable = false,
  onCollapse,
  onTabMove,
  menuActions,
  data,
  settings,
  symbol: propSymbol,
  interval: propInterval,
}) => {
  // Use the generic widget settings hook with type safety
  const { usePersistedState } =
    useWidgetSettings<TradingChartWidgetSettings>(widgetId);

  // Extract chart configuration from data, settings, and props (props take precedence)
  const defaultSymbol =
    propSymbol ||
    (data?.['symbol'] as string) ||
    (settings?.['symbol'] as string) ||
    'BINANCE:BTCUSDT';
  const defaultInterval =
    propInterval ||
    (data?.['interval'] as string) ||
    (settings?.['interval'] as string) ||
    '60';

  // Persisted settings for this widget instance
  const [symbol] = usePersistedState('symbol', defaultSymbol);
  const [interval] = usePersistedState('interval', defaultInterval);

  return (
    <WidgetWrapper
      metadata={{
        id: widgetId,
        type: 'trading-chart',
        title: 'Trading Chart',
        hasOptions: true,
        value: {
          primary: symbol.replace('BINANCE:', ''),
          secondary: interval,
        },
      }}
      noPadding
      isEditable={isEditable}
      {...(onCollapse && { onCollapse })}
      {...(onTabMove && { onTabMove })}
      {...(menuActions && { menuActions })}
      registry="trading"
    >
      <TradingViewChart
        symbol={symbol}
        interval={interval}
        widgetId={widgetId}
      />
    </WidgetWrapper>
  );
};

export default TradingChart;
