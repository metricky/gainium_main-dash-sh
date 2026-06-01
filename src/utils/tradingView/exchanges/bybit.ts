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

// Bybit supported resolutions
const BYBIT_RESOLUTIONS = [
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
  '1W',
] as const;

// Bybit resolution mapping
const BYBIT_RESOLUTION_MAP: Record<string, string> = {
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
  '1W': '1w',
};

// Bybit configuration with multiple WebSocket URLs
const config: ExchangeConfig = {
  name: 'bybit',
  displayName: 'Bybit',
  supportedResolutions: [...BYBIT_RESOLUTIONS],
  resolutionMap: BYBIT_RESOLUTION_MAP,
  maxLimit: 1000,
  websocketUrls: {
    spot: 'wss://stream.bybit.com/v5/public/spot',
    linear: 'wss://stream.bybit.com/v5/public/linear',
    inverse: 'wss://stream.bybit.com/v5/public/inverse',
  },
};

// Bybit pagination logic (similar to Binance)
const paginationLogic: PaginationLogic = {
  shouldFetchMore: (
    bars: Bar[],
    periodParams: PeriodParams,
    limit: number
  ): boolean => {
    if (bars.length === 0) return false;
    if (bars.length < limit) return false;

    const firstBarTime = bars[0].time;
    const requestedStartTime = periodParams.from * 1000;

    // Bybit returns data in descending order, so check if we need older data
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

    const firstBarTime = bars[0].time;
    const requestedStartTime = currentParams.from * 1000;

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

// Helper function to detect market type from exchange enum
const getBybitMarketType = (
  exchangeEnum: string
): 'spot' | 'linear' | 'inverse' => {
  const exchange = exchangeEnum.toLowerCase();
  if (exchange.includes('linear') || exchange.includes('usdm')) return 'linear';
  if (exchange.includes('inverse') || exchange.includes('coinm'))
    return 'inverse';
  return 'spot';
};

// Convert Bybit interval format based on market type
const convertBybitInterval = (
  interval: string,
  marketType: 'spot' | 'linear' | 'inverse'
): string => {
  if (marketType === 'spot') {
    // Spot uses different format
    const intervalMap: Record<string, string> = {
      '1m': '1',
      '3m': '3',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '2h': '120',
      '4h': '240',
      '6h': '360',
      '8h': '480',
      '12h': '720',
      '1d': 'D',
      '1w': 'W',
    };
    return intervalMap[interval] || '1';
  } else {
    // Linear and Inverse futures use same format
    const intervalMap: Record<string, string> = {
      '1m': '1',
      '3m': '3',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '2h': '120',
      '4h': '240',
      '6h': '360',
      '8h': '480',
      '12h': '720',
      '1d': 'D',
      '1w': 'W',
    };
    return intervalMap[interval] || '1';
  }
};

// WebSocket subscription management
const subscriptions: Record<string, WebSocket> = {};

// Subscribe to Bybit WebSocket
const subscribe = async (
  symbolInfo: LibrarySymbolInfo,
  resolution: ResolutionString,
  onTick: SubscribeBarsCallback,
  listenerGuid: string
): Promise<void> => {
  try {
    const interval = config.resolutionMap[resolution] || '1m';

    // Detect market type from exchange
    const marketType = getBybitMarketType(symbolInfo.exchange);
    const wsUrl = config.websocketUrls?.[marketType];
    const bybitInterval = convertBybitInterval(interval, marketType);

    const ws = new WebSocket(wsUrl ?? '');

    ws.onopen = () => {
      const subscribeMessage = {
        op: 'subscribe',
        args: [`kline.${bybitInterval}.${symbolInfo.name}`],
      };

      ws.send(JSON.stringify(subscribeMessage));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.success) {
          return;
        }

        if (data.topic && data.topic.includes('kline') && data.data) {
          const klineData = data.data[0];
          if (klineData) {
            const bar: Bar = {
              time: parseInt(klineData.start),
              open: parseFloat(klineData.open),
              high: parseFloat(klineData.high),
              low: parseFloat(klineData.low),
              close: parseFloat(klineData.close),
              volume: parseFloat(klineData.volume),
            };
            onTick(bar);
          }
        }
      } catch (error) {
        console.error('Error parsing Bybit WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Bybit WebSocket error:', error);
    };

    subscriptions[listenerGuid] = ws;
  } catch (error) {
    console.error('Error creating Bybit WebSocket connection:', error);
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

// Export Bybit exchange handler
export const bybitHandler: ExchangeHandler = {
  config,
  paginationLogic,
  subscribe,
  unsubscribe,
};
