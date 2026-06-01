import { useMutation } from '@tanstack/react-query';
import { botQueries } from '../lib/api/GraphQLQueries-bot-queries';
import { GraphQLClient } from '../lib/api';
import { logger } from '../lib/loggerInstance';
import {
  BotTypesEnum,
  type AddFundsSettings,
  type CloseDCATypeEnum,
  type DCADealsSettings,
} from '@/types';
import { dealQueries } from '@/lib/api/GraphQLQueries-deal-queries';
import type { AdjustFundsDialogMode } from '@/features/bots/shared/runtime';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useDealStore } from '@/stores/live';

interface CloseDealInput {
  dealId: string;
  botId: string;
  type: CloseDCATypeEnum; // 'leave', 'cancel', 'closeByLimit', 'closeByMarket'
}

interface DealResponse {
  status: 'OK' | 'NOTOK';
  reason?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

interface EditDealResponse {
  status: 'OK' | 'NOTOK';
  reason?: string;
  data?: string;
}

interface AdjustFundsInput {
  dealId: string;
  botId: string;
  settings: AddFundsSettings;
  mode: AdjustFundsDialogMode;
}

interface MoveDealToTerminalInput {
  dealId: string;
  botId: string;
  combo: boolean;
}

// Hook for closing DCA deals
export function useCloseDCADeal() {
  const { tokens } = useAuthStore();

  // Get the paper context from the UI store (live/paper trading mode)
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  const client = new GraphQLClient(
    import.meta.env['VITE_API_ENDPOINT'],
    tokens?.accessToken,
    !isLiveTrading
  );

  return useMutation<DealResponse, Error, CloseDealInput>({
    mutationFn: async ({ dealId, type, botId }) => {
      logger.info('[useCloseDCADeal] Closing DCA deal:', { dealId, type });

      const { query, variables } = botQueries.closeDCADeal({
        dealId,
        botId,
        type,
      });

      const response = await client.request<{
        closeDCADeal: DealResponse;
      }>(query, variables);

      if (response.closeDCADeal.status !== 'OK') {
        throw new Error(response.closeDCADeal.reason || 'Failed to close deal');
      }

      return response.closeDCADeal;
    },
    onSuccess: (data, variables) => {
      logger.info('[useCloseDCADeal] DCA deal closed successfully:', {
        dealId: variables.dealId,
        type: variables.type,
        response: data,
      });
    },
    onError: (error, variables) => {
      logger.error('[useCloseDCADeal] Failed to close DCA deal:', {
        dealId: variables.dealId,
        type: variables.type,
        error: error.message,
      });
    },
  });
}

// Hook for adjusting funds in DCA deals
export function useAdjustFunds() {
  const { tokens } = useAuthStore();

  // Get the paper context from the UI store (live/paper trading mode)
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  const client = new GraphQLClient(
    import.meta.env['VITE_API_ENDPOINT'],
    tokens?.accessToken,
    !isLiveTrading
  );

  return useMutation<DealResponse, Error, AdjustFundsInput>({
    mutationFn: async (input) => {
      logger.info('[useAdjustFunds] Adjust DCA Deals funds:', input);

      const { mode, settings, ...rest } = input;

      const { query, variables } =
        mode === 'add'
          ? dealQueries.addDealFunds({ ...rest, ...settings })
          : dealQueries.reduceDealFunds({ ...rest, ...settings });

      const response = await client.request<{
        addDealFunds?: DealResponse;
        reduceDealFunds?: DealResponse;
      }>(query, variables);

      if (mode === 'add') {
        if (response.addDealFunds?.status !== 'OK') {
          throw new Error(
            response.addDealFunds?.reason || 'Failed to add funds'
          );
        } else {
          return response.addDealFunds;
        }
      }
      if (mode === 'reduce') {
        if (response.reduceDealFunds?.status !== 'OK') {
          throw new Error(
            response.reduceDealFunds?.reason || 'Failed to reduce funds'
          );
        } else {
          return response.reduceDealFunds;
        }
      }

      return { status: 'NOTOK', reason: 'Invalid operation' };
    },
    onSuccess: (data, variables) => {
      logger.info('[useAdjustFunds] Funds in DCA deal adjusted successfully:', {
        dealId: variables.dealId,
        mode: variables.mode,
        response: data,
      });
    },
    onError: (error, variables) => {
      logger.error('[useCloseDCADeal] Failed to adjust funds in DCA deal:', {
        dealId: variables.dealId,
        mode: variables.mode,
        error: error.message,
      });
    },
  });
}

// Hook for closing Combo deals
export function useCloseComboDeal() {
  const { tokens } = useAuthStore();

  // Get the paper context from the UI store (live/paper trading mode)
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  const client = new GraphQLClient(
    import.meta.env['VITE_API_ENDPOINT'],
    tokens?.accessToken,
    !isLiveTrading
  );
  return useMutation<DealResponse, Error, CloseDealInput>({
    mutationFn: async ({ dealId, type, botId }) => {
      logger.info('[useCloseComboDeal] Closing Combo deal:', { dealId, type });

      const { query, variables } = botQueries.closeComboDeal({
        dealId,
        botId,
        type,
      });

      const response = await client.request<{
        closeComboDeal: DealResponse;
      }>(query, variables);

      if (response.closeComboDeal.status !== 'OK') {
        throw new Error(
          response.closeComboDeal.reason || 'Failed to close combo deal'
        );
      }

      return response.closeComboDeal;
    },
    onSuccess: (data, variables) => {
      logger.info('[useCloseComboDeal] Combo deal closed successfully:', {
        dealId: variables.dealId,
        type: variables.type,
        response: data,
      });
    },
    onError: (error, variables) => {
      logger.error('[useCloseComboDeal] Failed to close combo deal:', {
        dealId: variables.dealId,
        type: variables.type,
        error: error.message,
      });
    },
  });
}

// Hook for closing Multi-Pair DCA deals
export function useCloseMultiPairDeal() {
  const { tokens } = useAuthStore();

  // Get the paper context from the UI store (live/paper trading mode)
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  const client = new GraphQLClient(
    import.meta.env['VITE_API_ENDPOINT'],
    tokens?.accessToken,
    !isLiveTrading
  );
  return useMutation<DealResponse, Error, CloseDealInput>({
    mutationFn: async ({ dealId, type }) => {
      logger.info('[useCloseMultiPairDeal] Closing Multi-Pair deal:', {
        dealId,
        type,
      });

      const { query, variables } = botQueries.closeMultiPairDCADeal({
        dealId,
        type,
      });

      const response = await client.request<{
        closeMultiPairDCADeal: DealResponse;
      }>(query, variables);

      if (response.closeMultiPairDCADeal.status !== 'OK') {
        throw new Error(
          response.closeMultiPairDCADeal.reason ||
            'Failed to close multi-pair deal'
        );
      }

      return response.closeMultiPairDCADeal;
    },
    onSuccess: (data, variables) => {
      logger.info(
        '[useCloseMultiPairDeal] Multi-Pair deal closed successfully:',
        {
          dealId: variables.dealId,
          type: variables.type,
          response: data,
        }
      );
    },
    onError: (error, variables) => {
      logger.error('[useCloseMultiPairDeal] Failed to close multi-pair deal:', {
        dealId: variables.dealId,
        type: variables.type,
        error: error.message,
      });
    },
  });
}

export function useMoveDealToTerminal() {
  const { tokens } = useAuthStore();

  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  const client = new GraphQLClient(
    import.meta.env['VITE_API_ENDPOINT'],
    tokens?.accessToken,
    !isLiveTrading
  );

  return useMutation<DealResponse, Error, MoveDealToTerminalInput>({
    mutationFn: async ({ dealId, botId, combo }) => {
      logger.info('[useMoveDealToTerminal] Moving deal to terminal:', {
        dealId,
        botId,
        combo,
      });

      const { query, variables } = dealQueries.moveDealToTerminal({
        dealId,
        botId,
        combo,
      });

      const response = await client.request<{
        moveDealToTerminal: DealResponse;
      }>(query, variables);

      if (response.moveDealToTerminal.status !== 'OK') {
        throw new Error(
          response.moveDealToTerminal.reason ||
            'Failed to move deal to terminal'
        );
      }

      return response.moveDealToTerminal;
    },
    onSuccess: (data, variables) => {
      logger.info('[useMoveDealToTerminal] Deal moved to terminal', {
        dealId: variables.dealId,
        botId: variables.botId,
        response: data,
      });
    },
    onError: (error, variables) => {
      logger.error('[useMoveDealToTerminal] Failed to move deal to terminal', {
        dealId: variables.dealId,
        botId: variables.botId,
        error: error.message,
      });
    },
  });
}

export type ChangeDealInput = {
  botId: string;
  dealId: string;
  settings: Partial<DCADealsSettings>;
};
export type UseEditDealOptions = ChangeDealInput & {
  type: BotTypesEnum;
  terminal?: boolean;
};
export type ResetDealInput = { botId: string; dealId: string };
export type UseResetDealOptions = ResetDealInput & {
  type: BotTypesEnum;
  terminal?: boolean;
  originalSettings: Partial<DCADealsSettings>;
};
type EditOptions = {
  onSuccess?: () => void;
  onError?: (e: Error) => void;
};
// Hook for reseting deals
export function useResetDeal(options?: EditOptions) {
  const { tokens } = useAuthStore();

  // Get the paper context from the UI store (live/paper trading mode)
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  const client = new GraphQLClient(
    import.meta.env['VITE_API_ENDPOINT'],
    tokens?.accessToken,
    !isLiveTrading
  );

  return useMutation<EditDealResponse, Error, UseResetDealOptions>({
    mutationFn: async ({ dealId, type, botId }) => {
      logger.info('[useResetDeal] Resetting deal:', { dealId, type });
      const q =
        type === BotTypesEnum.dca
          ? dealQueries.resetDealSettings
          : dealQueries.resetComboDealSettings;
      const { query, variables } = q({
        dealId,
        botId,
      });

      if (type === BotTypesEnum.dca) {
        const response = await client.request<{
          resetDealSettings: EditDealResponse;
        }>(query, variables);

        if (response.resetDealSettings.status !== 'OK') {
          throw new Error(
            response.resetDealSettings.reason || 'Failed to change deal'
          );
        }

        return response.resetDealSettings;
      }

      const response = await client.request<{
        resetComboDealSettings: EditDealResponse;
      }>(query, variables);

      if (response.resetComboDealSettings.status !== 'OK') {
        throw new Error(
          response.resetComboDealSettings.reason || 'Failed to change deal'
        );
      }

      return response.resetComboDealSettings;
    },
    onSuccess: (_, { dealId, botId, originalSettings, type, terminal }) => {
      const get = useDealStore.getState().getDeal(botId, dealId);
      if (get) {
        useDealStore.getState().updateDeal(
          botId,
          {
            ...get,
            settings: { ...get.settings, ...originalSettings },
          },
          type === BotTypesEnum.combo ? 'combo' : terminal ? 'terminal' : 'dca'
        );
      }
      options?.onSuccess?.();
    },
    onError: (e) => {
      options?.onError?.(e);
    },
  });
}

// Hook for editing deals
export function useEditDeal(options?: EditOptions) {
  const { tokens } = useAuthStore();

  // Get the paper context from the UI store (live/paper trading mode)
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  const client = new GraphQLClient(
    import.meta.env['VITE_API_ENDPOINT'],
    tokens?.accessToken,
    !isLiveTrading
  );

  return useMutation<EditDealResponse, Error, UseEditDealOptions>({
    mutationFn: async ({ dealId, type, botId, settings }) => {
      logger.info('[useEditDeal] Editing deal:', { dealId, type });
      const q =
        type === BotTypesEnum.dca
          ? dealQueries.changeDCADealSettings
          : dealQueries.changeComboDealSettings;
      const { query, variables } = q({
        dealId,
        botId,
        settings,
      });

      if (type === BotTypesEnum.dca) {
        const response = await client.request<{
          changeDCADealSettings: EditDealResponse;
        }>(query, variables);

        if (response.changeDCADealSettings.status !== 'OK') {
          throw new Error(
            response.changeDCADealSettings.reason || 'Failed to change deal'
          );
        }

        return response.changeDCADealSettings;
      }

      const response = await client.request<{
        changeComboDealSettings: EditDealResponse;
      }>(query, variables);

      if (response.changeComboDealSettings.status !== 'OK') {
        throw new Error(
          response.changeComboDealSettings.reason || 'Failed to change deal'
        );
      }

      return response.changeComboDealSettings;
    },
    onSuccess: (_, { dealId, botId, settings, type, terminal }) => {
      const get = useDealStore.getState().getDeal(botId, dealId);
      if (get) {
        useDealStore.getState().updateDeal(
          botId,
          {
            ...get,
            settings: { ...get.settings, ...settings },
          },
          type === BotTypesEnum.combo ? 'combo' : terminal ? 'terminal' : 'dca'
        );
      }
      options?.onSuccess?.();
    },
    onError: (e) => {
      options?.onError?.(e);
    },
  });
}

// Generic deal management hook
export function useDealActions() {
  const closeDCA = useCloseDCADeal();
  const closeCombo = useCloseComboDeal();
  const closeMultiPair = useCloseMultiPairDeal();

  const closeDeal = async (
    dealId: string,
    botId: string,
    type: CloseDCATypeEnum,
    dealType: 'dca' | 'combo' | 'multiPair' = 'dca'
  ) => {
    switch (dealType) {
      case 'dca':
        return closeDCA.mutateAsync({ dealId, botId, type });
      case 'combo':
        return closeCombo.mutateAsync({ dealId, botId, type });
      case 'multiPair':
        return closeMultiPair.mutateAsync({ dealId, botId, type });
      default:
        throw new Error(`Unknown deal type: ${dealType}`);
    }
  };

  return {
    closeDeal,
    closeDCADeal: closeDCA.mutateAsync,
    closeComboDeal: closeCombo.mutateAsync,
    closeMultiPairDeal: closeMultiPair.mutateAsync,
    isLoading:
      closeDCA.isPending || closeCombo.isPending || closeMultiPair.isPending,
    error: closeDCA.error || closeCombo.error || closeMultiPair.error,
  };
}
