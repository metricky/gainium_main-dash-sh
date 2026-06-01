import React, { useCallback, useMemo } from 'react';
import {
  useWidgetSettings,
  type ChartWidgetSettings,
} from '../../../hooks/useWidgetSettings';
import logger from '../../../lib/loggerInstance';
import { useWidgetSettingsStore } from '../../../stores/widgetSettingsStore';
import { ExchangeEnum, type Symbols } from '../../../types';
import TradingViewChart from '../shared/TradingViewChart/TradingViewChart';
import WidgetWrapper, { type WidgetMenuActions } from '../WidgetWrapper';
import { getWidgetMetadata } from './index';
import { useTradingPairsFromContext } from '@/contexts/ExchangeDataContext';

// Define CoinChart-specific settings that extend ChartWidgetSettings
export interface CoinChartWidgetSettings extends ChartWidgetSettings {
  symbol: string;
  interval: string;
  buyPrice: number;
  layoutId: string | null;
  layoutName: string | null;
}

export interface CoinChartProps {
  widgetId?: string;
  isEditable?: boolean;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: WidgetMenuActions;
  symbol?: string;
  interval?: string;
  buyPrice?: number;
  onBuyPriceChange?: (price: number) => void;
}

const mapExchangeStringToEnum = (exchange: string): ExchangeEnum | null => {
  if (!exchange) {
    return null;
  }

  const normalized = exchange.toLowerCase();
  const match = (Object.values(ExchangeEnum) as string[]).find(
    (value) => value.toLowerCase() === normalized
  );

  return (match as ExchangeEnum) ?? null;
};

