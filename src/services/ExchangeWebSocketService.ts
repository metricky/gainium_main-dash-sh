/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/loggerInstance';
import { ExchangeEnum } from '@/types';

export interface PriceUpdate {
  symbol: string;
  price: number;
  exchange: string;
  change24h?: number;
  changePercent24h?: number;
  volume24h?: number;
  timestamp: number;
}

export interface TradingPair {
  pair: string;
  exchange: string;
  baseAsset: {
    name: string;
    minAmount: number;
    maxAmount: number;
    step: number;
  };
  quoteAsset: {
    name: string;
    minAmount: number;
  };
  priceAssetPrecision: number;
  crossAvailable: boolean;
}

type PriceUpdateCallback = (update: PriceUpdate) => void;

interface SubscriptionInfo {
  symbol: string;
  exchange: string;
  callback: PriceUpdateCallback;
}

export class ExchangeWebSocketService {
  private static instance: ExchangeWebSocketService;
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, SubscriptionInfo[]> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private pingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  private constructor() {}

  public static getInstance(): ExchangeWebSocketService {
    if (!ExchangeWebSocketService.instance) {
      ExchangeWebSocketService.instance = new ExchangeWebSocketService();
    }
    return ExchangeWebSocketService.instance;
  }

  public subscribe(
    pair: TradingPair,
    callback: PriceUpdateCallback
  ): () => void {
    const key = `${pair.exchange}_${pair.pair}`;

    logger.debug('[ExchangeWebSocketService] Subscribe called:', {
      pair: pair.pair,
      exchange: pair.exchange,
      key,
    });

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }

    const subscriptions = this.subscriptions.get(key) ?? [];
    subscriptions.push({
      symbol: pair.pair,
      exchange: pair.exchange,
      callback,
    });

