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

// Bitget supported resolutions
const BITGET_RESOLUTIONS = [
  '1',
  '5',
  '15',
  '30',
  '60',
  '240',
  '360',
  '720',
  '1D',
  '3D',
  '1W',
  '1M',
] as const;

// Bitget resolution mapping
const BITGET_RESOLUTION_MAP: Record<string, string> = {
  '1': '1min',
  '5': '5min',
  '15': '15min',
  '30': '30min',
  '60': '1h',
  '240': '4h',
  '360': '6Hutc',
  '720': '12Hutc',
  '1D': '1Dutc',
  '3D': '3Dutc',
  '1W': '1Wutc',
  '1M': '1Mutc',
};

// Bitget configuration
const config: ExchangeConfig = {
  name: 'bitget',
  displayName: 'Bitget',
  supportedResolutions: [...BITGET_RESOLUTIONS],
  resolutionMap: BITGET_RESOLUTION_MAP,
  maxLimit: 200,
  websocketUrls: {
    spot: 'wss://ws.bitget.com/v2/ws/public',
    linear: 'wss://ws.bitget.com/v2/ws/public', // Same URL for Bitget
  },
};

// Bitget pagination logic (ascending order - oldest first, like Binance)
const paginationLogic: PaginationLogic = {
  shouldFetchMore: (
    bars: Bar[],
    periodParams: PeriodParams,
    limit: number
  ): boolean => {
    if (bars.length === 0) return false;
    if (bars.length < limit) return false;

    // For ascending order (oldest first), the oldest bar is the first one
    const oldestBarTime = bars[0].time;
    const requestedStartTime = periodParams.from * 1000;

    // If the oldest bar we have is still newer than the requested start time, fetch more
    // If oldestBarTime <= requestedStartTime, we have enough data
    return oldestBarTime > requestedStartTime;
  },

  getNextParams: (
    bars: Bar[],
    currentParams: PeriodParams
  ): PeriodParams | null => {
    if (bars.length === 0) return null;

    // For ascending order (oldest first), the oldest bar is the first one
    const oldestBarTime = bars[0].time;
    const requestedStartTime = currentParams.from * 1000;

    // If we need older data, set 'to' to just before the oldest bar we have
    if (oldestBarTime > requestedStartTime) {
      const nextParams = {
        ...currentParams,
        to: Math.floor(oldestBarTime / 1000) - 1,
      };

      return nextParams;
    }

    return null;
  },
};

// Convert Bitget interval to WebSocket format
const convertBitgetInterval = (interval: string): string => {
  const intervalMap: Record<string, string> = {
    '1min': 'candle1m',
    '5min': 'candle5m',
    '15min': 'candle15m',
    '30min': 'candle30m',
    '1h': 'candle1H',
    '4h': 'candle4H',
    '6Hutc': 'candle6Hutc',
    '12Hutc': 'candle12Hutc',
    '1Dutc': 'candle1Dutc',
    '3Dutc': 'candle3Dutc',
    '1Wutc': 'candle1Wutc',
    '1Mutc': 'candle1Mutc',
  };
  return intervalMap[interval] || 'candle1m';
};

// Market type detection for Bitget
const getBitgetMarketType = (exchange?: string): 'spot' | 'linear' => {
  if (!exchange) return 'spot';
  if (exchange.includes('linear')) return 'linear';
  return 'spot';
};

// Get Bitget instType based on market type
const getBitgetInstType = (marketType: 'spot' | 'linear'): string => {
  return marketType === 'linear' ? 'USDT-FUTURES' : 'SPOT';
};

// WebSocket subscription management
const subscriptions: Record<string, WebSocket> = {};

// Subscribe to Bitget WebSocket
const subscribe = async (
  symbolInfo: LibrarySymbolInfo,
  resolution: ResolutionString,
  onTick: SubscribeBarsCallback,
  listenerGuid: string
): Promise<void> => {
  try {
    const interval = config.resolutionMap[resolution] || '1min';

    // Detect market type from exchange
    const marketType = getBitgetMarketType(symbolInfo.exchange);
    const wsUrl = config.websocketUrls?.[marketType];
    const bitgetChannel = convertBitgetInterval(interval);
    const instType = getBitgetInstType(marketType);

    const ws = new WebSocket(wsUrl ?? '');

    ws.onopen = () => {
      // Subscribe to the kline channel
      const subscribeMessage = {
        op: 'subscribe',
        args: [
          {
            instType: instType,
            channel: bitgetChannel,
            instId: symbolInfo.name,
          },
        ],
      };
      ws.send(JSON.stringify(subscribeMessage));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.arg?.channel === bitgetChannel &&
          data.arg?.instId === symbolInfo.name &&
          data.data
        ) {
          const klineData = data.data[0];
          if (klineData && Array.isArray(klineData)) {
            const bar: Bar = {
              time: parseInt(klineData[0]), // timestamp
              open: parseFloat(klineData[1]),
              high: parseFloat(klineData[2]),
              low: parseFloat(klineData[3]),
              close: parseFloat(klineData[4]),
              volume: parseFloat(klineData[6]), // volume is at index 6 for Bitget
            };
            onTick(bar);
          }
        }
      } catch (error) {
        console.error('Error parsing Bitget WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Bitget WebSocket error:', error);
    };

    subscriptions[listenerGuid] = ws;
  } catch (error) {
    console.error('Error creating Bitget WebSocket connection:', error);
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

// Export Bitget exchange handler
export const bitgetHandler: ExchangeHandler = {
  config,
  paginationLogic,
  subscribe,
  unsubscribe,
};
