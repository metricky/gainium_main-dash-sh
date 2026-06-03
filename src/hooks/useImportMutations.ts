import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { exchangeQueries } from '@/lib/api/GraphQLQueries-exchange-queries';
import { botQueries } from '@/lib/api/GraphQLQueries-bot-queries';
import { GraphQLClient, type ReturnResult } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { isCoinmExchange, isFuturesExchange } from '@/utils/exchangeUtils';
import {
  StrategyEnum,
  OrderTypeEnum,
  StartConditionEnum,
  CloseConditionEnum,
  DCATypeEnum,
  OrderSizeTypeEnum,
  BotMarginTypeEnum,
  TerminalDealTypeEnum,
  CloseDCATypeEnum,
  type ExchangeEnum,
  type DCABot,
} from '@/types';
import type { Order, Position } from '@/types/bots/trading';

interface DealResult {
  status: 'OK' | 'NOTOK';
  reason?: string;
  data?: unknown;
}

export interface UseImportMutationsReturn {
  importOrderMutation: UseMutationResult<
    unknown,
    Error,
    {
      orderId: string;
      symbol: string;
      exchangeUUID: string;
      newBotSettings: {
        symbol: string;
        baseAsset: string;
        quoteAsset: string;
        price: string;
        quantity: string;
        side: string;
      };
    }
  >;
  importPositionMutation: UseMutationResult<unknown, Error, Position>;
  cancelOrderMutation: UseMutationResult<
    unknown,
    Error,
    {
      orderId: string;
      symbol: string;
      exchangeUUID: string;
    }
  >;
  cancelPositionMutation: UseMutationResult<
    unknown,
    Error,
    {
      positionId: string;
      exchangeUUID: string;
    }
  >;
  closeDealMutation: UseMutationResult<
    unknown,
    Error,
    { botId: string; dealId: string }
  >;
  handleImportOrder: (order: Order) => void;
  handleImportPosition: (position: Position) => void;
  handleCancelOrder: (order: Order) => void; // branches deal vs order
  handleCancelPosition: (position: Position) => void;
}

/**
 * Mutations for the Trading Terminal "Exchange" tab — import/cancel raw
 * exchange orders & positions, ported from the legacy `TradingPositions`.
 *
 * Each call builds a fresh `GraphQLClient` carrying the current token + the
 * paper-context flag (live/paper sensitive), mirroring `useDealActions` /
 * `useBotMutations`. The optional `onSuccess` callback lets the panel refetch
 * the active tab after every action (legacy refetched after each one).
 */