    // Start WebSocket connection for this exchange if not already connected
    logger.debug(
      '[ExchangeWebSocketService] About to connect to exchange:',
      pair.exchange
    );
    this.connectToExchange(pair.exchange);

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(key);
      if (subs) {
        const index = subs.findIndex((s) => s.callback === callback);
        if (index >= 0) {
          subs.splice(index, 1);

          // If no more subscriptions for this symbol, we could optionally close the connection
          if (subs.length === 0) {
            this.subscriptions.delete(key);
            logger.debug(
              '[ExchangeWebSocketService] No more subscriptions for:',
              key
            );
          }
        }
      }
    };
  }

  private connectToExchange(exchange: string): void {
    logger.debug(
      '[ExchangeWebSocketService] connectToExchange called with:',
      exchange
    );

    // Remove paper prefix for connection
    const realExchange = exchange.startsWith('paper')
      ? (exchange.replace(/^paper([A-Z])/, (_, firstLetter) =>
          firstLetter.toLowerCase()
        ) as ExchangeEnum)
      : (exchange as ExchangeEnum);

    logger.debug(
      '[ExchangeWebSocketService] Real exchange determined:',
      realExchange
    );

    if (this.connections.has(realExchange)) {
      logger.debug(
        '[ExchangeWebSocketService] Already connected to:',
        realExchange
      );
      return; // Already connected
    }

    const wsUrl = this.getWebSocketUrl(realExchange);
    logger.debug('[ExchangeWebSocketService] WebSocket URL determined:', {
      realExchange,
      wsUrl,
    });

    if (!wsUrl) {
      logger.warn(
        '[ExchangeWebSocketService] No WebSocket URL for exchange:',
        realExchange
      );
      return;
    }

    logger.debug('[ExchangeWebSocketService] Connecting to:', {
      exchange: realExchange,
      url: wsUrl,
    });

    const ws = new WebSocket(wsUrl);
    this.connections.set(realExchange, ws);

    // Add a timeout to detect if connection never opens
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.error(
          '[ExchangeWebSocketService] Connection timeout for:',
          realExchange
        );
        logger.error('[ExchangeWebSocketService] Connection timeout');
        ws.close();
      }
    }, 15000); // Increased timeout to 15 seconds for Bybit

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      logger.info(
        '[ExchangeWebSocketService] *** WebSocket OPENED for:',
        realExchange
      );
      logger.debug('[ExchangeWebSocketService] Connected to:', realExchange);
      this.reconnectAttempts.set(realExchange, 0);

      // Set up ping/pong handling for maintaining connections
      if (
        realExchange === ExchangeEnum.binance ||
        realExchange === ExchangeEnum.binanceUS
      ) {
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ method: 'PING', id: Date.now() }));
          }
        }, 30000);

        this.pingIntervals.set(realExchange, pingInterval);
      } else if (realExchange === ExchangeEnum.bybit) {
        // Send initial ping to Bybit after connection
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            logger.info(
              '[ExchangeWebSocketService] Sending initial ping to Bybit'
            );
            ws.send(JSON.stringify({ op: 'ping' }));
          }
        }, 1000);

        // Bybit ping/pong mechanism
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            logger.info('[ExchangeWebSocketService] Sending ping to Bybit');
            ws.send(JSON.stringify({ op: 'ping' }));
          }
        }, 20000); // Bybit recommends every 20 seconds

        this.pingIntervals.set(realExchange, pingInterval);
      }

      this.subscribeToSymbols(realExchange, ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle PONG responses from Binance
        if (data.result === null && data.id) {
          return; // Don't process PONG responses further
        }

        this.handlePriceUpdate(realExchange, data);
      } catch (error) {
        logger.error(
          '[ExchangeWebSocketService] Error parsing message:',
          error
        );
      }
    };

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);

      // Clear ping interval if it exists
      const pingInterval = this.pingIntervals.get(realExchange);
      if (pingInterval) {
        clearInterval(pingInterval);
        this.pingIntervals.delete(realExchange);
      }

      console.warn(
        '[ExchangeWebSocketService] *** WebSocket CLOSED for:',
        realExchange,
        'Code:',
        event.code,
        'Reason:',
        event.reason
      );

      // Provide more specific error messages for common Bybit issues
      if (realExchange === ExchangeEnum.bybit) {
        if (event.code === 1006) {
          console.warn(
            '[ExchangeWebSocketService] Bybit connection closed abnormally (1006). This often indicates network issues or server problems.'
          );
        } else if (event.code === 1002) {
          console.warn(
            '[ExchangeWebSocketService] Bybit connection closed due to protocol error.'
          );
        } else if (event.code === 1003) {
          console.warn(
            '[ExchangeWebSocketService] Bybit connection closed due to unsupported data.'
          );
        }
      }

      logger.warn('[ExchangeWebSocketService] Connection closed:', {
        exchange: realExchange,
        code: event.code,
        reason: event.reason,
      });
      this.connections.delete(realExchange);
      this.handleReconnect(realExchange);
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      console.error(
        '[ExchangeWebSocketService] *** WebSocket ERROR for:',
        realExchange,
        error
      );
      logger.error('[ExchangeWebSocketService] WebSocket error:', {
        exchange: realExchange,
        error,
      });
    };
  }

  private getWebSocketUrl(exchange: ExchangeEnum): string | null {
    switch (exchange) {
      case ExchangeEnum.binance:
        // Try the data-stream endpoint first (market data only, might be more reliable)
        // Alternative: 'wss://stream.binance.com:443/ws'
        return 'wss://data-stream.binance.vision/ws';
      case ExchangeEnum.binanceUS:
        return 'wss://stream.binance.us:443/ws';
      case ExchangeEnum.kucoin:
        // Note: KuCoin requires token-based auth, we'll need to implement that separately
        return null;
      case ExchangeEnum.bybit:
        // Main Bybit V5 public WebSocket for spot trading
        return 'wss://stream.bybit.com/v5/public/spot';
      default:
        return null;
    }
  }

  private subscribeToSymbols(exchange: ExchangeEnum, ws: WebSocket): void {
    logger.debug(
      '[ExchangeWebSocketService] subscribeToSymbols called for:',
      exchange
    );

    // Get all symbols for this exchange
    const symbols: string[] = [];

    for (const [key, subscriptions] of this.subscriptions.entries()) {
      if (
        key.startsWith(exchange) ||
        key.startsWith(
          `paper${exchange.charAt(0).toUpperCase()}${exchange.slice(1)}`
        )
      ) {
        subscriptions.forEach((sub) => {
          if (!symbols.includes(sub.symbol)) {
            symbols.push(sub.symbol);
          }
        });
      }
    }

    if (symbols.length === 0) {
      logger.warn(
        '[ExchangeWebSocketService] No symbols to subscribe for exchange:',
        exchange
      );
      return;
    }

    logger.debug('[ExchangeWebSocketService] Subscribing to symbols:', {
      exchange,
      symbols,
    });

    switch (exchange) {
      case ExchangeEnum.binance:
      case ExchangeEnum.binanceUS:
        this.subscribeBinance(ws, symbols);
        break;
      case ExchangeEnum.bybit:
        this.subscribeBybit(ws, symbols);
        break;
      default:
        logger.warn(
          '[ExchangeWebSocketService] Subscription not implemented for:',
          exchange
        );
    }
  }

  private subscribeBinance(ws: WebSocket, symbols: string[]): void {
    logger.debug(
      '[ExchangeWebSocketService] Subscribing to Binance symbols:',
      symbols
    );

    // Subscribe to individual symbol ticker streams using 24hrTicker format
    const streams = symbols.map((symbol) => `${symbol.toLowerCase()}@ticker`);

    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now(),
    };

    try {
      ws.send(JSON.stringify(subscribeMessage));
      logger.debug(
        '[ExchangeWebSocketService] Sent Binance subscription:',
        streams
      );
    } catch (error) {
      logger.error(
        '[ExchangeWebSocketService] Error sending Binance subscription:',
        error
      );
    }
  }

  private subscribeBybit(ws: WebSocket, symbols: string[]): void {
    logger.debug(
      '[ExchangeWebSocketService] Subscribing to Bybit symbols:',
      symbols
    );

    // Bybit V5 subscription format for ticker data
    const subscribeMessage = {
      op: 'subscribe',
      args: symbols.map((symbol) => `tickers.${symbol}`),
    };

    logger.info(
      '[ExchangeWebSocketService] Bybit subscription message:',
      subscribeMessage
    );

    try {
      ws.send(JSON.stringify(subscribeMessage));
      logger.debug(
        '[ExchangeWebSocketService] Sent Bybit subscription:',
        symbols
      );
    } catch (error) {
      logger.error(
        '[ExchangeWebSocketService] Error sending Bybit subscription:',
        error
      );
    }
  }

  private handlePriceUpdate(exchange: ExchangeEnum, data: any): void {
    let priceUpdate: PriceUpdate | null = null;

    switch (exchange) {
      case ExchangeEnum.binance:
      case ExchangeEnum.binanceUS:
        priceUpdate = this.parseBinanceUpdate(data, exchange);
        break;
      case ExchangeEnum.bybit:
        priceUpdate = this.parseBybitUpdate(data, exchange);
        break;
      default:
        return;
    }

    if (priceUpdate) {
      this.notifySubscribers(priceUpdate);
    }
  }

  private parseBinanceUpdate(
    data: any,
    exchange: ExchangeEnum
  ): PriceUpdate | null {
    // Binance 24hrTicker stream format
    if (data.e === '24hrTicker') {
      const update = {
        symbol: data.s,
        price: parseFloat(data.c),
        exchange,
        change24h: parseFloat(data.p),
        changePercent24h: parseFloat(data.P),
        volume24h: parseFloat(data.v),
        timestamp: Date.now(),
      };
      return update;
    }

    return null;
  }

  private parseBybitUpdate(
    data: any,
    exchange: ExchangeEnum
  ): PriceUpdate | null {
    // Bybit V5 ticker stream format
    if (data.topic && data.topic.startsWith('tickers.') && data.data) {
      const ticker = data.data;

      // Calculate absolute change from percentage
      const currentPrice = parseFloat(ticker.lastPrice);
      const changePercent = parseFloat(ticker.price24hPcnt);
      const change24h = (currentPrice * changePercent) / 100;

      return {
        symbol: ticker.symbol,
        price: currentPrice,
        exchange,
        change24h: change24h,
        changePercent24h: changePercent,
        volume24h: parseFloat(ticker.volume24h || '0'),
        timestamp: Date.now(),
      };
    }

    // Handle subscription confirmation
    if (data.success && data.op === 'subscribe') {
      logger.debug(
        '[ExchangeWebSocketService] Bybit subscription confirmed:',
        data
      );
      return null;
    }

    // Handle connection pong responses
    if (data.op === 'pong') {
      logger.debug('[ExchangeWebSocketService] Bybit pong received');
      return null;
    }

    logger.debug(
      '[ExchangeWebSocketService] Unknown Bybit message format:',
      data
    );
    return null;
  }

  private notifySubscribers(update: PriceUpdate): void {
    const keys = [
      `${update.exchange}_${update.symbol}`,
      `paper${update.exchange.charAt(0).toUpperCase()}${update.exchange.slice(1)}_${update.symbol}`,
    ];

    keys.forEach((key) => {
      const subscriptions = this.subscriptions.get(key);

      if (subscriptions) {
        subscriptions.forEach((sub) => {
          try {
            sub.callback(update);
          } catch (error) {
            logger.error(
              '[ExchangeWebSocketService] Error in callback:',
              error
            );
          }
        });
      }
    });
  }

  private handleReconnect(exchange: ExchangeEnum): void {
    const attempts = this.reconnectAttempts.get(exchange) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      logger.error(
        '[ExchangeWebSocketService] Max reconnection attempts reached for:',
        exchange
      );

      // For Bybit, try a different approach after max attempts
      if (exchange === ExchangeEnum.bybit) {
        logger.info(
          '[ExchangeWebSocketService] Trying alternative approach for Bybit...'
        );
        // Reset attempts and try with a longer delay
        this.reconnectAttempts.set(exchange, 0);
        setTimeout(() => {
          this.connectToExchange(exchange);
        }, 30000); // Wait 30 seconds before trying again
      }
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts);
    this.reconnectAttempts.set(exchange, attempts + 1);

    logger.debug('[ExchangeWebSocketService] Reconnecting in:', {
      exchange,
      delay,
      attempt: attempts + 1,
    });

    setTimeout(() => {
      this.connectToExchange(exchange);
    }, delay);
  }

  public disconnect(): void {
    this.connections.forEach((ws, exchange) => {
      ws.close();
      logger.debug('[ExchangeWebSocketService] Disconnected from:', exchange);
    });

    // Clear all ping intervals
    this.pingIntervals.forEach((interval) => {
      clearInterval(interval);
    });

    this.connections.clear();
    this.subscriptions.clear();
    this.reconnectAttempts.clear();
    this.pingIntervals.clear();
  }

  public getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.connections.forEach((ws, exchange) => {
      status[exchange] = ws.readyState === WebSocket.OPEN;
    });
    return status;
  }
}
