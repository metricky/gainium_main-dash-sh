import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dealQueries } from '../lib/api/GraphQLQueries-deal-queries';
import { GraphQLClient } from '../lib/api';
import { logger } from '../lib/loggerInstance';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { toast } from '../lib/toast';
import { BotTypesEnum } from '../types';

interface OpenDealInput {
  botId: string;
  symbol?: string;
}

interface OpenDealResponse {
  status: 'OK' | 'NOTOK';
  reason?: string;
  data?: string;
}

/**
 * Hook for opening new DCA deals
 * Follows the same pattern as main-dash openDeal function
 */
export function useOpenDCADeal() {
  const queryClient = useQueryClient();
  const { tokens } = useAuthStore();
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  return useMutation<OpenDealResponse, Error, OpenDealInput>({
    mutationFn: async ({ botId, symbol }) => {
      logger.info('[useOpenDCADeal] Opening DCA deal:', { botId, symbol });

      const client = new GraphQLClient(
        import.meta.env['VITE_API_ENDPOINT'],
        tokens?.accessToken,
        !isLiveTrading
      );

      const { query, variables } = dealQueries.openDCADeal({
        botId,
        symbol,
      });

      logger.debug('[useOpenDCADeal] Query:', { query, variables });

      const response = await client.request<{
        openDCADeal: OpenDealResponse;
      }>(query, variables);

      logger.info('[useOpenDCADeal] Response:', response);

      if (response.openDCADeal.status !== 'OK') {
        throw new Error(
          response.openDCADeal.reason || 'Failed to open DCA deal'
        );
      }

      return response.openDCADeal;
    },
    onSuccess: (data, variables) => {
      logger.info('[useOpenDCADeal] DCA deal opened successfully:', {
        botId: variables.botId,
        symbol: variables.symbol,
        response: data,
      });

      toast.success(data.data || 'Deal opened successfully');

      // Trigger immediate refetch to update store
      queryClient.invalidateQueries({ queryKey: ['getDCADeals'] });
      queryClient.invalidateQueries({ queryKey: ['dcaBotList'] });
    },
    onError: (error, variables) => {
      logger.error('[useOpenDCADeal] Failed to open DCA deal:', {
        botId: variables.botId,
        symbol: variables.symbol,
        error: error.message,
      });

      toast.error(error.message || 'Failed to open deal');
    },
  });
}

/**
 * Hook for opening new Combo deals
 * Follows the same pattern as main-dash openDeal function
 */
export function useOpenComboDeal() {
  const queryClient = useQueryClient();
  const { tokens } = useAuthStore();
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  return useMutation<OpenDealResponse, Error, OpenDealInput>({
    mutationFn: async ({ botId, symbol }) => {
      logger.info('[useOpenComboDeal] Opening Combo deal:', { botId, symbol });

      const client = new GraphQLClient(
        import.meta.env['VITE_API_ENDPOINT'],
        tokens?.accessToken,
        !isLiveTrading
      );

      const { query, variables } = dealQueries.openComboDeal({
        botId,
        symbol,
      });

      logger.debug('[useOpenComboDeal] Query:', { query, variables });

      const response = await client.request<{
        openComboDeal: OpenDealResponse;
      }>(query, variables);

      logger.info('[useOpenComboDeal] Response:', response);

      if (response.openComboDeal.status !== 'OK') {
        throw new Error(
          response.openComboDeal.reason || 'Failed to open Combo deal'
        );
      }

      return response.openComboDeal;
    },
    onSuccess: (data, variables) => {
      logger.info('[useOpenComboDeal] Combo deal opened successfully:', {
        botId: variables.botId,
        symbol: variables.symbol,
        response: data,
      });

      toast.success(data.data || 'Deal opened successfully');

      // Trigger immediate refetch to update store
      queryClient.invalidateQueries({ queryKey: ['getComboDeals'] });
      queryClient.invalidateQueries({ queryKey: ['comboBotList'] });
    },
    onError: (error, variables) => {
      logger.error('[useOpenComboDeal] Failed to open Combo deal:', {
        botId: variables.botId,
        symbol: variables.symbol,
        error: error.message,
      });

      toast.error(error.message || 'Failed to open deal');
    },
  });
}

/**
 * Generic hook for opening deals that automatically selects the correct mutation
 * based on the bot type
 */
export function useOpenDeal(
  botType: BotTypesEnum.dca | BotTypesEnum.combo = BotTypesEnum.dca
) {
  const openDCA = useOpenDCADeal();
  const openCombo = useOpenComboDeal();

  const isCombo = botType === BotTypesEnum.combo;
  const mutation = isCombo ? openCombo : openDCA;

  return {
    openDeal: mutation.mutate,
    openDealAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
