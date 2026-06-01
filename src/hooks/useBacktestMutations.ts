import { useMutation, useQueryClient } from '@tanstack/react-query';
import { botQueries } from '../lib/api/GraphQLQueries-bot-queries';
// import { useGraphQL } from './useGraphQL';
import { logger } from '../lib/loggerInstance';
import {
  BotTypesEnum,
  ExchangeIntervals,
  type BacktestingSettings,
  type DCABacktestingResultShort,
  type ExchangeInUser,
  type ServerSideBacktestPayload,
  type Symbols,
} from '@/types';
import type { BotFormData } from '@/types/bots';

export type BacktestInput = DCABacktestingResultShort & {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  userId: string;
  time: number;
  savePermanent: boolean;
  config: BacktestingSettings;
};

export type SSBinput = {
  payload: ServerSideBacktestPayload;
  symbols: { pair: string; quoteAsset: string; baseAsset: string }[];
};

export interface BacktestResult {
  status: string;
  reason?: string;
  data?: unknown;
}

export function useRunBacktest() {
  const queryClient = useQueryClient();

  return useMutation<BacktestResult, Error, SSBinput>({
    mutationFn: async (input: SSBinput) => {
      logger.info('[useRunBacktest] Starting backtest execution:', {
        symbol: input.symbols[0],
        dateRange: `${input.payload.config.firstDataTime} to ${input.payload.config.lastDataTime}`,
        timeframe: input.payload.data.interval,
      });

      const payload = input;
      const { query, variables } =
        botQueries.requestServerSideBacktest(payload);

      // Use a direct GraphQL client call instead of useGraphQL hook
      const { GraphQLClient } = await import('../lib/api');
      const { useAuthStore } = await import('../stores/authStore');
      const { useUIStore } = await import('../stores/uiStore');

      const { tokens } = useAuthStore.getState();
      const { isLiveTrading } = useUIStore.getState();

      if (!tokens?.accessToken) {
        throw new Error('Authentication required to run backtest');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      const paperContext = !isLiveTrading;

      const client = new GraphQLClient(
        endpoint,
        tokens.accessToken,
        paperContext
      );

      const result = await client.request<BacktestResult>(query, variables);

      logger.info('[useRunBacktest] Backtest execution completed:', {
        status: result.status,
        hasData: !!result.data,
      });

      if (result.status !== 'OK') {
        throw new Error(result.reason || 'Failed to run backtest');
      }

      return result;
    },
    onSuccess: (data) => {
      logger.info('[useRunBacktest] Backtest mutation successful:', {
        status: data.status,
      });

      // Invalidate backtest queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ['getBotBacktestSummary'],
      });
      queryClient.invalidateQueries({
        queryKey: ['getBacktests'],
      });
    },
    onError: (error) => {
      logger.error('[useRunBacktest] Backtest mutation failed:', {
        error: error.message,
      });
    },
  });
}

// Helper function to prepare backtest input from bot and config
export function prepareBacktestInput(
  formData: BotFormData,
  currentExchange: ExchangeInUser | null,
  backtestConfig: BacktestingSettings,
  interval: ExchangeIntervals
): SSBinput {
  if (!currentExchange) {
    throw new Error('Current exchange is not defined');
  }
  const fullSymbols: Symbols[] = [];
  const symbols = [formData.pair]
    .flat()
    .map((s) => {
      if (s in formData.pairMetadata) {
        fullSymbols.push({
          ...formData.pairMetadata[s],
          maxOrders: 200,
          exchange: currentExchange.provider,
        });
        return {
          pair: s,
          baseAsset: formData.pairMetadata[s].baseAsset.name,
          quoteAsset: formData.pairMetadata[s].quoteAsset.name,
        };
      }
      return null;
    })
    .filter(Boolean) as SSBinput['symbols'];

  const result: SSBinput = {
    symbols,
    payload: {
      type: BotTypesEnum.dca,
      data: {
        exchange: currentExchange.provider,
        exchangeUUID: currentExchange.uuid,
        interval,
        balances: [],
        from: backtestConfig.firstDataTime,
        to: backtestConfig.lastDataTime,
        slippage: +backtestConfig.slippage,
        userFee: +backtestConfig.userFee,
        settings: {
          ...formData.dca,
          pair: [formData.pair].flat(),
          name: formData.name,
        },
        combo: false,
      },
      config: backtestConfig,
    },
  };

  return result;
}
