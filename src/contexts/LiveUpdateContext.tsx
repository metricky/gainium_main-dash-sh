/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  botWebSocketManager,
  type BotStatsUpdate,
  type OrderUpdate,
  type BalanceUpdate,
  type DealUpdate,
  type WebSocketEvent,
} from '@/services/websocket/BotWebSocketManager';
import type { CalculatedBotStats } from '@/services/metrics/BotMetricsCalculator';
import { logger } from '@/lib/loggerInstance';
import {
  useBotStatsStore,
  useOrderStore,
  useBalanceStore,
  useDealStore,
  useMessageStore,
  initializeSocketIntegration,
  cleanupSocketIntegration,
  type DealType,
} from '@/stores/live';
import type { BalanceData } from '@/stores/live/balanceStore';
import type { MessageData } from '@/stores/live/messageStore';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { LiveMessageToaster } from '@/components/live/LiveMessageToaster';
import { type OrderData, type DCADeals, BotTypesEnum } from '@/types';
import type { OrderType } from '@/stores/live/orderStore';

interface LiveUpdateContextType {
  // Connection status
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;

  // Store actions
  botStatsActions: {
    updateBotStats: (botId: string, stats: CalculatedBotStats) => void;
    updateBotStatsFromWebSocket: (update: BotStatsUpdate) => void;
    setBotStatsLoading: (botId: string, loading: boolean) => void;
    setBotStatsError: (botId: string, error: string | null) => void;
    clearBotStats: (botId: string) => void;
    clearAllBotStats: () => void;
  };

  orderActions: {
    updateOrder: (botId: string, order: OrderData, type: OrderType) => void;
    updateOrderFromWebSocket: (update: OrderUpdate, type: OrderType) => void;
    removeOrder: (botId: string, orderId: string, type: OrderType) => void;
    setOrderLoading: (botId: string, loading: boolean) => void;
    setOrderError: (botId: string, error: string | null) => void;
    clearOrders: (botId: string) => void;
    clearAllOrders: () => void;
  };

  balanceActions: {
    updateBalances: (balances: BalanceData[]) => void;
    updateBalanceFromWebSocket: (update: BalanceUpdate) => void;
    updateSingleBalance: (asset: string, balance: Partial<BalanceData>) => void;
    setBalanceLoading: (loading: boolean) => void;
    setBalanceError: (error: string | null) => void;
    clearBalances: () => void;
  };

  dealActions: {
    updateDeal: (botId: string, deal: DCADeals, dealType: DealType) => void;
    updateDealFromWebSocket: (update: DealUpdate, dealType: DealType) => void;
    removeDeal: (botId: string, dealId: string) => void;
    setDealLoading: (botId: string, loading: boolean) => void;
    setDealError: (botId: string, error: string | null) => void;
    clearDeals: (botId: string) => void;
    clearAllDeals: () => void;
  };

  messageActions: {
    addMessage: (
      message: Omit<MessageData, 'id' | 'timestamp' | 'dismissed'>
    ) => void;
    dismissMessage: (messageId: string) => void;
    clearMessages: () => void;
    clearBotMessages: (botId: string) => void;
  };

  // Store selectors
  botStatsSelectors: {
    getBotStats: (botId: string) => CalculatedBotStats | null;
    getAllBotStats: () => Record<string, CalculatedBotStats>;
    isBotStatsLoading: (botId: string) => boolean;
    getBotStatsError: (botId: string) => string | null;
  };

  orderSelectors: {
    getOrders: (botId: string) => OrderData[];
    getAllOrders: () => Record<string, OrderData[]>;
    getOrder: (botId: string, orderId: string) => OrderData | null;
    isOrderLoading: (botId: string) => boolean;
    getOrderError: (botId: string) => string | null;
  };

  balanceSelectors: {
    getBalances: () => BalanceData[];
    getBalance: (asset: string) => BalanceData | null;
    getTotalUsdValue: () => number;
    isBalanceLoading: () => boolean;
    getBalanceError: () => string | null;
  };

  dealSelectors: {
    getDeals: (botId: string) => DCADeals[];
    getAllDeals: () => Record<string, DCADeals[]>;
    getDeal: (botId: string, dealId: string) => DCADeals | null;
    getActiveDeals: (botId: string) => DCADeals[];
    getClosedDeals: (botId: string) => DCADeals[];
    isDealLoading: (botId: string) => boolean;
    getDealError: (botId: string) => string | null;
  };