export const useImportMutations = (opts?: {
  onSuccess?: () => void;
}): UseImportMutationsReturn => {
  const { tokens } = useAuthStore();
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);
  const endpoint =
    import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
  // Per-call client carries token + paper-context header (live/paper sensitive).
  const client = new GraphQLClient(
    endpoint,
    tokens?.accessToken,
    !isLiveTrading
  );
  const refetch = () => opts?.onSuccess?.();

  // ---- Import order (server builds bot from newBotSettings) ----
  const importOrderMutation = useMutation({
    mutationFn: async (params: {
      orderId: string;
      symbol: string;
      exchangeUUID: string;
      newBotSettings: {
        symbol: string;
        baseAsset: string;
        quoteAsset: string;
        price: string;
        quantity: string;
        side: string;
      };
    }) => {
      const { query, variables } = exchangeQueries.importExchangeOrder(params);
      const res = await client.request<{ importExchangeOrder: DealResult }>(
        query,
        variables
      );
      if (res.importExchangeOrder.status !== 'OK') {
        throw new Error(
          res.importExchangeOrder.reason || 'Failed to import order'
        );
      }
      return res.importExchangeOrder;
    },
    onSuccess: () => {
      toast.success(
        'Order successfully imported, it may take some time for orders to be updated in the list'
      );
      refetch();
    },
    onError: (e: Error) =>
      toast.error(
        `Failed to import order. Reason ${e?.message || 'Unknown error'}`
      ),
  });

  // ---- Import position (createDCABot; no dedicated mutation) ----
  const importPositionMutation = useMutation({
    mutationFn: async (position: Position) => {
      // next-midnight (legacy: new Date(); date.setHours(24, 0, 0))
      const date = new Date();
      date.setHours(24, 0, 0);
      const {
        quantity,
        price,
        exchange,
        exchangeUUID,
        side,
        symbol,
        marginType,
        leverage,
        baseAssetName,
        quoteAssetName,
        positionId,
      } = position;
      // COIN-M -> abs(quantity); otherwise -> abs(quantity * price)
      const orderSize = `${Math.abs(
        +(isCoinmExchange(exchange) ? quantity : `${+quantity * +price}`)
      )}`;
      // strategy: LONG/SHORT explicit, else quantity-sign fallback
      const strategy =
        side === 'LONG'
          ? StrategyEnum.long
          : side === 'SHORT'
            ? StrategyEnum.short
            : +quantity > 0
              ? StrategyEnum.long
              : StrategyEnum.short;

      const { query, variables } = botQueries.createDCABot({
        pair: [symbol],
        name: '',
        strategy,
        profitCurrency: 'quote',
        baseOrderSize: orderSize,
        startOrderType: OrderTypeEnum.limit,
        startCondition: StartConditionEnum.asap,
        tpPerc: '1',
        orderFixedIn: 'base',
        orderSize,
        step: '1',
        ordersCount: 5,
        activeOrdersCount: 1,
        volumeScale: '1',
        stepScale: '1',
        useTp: false,
        useSl: false,
        slPerc: '-10',
        useSmartOrders: false,
        minOpenDeal: '',
        maxOpenDeal: '',
        useDca: false,
        hodlDay: '7',
        hodlAt: '15:00:00',
        hodlNextBuy: date.getTime(),
        maxNumberOfOpenDeals: '',
        indicators: [],
        baseOrderPrice: price,
        orderSizeType: OrderSizeTypeEnum.quote,
        limitTimeout: '20',
        useLimitTimeout: false,
        type: DCATypeEnum.terminal,
        moveSL: false,
        moveSLTrigger: '0.5',
        moveSLValue: '0.2',
        dealCloseCondition: CloseConditionEnum.tp,
        dealCloseConditionSL: CloseConditionEnum.tp,
        terminalDealType: TerminalDealTypeEnum.import,
        trailingTpPerc: '0.3',
        useMultiTp: false,
        multiTp: [],
        useMultiSl: false,
        multiSl: [],
        marginType: marginType as BotMarginTypeEnum,
        leverage: +leverage,
        futures: isFuturesExchange(exchange),
        coinm: isCoinmExchange(exchange),
        useLimitPrice: true,
        baseAsset: [baseAssetName],
        quoteAsset: [quoteAssetName],
        exchange: exchange as ExchangeEnum,
        exchangeUUID,
        importFrom: positionId,
        indicatorGroups: [],
        vars: { list: [], paths: [] },
      });
      const res = await client.request<{ createDCABot: ReturnResult<DCABot> }>(
        query,
        variables
      );
      if (res.createDCABot.status !== 'OK') {
        throw new Error(res.createDCABot.reason || 'Failed to import position');
      }
      return res.createDCABot.data;
    },
    onSuccess: () => {
      toast.success(
        'Deal successfully imported, it may take some time for orders to be updated in the list'
      );
      refetch();
    },
    onError: (e: Error) =>
      toast.error(`Deal wasn't created. Reason ${e?.message || 'Unknown error'}`),
  });

  // ---- Cancel raw order on exchange ----
  const cancelOrderMutation = useMutation({
    mutationFn: async (p: {
      orderId: string;
      symbol: string;
      exchangeUUID: string;
    }) => {
      const { query, variables } = exchangeQueries.closeOrderOnExchange(p);
      const res = await client.request<{ closeOrderOnExchange: DealResult }>(
        query,
        variables
      );
      if (res.closeOrderOnExchange.status !== 'OK') {
        throw new Error(
          res.closeOrderOnExchange.reason || 'Failed to cancel order'
        );
      }
      return res.closeOrderOnExchange;
    },
    onSuccess: (res) => {
      const data = (res as DealResult).data;
      toast.info(
        `Order canceled: ${data}, it may take some time for orders to be updated in the list`
      );
      refetch();
    },
    onError: (e: Error) => toast.error(e?.message || 'Failed to cancel order'),
  });

  // ---- Close raw position on exchange ----
  const cancelPositionMutation = useMutation({
    mutationFn: async (p: { positionId: string; exchangeUUID: string }) => {
      const { query, variables } = exchangeQueries.closePositionOnExchange(p);
      const res = await client.request<{ closePositionOnExchange: DealResult }>(
        query,
        variables
      );
      if (res.closePositionOnExchange.status !== 'OK') {
        throw new Error(
          res.closePositionOnExchange.reason || 'Failed to cancel position'
        );
      }
      return res.closePositionOnExchange;
    },
    onSuccess: (res) => {
      const data = (res as DealResult).data;
      toast.info(
        `Position canceled: ${data}, it may take some time for orders to be updated in the list`
      );
      refetch();
    },
    onError: (e: Error) =>
      toast.error(e?.message || 'Failed to cancel position'),
  });

  // ---- Cancel deal (orders-Cancel branch when botId && dealId) ----
  const closeDealMutation = useMutation({
    mutationFn: async (p: { botId: string; dealId: string }) => {
      const { query, variables } = botQueries.closeDCADeal({
        botId: p.botId,
        dealId: p.dealId,
        type: CloseDCATypeEnum.cancel,
      });
      const res = await client.request<{ closeDCADeal: DealResult }>(
        query,
        variables
      );
      if (res.closeDCADeal.status !== 'OK') {
        throw new Error(res.closeDCADeal.reason || 'Failed to close deal');
      }
      return res.closeDCADeal;
    },
    onSuccess: () => {
      toast.info(
        'Deal closed. It may take some time for orders to be updated in the list'
      );
      refetch();
    },
    onError: (e: Error) => toast.error(e?.message || 'Failed to close deal'),
  });

  // ---- Handlers (replicate legacy guards/branches) ----
  const handleImportOrder = (order: Order) => {
    if (!order.baseAssetName || !order.quoteAssetName) return; // legacy: silent return
    importOrderMutation.mutate({
      orderId: order.orderId,
      symbol: order.symbol,
      exchangeUUID: order.exchangeUUID,
      newBotSettings: {
        symbol: order.symbol,
        baseAsset: order.baseAssetName,
        quoteAsset: order.quoteAssetName,
        price: order.price,
        quantity: order.quantity,
        side: order.side,
      },
    });
  };

  const handleImportPosition = (position: Position) => {
    if (!position.baseAssetName || !position.quoteAssetName) return; // legacy guard
    importPositionMutation.mutate(position);
  };

  const handleCancelOrder = (order: Order) => {
    // legacy branch: botId && dealId -> closeDeal; else cancelOrder
    const dealId = (order as Order & { dealId?: string }).dealId;
    if (order.botId && dealId) {
      closeDealMutation.mutate({ botId: order.botId, dealId });
    } else {
      cancelOrderMutation.mutate({
        orderId: order.orderId,
        symbol: order.symbol,
        exchangeUUID: order.exchangeUUID,
      });
    }
  };

  const handleCancelPosition = (position: Position) =>
    cancelPositionMutation.mutate({
      positionId: position.positionId,
      exchangeUUID: position.exchangeUUID,
    });

  return {
    importOrderMutation,
    importPositionMutation,
    cancelOrderMutation,
    cancelPositionMutation,
    closeDealMutation,
    handleImportOrder,
    handleImportPosition,
    handleCancelOrder,
    handleCancelPosition,
  };
};
