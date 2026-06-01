import type {
  ExchangeHandler,
  ExchangeConfig,
  PaginationLogic,
  LibrarySymbolInfo,
  ResolutionString,
  SubscribeBarsCallback,
  Bar,
  PeriodParams,
} from '../types';

// Binance supported resolutions
const BINANCE_RESOLUTIONS = [
  '1',
  '3',
  '5',
  '15',
  '30',
  '60',
  '120',
  '240',
  '360',
  '480',
  '720',
  '1D',
  '3D',
  '1W',
  '1M',
] as const;

// Binance resolution mapping
const BINANCE_RESOLUTION_MAP: Record<string, string> = {
  '1': '1m',
  '3': '3m',
  '5': '5m',
  '15': '15m',
  '30': '30m',
  '60': '1h',
  '120': '2h',
  '240': '4h',
  '360': '6h',
  '480': '8h',
  '720': '12h',
  '1D': '1d',
  '3D': '3d',
  '1W': '1w',
  '1M': '1M',
};

// Binance configuration with multiple WebSocket URLs
const config: ExchangeConfig = {
  name: 'binance',
  displayName: 'Binance',
  supportedResolutions: [...BINANCE_RESOLUTIONS],
  resolutionMap: BINANCE_RESOLUTION_MAP,
  maxLimit: 1000,
  websocketUrls: {
    spot: 'wss://stream.binance.com:9443/ws',
    usdm: 'wss://fstream.binance.com/market/ws',
    coinm: 'wss://dstream.binance.com/ws',
  },
};

// Binance pagination logic
const paginationLogic: PaginationLogic = {
  shouldFetchMore: (
    bars: Bar[],
    periodParams: PeriodParams,
    limit: number
  ): boolean => {
    if (bars.length === 0) return false;
    if (bars.length < limit) return false;

    const lastBarTime = bars[bars.length - 1].time;
    const firstBarTime = bars[0].time;
    const requestedEndTime = periodParams.to * 1000;
    const requestedStartTime = periodParams.from * 1000;

    // For normal (ascending) order, check if we need more recent data
    if (lastBarTime < requestedEndTime) {
      return true;
    }

    // For some cases, check if we need older data
    if (firstBarTime > requestedStartTime) {
      return true;
    }

    return false;
  },

  getNextParams: (
    bars: Bar[],
    currentParams: PeriodParams
  ): PeriodParams | null => {
    if (bars.length === 0) return null;

    const lastBarTime = bars[bars.length - 1].time;
    const firstBarTime = bars[0].time;
    const requestedEndTime = currentParams.to * 1000;
    const requestedStartTime = currentParams.from * 1000;

    // If we need more recent data
    if (lastBarTime < requestedEndTime) {
      return {
        ...currentParams,
        from: lastBarTime / 1000 + 1,
      };
    }

    // If we need older data
    if (firstBarTime > requestedStartTime) {
      return {
        ...currentParams,
        to: firstBarTime / 1000 - 1,
      };
    }

    return null;
  },
};

// WebSocket subscription management
const subscriptions: Record<string, WebSocket> = {};

// Helper function to detect market type from exchange enum
const getMarketType = (exchangeEnum: string): 'spot' | 'usdm' | 'coinm' => {
  const exchange = exchangeEnum.toLowerCase();
  if (exchange.includes('usdm')) return 'usdm';
  if (exchange.includes('coinm')) return 'coinm';
  return 'spot';
};

// Subscribe to Binance WebSocket
const subscribe = async (
  symbolInfo: LibrarySymbolInfo,
  resolution: ResolutionString,
  onTick: SubscribeBarsCallback,
  listenerGuid: string
): Promise<void> => {
  try {
    const interval = config.resolutionMap[resolution] || '1m';

    // Detect market type from exchange
    const marketType = getMarketType(symbolInfo.exchange);
    const wsUrl = config.websocketUrls?.[marketType];

    const fullWsUrl = `${wsUrl}/${symbolInfo.name.toLowerCase()}@kline_${interval}`;

    const ws = new WebSocket(fullWsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.k) {
          const kline = data.k;
          const bar: Bar = {
            time: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
          };
          onTick(bar);
        }
      } catch (error) {
        console.error('Error parsing Binance WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
    };

    subscriptions[listenerGuid] = ws;
  } catch (error) {
    console.error('Error creating Binance WebSocket connection:', error);
  }
};

// Unsubscribe from WebSocket
const unsubscribe = (listenerGuid: string): void => {
  const ws = subscriptions[listenerGuid];
  if (ws) {
    ws.close();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete subscriptions[listenerGuid];
  }
};

// Export Binance exchange handler
export const binanceHandler: ExchangeHandler = {
  config,
  paginationLogic,
  subscribe,
  unsubscribe,
};
