import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { exchangeQueries } from '../lib/api/GraphQLQueries-exchange-queries';
import { graphQLClient } from '../lib/api/GraphQLClient';
import type { Order, Position } from '@/types/bots/trading';

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
  handleImportOrder: (order: Order) => void;
  handleImportPosition: (position: Position) => void;
  handleCancelOrder: (order: Order) => void;
  handleCancelPosition: (position: Position) => void;
}

export const useImportMutations = (): UseImportMutationsReturn => {
  // Import order mutation
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
      return await graphQLClient.request(query, variables);
    },
    onSuccess: () => {
      toast.success('Order imported successfully!');
    },
    onError: (error: Error) => {
      toast.error(
        `Failed to import order: ${error?.message || 'Unknown error'}`
      );
    },
  });

  // Import position mutation (placeholder - not yet implemented)
  const importPositionMutation = useMutation({
    mutationFn: async (_position: Position) => {
      // This would be similar to the old dashboard logic for creating bots from positions
      // For now, we'll show a placeholder
      throw new Error('Position import not yet implemented');
    },
    onSuccess: () => {
      toast.success('Position imported successfully!');
    },
    onError: (error: Error) => {
      toast.error(
        `Failed to import position: ${error?.message || 'Unknown error'}`
      );
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (params: {
      orderId: string;
      symbol: string;
      exchangeUUID: string;
    }) => {
      const { query, variables } = exchangeQueries.closeOrderOnExchange(params);
      return await graphQLClient.request(query, variables);
    },
    onSuccess: () => {
      toast.success('Order cancelled successfully!');
    },
    onError: (error: Error) => {
      toast.error(
        `Failed to cancel order: ${error?.message || 'Unknown error'}`
      );
    },
  });

  // Cancel position mutation
  const cancelPositionMutation = useMutation({
    mutationFn: async (params: {
      positionId: string;
      exchangeUUID: string;
    }) => {
      const { query, variables } =
        exchangeQueries.closePositionOnExchange(params);
      return await graphQLClient.request(query, variables);
    },
    onSuccess: () => {
      toast.success('Position closed successfully!');
    },
    onError: (error: Error) => {
      toast.error(
        `Failed to close position: ${error?.message || 'Unknown error'}`
      );
    },
  });

  // Import handlers
  const handleImportOrder = (order: Order) => {
    if (!order.baseAssetName || !order.quoteAssetName) {
      toast.error('Order missing required asset information');
      return;
    }

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

  const handleImportPosition = (_position: Position) => {
    // Placeholder for position import
    toast.info('Position import coming soon');
  };

  const handleCancelOrder = (order: Order) => {
    cancelOrderMutation.mutate({
      orderId: order.orderId,
      symbol: order.symbol,
      exchangeUUID: order.exchangeUUID,
    });
  };

  const handleCancelPosition = (position: Position) => {
    cancelPositionMutation.mutate({
      positionId: position.positionId,
      exchangeUUID: position.exchangeUUID,
    });
  };

  return {
    importOrderMutation,
    importPositionMutation,
    cancelOrderMutation,
    cancelPositionMutation,
    handleImportOrder,
    handleImportPosition,
    handleCancelOrder,
    handleCancelPosition,
  };
};