  messageSelectors: {
    getMessages: () => MessageData[];
    getActiveMessages: () => MessageData[];
    getBotMessages: (botId: string) => MessageData[];
    getMessageById: (messageId: string) => MessageData | null;
    getUnreadCount: () => number;
  };
}

const LiveUpdateContext = createContext<LiveUpdateContextType | undefined>(
  undefined
);

interface LiveUpdateProviderProps {
  children: ReactNode;
}

export const LiveUpdateProvider: React.FC<LiveUpdateProviderProps> = ({
  children,
}) => {
  const hasInitializedRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { user, tokens, isAuthenticated } = useAuthStore();
  const tradingMode = useUIStore((state) => state.tradingMode);

  useEffect(() => {
    const paperContext = tradingMode === 'paper';
    botWebSocketManager.setPaperContext(paperContext);
    logger.debug(
      `[LiveUpdateContext] Setting paper context: ${paperContext} from trading mode: ${tradingMode}`
    );
  }, [tradingMode]);

  // Connect/disconnect WebSocket based on authentication status
  useEffect(() => {
    // Prevent duplicate initialization
    if (hasInitializedRef.current) return;

    if (isAuthenticated && user && tokens?.accessToken) {
      hasInitializedRef.current = true;

      // Set paper context based on trading mode
      // paperContext = true for paper trading, false for live/demo

      if (user.id) {
        botWebSocketManager.connect(user.id, tokens.accessToken);
      }

      // Initialize socket integration for new bot list stores
      // This connects dcaBotsStore, gridBotsStore, comboBotsStore, transactionsStore, minigridsStore
      initializeSocketIntegration();

      // Set up WebSocket event subscriptions to update stores
      // Bot stats updates
      botWebSocketManager.subscribe('bot stats update', {
        id: 'live-update-bot-stats',
        callback: (event: WebSocketEvent) => {
          // Server sends: { botId, data: { stats: BotStats, symbolStats?: BotSymbolsStats[] } }
          // We need to extract the stats object
          const serverData = event.data as Record<string, unknown>;
          if (!serverData['stats']) {
            console.warn(
              `📡 [LiveUpdateContext] No stats in bot stats update for bot ${event.botId}`
            );
            return;
          }

          const update: BotStatsUpdate = {
            botId: event.botId ?? '',
            data: serverData['stats'] as Record<string, unknown>,
          };
          useBotStatsStore.getState().updateBotStatsFromWebSocket(update);
        },
      });

      // Order updates
      botWebSocketManager.subscribe('data update', {
        id: 'live-update-orders',
        callback: (event: WebSocketEvent) => {
          if (
            event.data['status'] !== 'FILLED' &&
            event.data['status'] !== 'NEW'
          ) {
            useOrderStore
              .getState()
              .removeOrder(
                event.botId ?? '',
                event.data['clientOrderId'] as string,
                'new'
              );
            useOrderStore
              .getState()
              .removeOrder(
                event.botId ?? '',
                event.data['clientOrderId'] as string,
                'filled'
              );
            return;
          }
          const update: OrderUpdate = {
            botId: event.botId ?? '',
            data: event.data as Record<string, unknown>,
            paperContext: event.paperContext || false,
          };
          useOrderStore
            .getState()
            .updateOrderFromWebSocket(
              update,
              event.data['status'] === 'FILLED' ? 'filled' : 'new'
            );
        },
      });

      // Balance updates
      botWebSocketManager.subscribe('balance', {
        id: 'live-update-balance',
        callback: (event: WebSocketEvent) => {
          const update: BalanceUpdate = {
            data: (event.data as { balances: Record<string, unknown>[] })
              .balances,
          };
          useBalanceStore.getState().updateBalanceFromWebSocket(update);
        },
      });

      // Deal updates
      botWebSocketManager.subscribe('bot deal update', {
        id: 'live-update-deals',
        callback: (event: WebSocketEvent) => {
          const update: DealUpdate = {
            botId: event.botId ?? '',
            data: event.data as Record<string, unknown>,
            paperContext: event.paperContext || false,
          };
          useDealStore
            .getState()
            .updateDealFromWebSocket(
              update,
              event.botType === BotTypesEnum.combo ? 'combo' : 'dca'
            );
        },
      });

      // Bot messages
      botWebSocketManager.subscribe('bot sends message', {
        id: 'live-update-messages',
        callback: (event: WebSocketEvent) => {
          const data = event.data as Record<string, unknown>;
          useMessageStore.getState().addMessage({
            type: (data['type'] as string) || 'info',
            title: (data['botName'] as string) || 'Bot Message',
            message: (data['message'] as string) || '',
            botId: event.botId ?? '',
          });
          // The Notifications panel reads from the `getMessageBot` GraphQL
          // query (not from useMessageStore). Invalidate so the panel picks
          // up the new entry without a hard refresh.
          queryClient.invalidateQueries({ queryKey: ['getMessageBot'] });
        },
      });
    } else if (!isAuthenticated) {
      // Clean up socket integration on logout
      if (hasInitializedRef.current) {
        cleanupSocketIntegration();
        botWebSocketManager.disconnect();
        hasInitializedRef.current = false;
      }
    }

    // Cleanup function
    return () => {
      if (!isAuthenticated && hasInitializedRef.current) {
        cleanupSocketIntegration();
        botWebSocketManager.disconnect();
        hasInitializedRef.current = false;
      }
    };
  }, [isAuthenticated, user, tokens?.accessToken]);

  // Update paper context when trading mode changes
  useEffect(() => {
    if (isAuthenticated && botWebSocketManager.getIsConnected()) {
      const paperContext = tradingMode === 'paper';
      logger.info(
        '[LiveUpdateContext] Trading mode changed, updating paper context:',
        paperContext
      );
      botWebSocketManager.setPaperContext(paperContext);
    }
  }, [tradingMode, isAuthenticated]);

  const reconnect = useCallback(() => {
    setConnectionError(null);
    botWebSocketManager.connect();
  }, []);

  // Listen to WebSocket connection events instead of polling
  useEffect(() => {
    const subscriberId = 'live-update-connection-monitor';

    const handleConnectionEvent = (event: WebSocketEvent) => {
      if (event.type === 'connect') {
        logger.info('[LiveUpdateProvider] WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
      } else if (event.type === 'disconnect') {
        logger.warn('[LiveUpdateProvider] WebSocket disconnected');
        setIsConnected(false);
      }
    };

    const subscriber = {
      id: subscriberId,
      callback: handleConnectionEvent,
    };

    // Subscribe to connection events
    botWebSocketManager.subscribe('connect', subscriber);
    botWebSocketManager.subscribe('disconnect', subscriber);

    // Initial status check
    setIsConnected(botWebSocketManager.getIsConnected());

    return () => {
      botWebSocketManager.unsubscribe('connect', subscriberId);
      botWebSocketManager.unsubscribe('disconnect', subscriberId);
    };
  }, []);

  const contextValue: LiveUpdateContextType = {
    isConnected,
    connectionError,
    reconnect,

    botStatsActions: {
      updateBotStats: (botId: string, stats: CalculatedBotStats) =>
        useBotStatsStore.getState().updateBotStats(botId, stats),
      updateBotStatsFromWebSocket: (update: BotStatsUpdate) =>
        useBotStatsStore.getState().updateBotStatsFromWebSocket(update),
      setBotStatsLoading: (botId: string, loading: boolean) =>
        useBotStatsStore.getState().setBotStatsLoading(botId, loading),
      setBotStatsError: (botId: string, error: string | null) =>
        useBotStatsStore.getState().setBotStatsError(botId, error),
      clearBotStats: (botId: string) =>
        useBotStatsStore.getState().clearBotStats(botId),
      clearAllBotStats: () => useBotStatsStore.getState().clearAllBotStats(),
    },

    orderActions: {
      updateOrder: (botId: string, order: OrderData, type: OrderType) =>
        useOrderStore.getState().updateOrder(botId, order, type),
      updateOrderFromWebSocket: (update: OrderUpdate, type: OrderType) =>
        useOrderStore.getState().updateOrderFromWebSocket(update, type),
      removeOrder: (botId: string, orderId: string, type: OrderType) =>
        useOrderStore.getState().removeOrder(botId, orderId, type),
      setOrderLoading: (botId: string, loading: boolean) =>
        useOrderStore.getState().setOrderLoading(botId, loading),
      setOrderError: (botId: string, error: string | null) =>
        useOrderStore.getState().setOrderError(botId, error),
      clearOrders: (botId: string) =>
        useOrderStore.getState().clearOrders(botId),
      clearAllOrders: () => useOrderStore.getState().clearAllOrders(),
    },

    balanceActions: {
      updateBalances: (balances: BalanceData[]) =>
        useBalanceStore.getState().updateBalances(balances),
      updateBalanceFromWebSocket: (update: BalanceUpdate) =>
        useBalanceStore.getState().updateBalanceFromWebSocket(update),
      updateSingleBalance: (asset: string, balance: Partial<BalanceData>) =>
        useBalanceStore.getState().updateSingleBalance(asset, balance),
      setBalanceLoading: (loading: boolean) =>
        useBalanceStore.getState().setBalanceLoading(loading),
      setBalanceError: (error: string | null) =>
        useBalanceStore.getState().setBalanceError(error),
      clearBalances: () => useBalanceStore.getState().clearBalances(),
    },

    dealActions: {
      updateDeal: (botId: string, deal: DCADeals, dealType: DealType) =>
        useDealStore.getState().updateDeal(botId, deal, dealType),
      updateDealFromWebSocket: (update: DealUpdate, dealType: DealType) =>
        useDealStore.getState().updateDealFromWebSocket(update, dealType),
      removeDeal: (botId: string, dealId: string) =>
        useDealStore.getState().removeDeal(botId, dealId),
      setDealLoading: (botId: string, loading: boolean) =>
        useDealStore.getState().setDealLoading(botId, loading),
      setDealError: (botId: string, error: string | null) =>
        useDealStore.getState().setDealError(botId, error),
      clearDeals: (botId: string) => useDealStore.getState().clearDeals(botId),
      clearAllDeals: () => useDealStore.getState().clearAllDeals(),
    },

    messageActions: {
      addMessage: (
        message: Omit<MessageData, 'id' | 'timestamp' | 'dismissed'>
      ) => useMessageStore.getState().addMessage(message),
      dismissMessage: (messageId: string) =>
        useMessageStore.getState().dismissMessage(messageId),
      clearMessages: () => useMessageStore.getState().clearMessages(),
      clearBotMessages: (botId: string) =>
        useMessageStore.getState().clearBotMessages(botId),
    },

    botStatsSelectors: {
      getBotStats: useBotStatsStore((state) => state.getBotStats),
      getAllBotStats: useBotStatsStore((state) => state.getAllBotStats),
      isBotStatsLoading: useBotStatsStore((state) => state.isBotStatsLoading),
      getBotStatsError: useBotStatsStore((state) => state.getBotStatsError),
    },

    orderSelectors: {
      getOrders: useOrderStore((state) => state.getOrders),
      getAllOrders: useOrderStore((state) => state.getAllOrders),
      getOrder: useOrderStore((state) => state.getOrder),
      isOrderLoading: useOrderStore((state) => state.isOrderLoading),
      getOrderError: useOrderStore((state) => state.getOrderError),
    },

    balanceSelectors: {
      getBalances: useBalanceStore((state) => state.getBalances),
      getBalance: useBalanceStore((state) => state.getBalance),
      getTotalUsdValue: useBalanceStore((state) => state.getTotalUsdValue),
      isBalanceLoading: useBalanceStore((state) => state.isBalanceLoading),
      getBalanceError: useBalanceStore((state) => state.getBalanceError),
    },

    dealSelectors: {
      getDeals: useDealStore((state) => state.getDeals),
      getAllDeals: useDealStore((state) => state.getAllDeals),
      getDeal: useDealStore((state) => state.getDeal),
      getActiveDeals: useDealStore((state) => state.getActiveDeals),
      getClosedDeals: useDealStore((state) => state.getClosedDeals),
      isDealLoading: useDealStore((state) => state.isDealLoading),
      getDealError: useDealStore((state) => state.getDealError),
    },

    messageSelectors: {
      getMessages: useMessageStore((state) => state.getMessages),
      getActiveMessages: useMessageStore((state) => state.getActiveMessages),
      getBotMessages: useMessageStore((state) => state.getBotMessages),
      getMessageById: useMessageStore((state) => state.getMessageById),
      getUnreadCount: useMessageStore((state) => state.getUnreadCount),
    },
  };

  return (
    <LiveUpdateContext.Provider value={contextValue}>
      <LiveMessageToaster />
      {children}
    </LiveUpdateContext.Provider>
  );
};

export const useLiveUpdate = (): LiveUpdateContextType => {
  const context = useContext(LiveUpdateContext);
  if (!context) {
    throw new Error('useLiveUpdate must be used within a LiveUpdateProvider');
  }
  return context;
};
