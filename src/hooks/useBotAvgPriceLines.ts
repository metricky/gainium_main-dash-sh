import { useMemo } from 'react';

import { botQueries } from '@/lib/api/GraphQLQueries-bot-queries';
import type { ReturnResult } from '@/lib/api/types';
import { logger } from '@/lib/loggerInstance';
import { useGraphQL } from './useGraphQL';
import { useShareContext } from './useShareContext';
import {
  BotTypesEnum,
  type AvgPrice,
  type AvgPriceLinesResponse,
} from '@/types';

const DEFAULT_AVG_PRICES: AvgPrice[] = [];

export interface UseBotAvgPriceLinesResult {
  data: ReturnResult<AvgPriceLinesResponse> | null;
  avgPrices: AvgPrice[];
  hasValidResponse: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export interface UseBotAvgPriceLinesOptions {
  enabled?: boolean;
  staleTime?: number;
}

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const coerceString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
};

export function useBotAvgPriceLines(
  botId: string,
  botType: BotTypesEnum = BotTypesEnum.grid,
  options: UseBotAvgPriceLinesOptions = {}
): UseBotAvgPriceLinesResult {
  const { shareId } = useShareContext();

  const input = {
    botId,
    type: botType,
    ...(shareId ? { shareId } : {}),
  };

  const { query, variables } = botQueries.getBotAvgPriceLines(input);

  const isEnabled = options.enabled ?? Boolean(botId);

  const queryResult = useGraphQL<AvgPriceLinesResponse>(
    'getBotAvgPriceLines',
    {
      query,
      variables,
    },
    {
      enabled: isEnabled,
      shareId,
      ...(typeof options.staleTime === 'number'
        ? { staleTime: options.staleTime }
        : {}),
    }
  );

  const { data, isLoading, isError } = queryResult;

  const processed = useMemo(() => {
    if (!botId || !isEnabled || isLoading || isError || !data) {
      return {
        avgPrices: DEFAULT_AVG_PRICES,
        hasValidResponse: false,
      };
    }

    const rawAvgPrices = Array.isArray(data.data?.avgPrice)
      ? data.data?.avgPrice
      : [];

    const normalized = rawAvgPrices
      .map((entry) => {
        const price = coerceNumber(entry?.price);
        const symbol = coerceString(entry?.symbol);
        const label = coerceString(entry?.label);

        if (price === null || !symbol) {
          return null;
        }

        return label ? { price, symbol, label } : { price, symbol };
      })
      .filter((entry): entry is AvgPrice => entry !== null);

    if (rawAvgPrices.length > 0 && normalized.length !== rawAvgPrices.length) {
      logger.warn('[useBotAvgPriceLines] Filtered invalid avg price entries', {
        botId,
        requestedCount: rawAvgPrices.length,
        usableCount: normalized.length,
      });
    }

    const hasValidResponse = data.status === 'OK';

    if (hasValidResponse) {
      logger.info('[useBotAvgPriceLines] Loaded average price lines', {
        botId,
        count: normalized.length,
      });
    }

    return {
      avgPrices: normalized,
      hasValidResponse,
    };
  }, [botId, data, isEnabled, isError, isLoading]);

  return {
    data: data ?? null,
    avgPrices: processed.avgPrices,
    hasValidResponse: processed.hasValidResponse,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error ?? null,
    refetch: queryResult.refetch,
  };
}