const CoinChart: React.FC<CoinChartProps> = ({
  widgetId = 'coin-chart',
  isEditable = false,
  onCollapse,
  onTabMove,
  menuActions,
  symbol: propSymbol = 'BTCUSDT@BINANCE',
  interval: propInterval = '1D',
  buyPrice: propBuyPrice = 50000,
  onBuyPriceChange: _onBuyPriceChange,
}) => {
  // Track if this is the initial load to prevent auto-save from overwriting saved settings
  const isInitialLoadRef = React.useRef(true);
  const hasUserChangedSymbolRef = React.useRef(false);

  // Debug: Log the widgetId to verify each instance has a unique ID
  logger.info('[CoinChart] Rendering with widgetId:', widgetId);

  // Use the generic widget settings hook with type safety
  const { setSetting } = useWidgetSettings<CoinChartWidgetSettings>(widgetId);

  // Subscribe to the Zustand store directly to get reactive values
  // This ensures values update when settings change
  const savedSymbol = useWidgetSettingsStore(
    useCallback(
      (state) => {
        const saved = state.settings[widgetId]?.['symbol'];
        // Return saved symbol if it exists and is valid
        if (saved && typeof saved === 'string' && saved.trim() !== '') {
          return saved as string;
        }
        return undefined;
      },
      [widgetId]
    )
  );

  // Use saved symbol if available, otherwise fall back to prop
  // This ensures we always have a valid symbol but prioritize saved state
  const symbol = savedSymbol ?? propSymbol;

  const interval = useWidgetSettingsStore(
    useCallback(
      (state) => {
        const saved = state.settings[widgetId]?.['interval'];
        // Ensure we never return an empty or null interval
        if (saved && typeof saved === 'string' && saved.trim() !== '') {
          return saved as string;
        }
        return propInterval;
      },
      [widgetId, propInterval]
    )
  );

  const layoutId = useWidgetSettingsStore(
    useCallback(
      (state) =>
        (state.settings[widgetId]?.['layoutId'] as string | null) ?? null,
      [widgetId]
    )
  );

  const layoutName = useWidgetSettingsStore(
    useCallback(
      (state) =>
        (state.settings[widgetId]?.['layoutName'] as string | null) ?? null,
      [widgetId]
    )
  );

  const {
    pairsByExchange,
    isLoading: _isPairsLoading,
    error: _pairsError,
  } = useTradingPairsFromContext();

  // Debug: Log the loaded symbol to verify persistence isolation
  logger.info(`[CoinChart ${widgetId}] Loaded symbol`, {
    symbol,
    interval,
    layoutId,
  });
  // Note: buyPrice functionality removed as TradingViewChart doesn't support it
  // const [buyPrice, setBuyPrice] = usePersistedState('buyPrice', propBuyPrice);

  const availableSymbols = useMemo<Symbols[]>(() => {
    if (!pairsByExchange) {
      return [];
    }

    const deduped = new Map<string, Symbols>();

    Object.values(pairsByExchange).forEach((pairs) => {
      pairs.forEach((pair) => {
        const exchangeEnum = mapExchangeStringToEnum(pair.exchange);
        if (!exchangeEnum) {
          return;
        }

        const key = `${pair.pair.toUpperCase()}@${(exchangeEnum as string).toLowerCase()}`;
        if (deduped.has(key)) {
          return;
        }

        deduped.set(key, {
          pair: pair.pair.toUpperCase(),
          exchange: exchangeEnum,
          baseAsset: { ...pair.baseAsset },
          quoteAsset: { ...pair.quoteAsset },
          maxOrders: 100,
          priceAssetPrecision: pair.priceAssetPrecision,
          crossAvailable: pair.crossAvailable,
        });
      });
    });

    return Array.from(deduped.values());
  }, [pairsByExchange]);

  // Handle symbol changes from the TradingView chart
  const handleSymbolChange = useCallback(
    (newSymbol: Symbols) => {
      // Update the persisted symbol when user selects a new symbol via TradingView's symbol search
      // Store the full symbol with exchange format for proper TradingView integration
      const fullSymbolName = `${newSymbol.pair}@${newSymbol.exchange.toUpperCase()}`;

      // During initial load, TradingView may trigger symbol changes from load_last_chart
      // We only want to save symbols that the user explicitly changed
      if (isInitialLoadRef.current) {
        logger.info(
          `[CoinChart ${widgetId}] Symbol change during initial load ignored`,
          { fullSymbolName }
        );
        // Mark that we've seen at least one symbol change callback
        // After a short delay, consider the chart "ready" for user interactions
        setTimeout(() => {
          isInitialLoadRef.current = false;
          logger.info(
            `[CoinChart ${widgetId}] Initial load complete, ready for user changes`
          );
        }, 1000); // Give the chart 1 second to settle after load_last_chart
        return;
      }

      if (fullSymbolName !== symbol) {
        logger.info(`[CoinChart ${widgetId}] User changed symbol`, {
          from: symbol,
          to: fullSymbolName,
        });
        hasUserChangedSymbolRef.current = true;
        setSetting('symbol', fullSymbolName);
      }
    },
    [symbol, widgetId, setSetting]
  );

  const handleLayoutChange = useCallback(
    (layout: { id: string; name?: string | null } | null) => {
      setSetting('layoutId', layout?.id ?? null);
      setSetting('layoutName', layout?.name ?? null);
    },
    [setSetting]
  );

  // Handle interval changes from the TradingView chart
  const handleIntervalChange = useCallback(
    (newInterval: string) => {
      // During initial load, TradingView may trigger interval changes from load_last_chart
      // We only want to save intervals that the user explicitly changed
      if (isInitialLoadRef.current) {
        logger.info(
          `[CoinChart ${widgetId}] Interval change during initial load ignored`,
          { newInterval }
        );
        return;
      }

      if (newInterval !== interval) {
        logger.info(`[CoinChart ${widgetId}] User changed interval`, {
          from: interval,
          to: newInterval,
        });
        setSetting('interval', newInterval);
      }
    },
    [interval, setSetting, widgetId]
  );

  // const handleBuyPriceChange = (newPrice: number) => {
  //   setBuyPrice(newPrice);
  //   if (onBuyPriceChange) {
  //     onBuyPriceChange(newPrice);
  //   }
  // };

  return (
    <WidgetWrapper
      metadata={{
        ...getWidgetMetadata('coin-chart'),
        id: widgetId,
        value: {
          primary: propBuyPrice || 0,
          secondary: 'Buy Price',
        },
      }}
      isEditable={isEditable}
      {...(onCollapse && { onCollapse })}
      {...(onTabMove && { onTabMove })}
      {...(menuActions && { menuActions })}
    >
      <TradingViewChart
        symbol={symbol}
        interval={interval}
        availableSymbols={availableSymbols}
        setOnChangeSymbol={handleSymbolChange}
        onIntervalChange={handleIntervalChange}
        widgetId={widgetId}
        initialLayoutId={layoutId}
        initialLayoutName={layoutName}
        onLayoutChange={handleLayoutChange}
      />
    </WidgetWrapper>
  );
};

export default CoinChart;
