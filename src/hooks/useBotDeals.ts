import { dealQueries } from '../lib/api/GraphQLQueries-deal-queries';
import type { ReturnResult } from '../lib/api/types';
import { logger } from '../lib/loggerInstance';
import { useGraphQL } from './useGraphQL';

export interface BotDeal {
  _id: string;
  botName?: string;
  dcaBot?: {
    exchange: string;
    settings: {
      name: string;
    };
  };
  levels?: {
    complete: number;
    all: number;
  };
  status: string;
  currentBalances: {
    base: number;
    quote: number;
  };
  initialBalances: {
    base: number;
    quote: number;
  };
  symbol: {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
  };
  strategy: string;
  botId: string;
  settings?: {
    futures?: boolean;
    coinm?: boolean;
  };
  usage?: {
    current: {
      base: number;
      quote: number;
    };
    currentUsd: number;
    max: {
      base: number;
      quote: number;
    };
    maxUsd: number;
  };
  avgPrice: number;
  profit?: {
    total: number;
    totalUsd: number;
    pureBase: number;
    pureQuote: number;
  };
  exchangeUUID: string;
  initialPrice: number;
  createTime: string;
  // Computed fields (hook-enhanced)
  unrealizedUsd?: number;
  unrealizedPct?: number;
}

// Interface for dcaDealList response
interface DcaDealListResponse {
  result: BotDeal[];
  totalResults: number;
  page: number;
  totalPages: number;
}

export interface UseBotDealsResult {
  data: ReturnResult<DcaDealListResponse> | null;
  deals: BotDeal[];
  total: number;
  hasValidResponse: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  // Optional computed metrics map keyed by deal id
  dealMetrics: Record<string, { unrealizedUsd: number; unrealizedPct: number }>;
}

export interface UseBotDealsOptions {
  botId: string;
  shareId?: string;
  status?: string; // 'all', 'active', 'closed', etc.
  page?: number;
  pageSize?: number;
}

export function useBotDeals(options: UseBotDealsOptions): UseBotDealsResult {
  // DEBUG: Log the options being received
  console.log('[useBotDeals] Received options:', options);

  // Validate that botId is provided
  const isValidBotId = options.botId && options.botId.trim() !== '';

  console.log(
    '[useBotDeals] isValidBotId:',
    isValidBotId,
    'botId:',
    options.botId
  );

  // Prepare input for dcaDealList query
  const dcaDealListInput = {
    botId: options.botId,
    // Remove the 'all' parameter to let the backend return all deals by default
    // all: options.status === 'all' || !options.status, // Get all deals if status is 'all' or not specified
    terminal: false, // Default to live trading
  };

  // Only include status if it's not 'all'
  if (options.status && options.status !== 'all') {
    // Map status string to DCADealStatusEnum
    if (options.status === 'active') {
      // For active deals, we don't filter by status since we want all non-closed deals
      // The filtering will be done in the component
    } else if (options.status === 'closed') {
      // For closed deals, we don't filter by status since we want all deals
      // The filtering will be done in the component
    }
  }

  // Get the query and variables from dealQueries
  const { query, variables } = dealQueries.getDCADeals(dcaDealListInput);

  // Use the GraphQL hook with proper caching
  // Paper context is automatically handled by useGraphQL through useUIStore
  const queryResult = useGraphQL<DcaDealListResponse>('dcaDealList', {
    query,
    variables,
  });

  // If botId is invalid, return error state
  if (!isValidBotId) {
    logger.error(
      '[useBotDeals] botId is required but was not provided or is empty'
    );
    return {
      data: null,
      deals: [],
      total: 0,
      hasValidResponse: false,
      isLoading: false,
      isError: true,
      error: new Error('botId is required'),
      refetch: () => Promise.resolve(),
      dealMetrics: {},
    };
  }

  // If there's an error, log it
  if (queryResult.error) {
    logger.error('[useBotDeals] Query error:', queryResult.error.message);
  }

  // Handle the response structure properly
  let botDealsResponse: BotDeal[] | null = null;
  let responseTotal = 0;
  let hasValidResponse = false;

  if (queryResult.isError) {
    // Query failed completely
    botDealsResponse = [];
    responseTotal = 0;
    hasValidResponse = false;
  } else if (queryResult.data) {
    // Check if the response has the expected structure
    if (queryResult.data.status === 'OK') {
      // getDCADeals returns data.data.result as the array of deals
      const resultData = queryResult.data.data?.result;
      botDealsResponse = Array.isArray(resultData)
        ? (resultData as BotDeal[])
        : [];
      responseTotal =
        queryResult.data.data?.totalResults || queryResult.data.total || 0;
      hasValidResponse = true;
    } else if (queryResult.data.status === 'NOTOK') {
      // Query succeeded but returned an error status
      botDealsResponse = [];
      responseTotal = 0;
      hasValidResponse = false;
      logger.warn(
        '[useBotDeals] Query returned NOTOK status:',
        queryResult.data.reason
      );
    } else {
      // Unexpected response structure
      botDealsResponse = [];
      responseTotal = 0;
      hasValidResponse = false;
      logger.warn(
        '[useBotDeals] Unexpected response structure:',
        queryResult.data
      );
    }
  } else {
    // No data yet (loading state)
    botDealsResponse = [];
    responseTotal = 0;
    hasValidResponse = false;
  }

  // Calculate unrealized PnL for each deal if we have valid data
  const dealMetrics: Record<
    string,
    { unrealizedUsd: number; unrealizedPct: number }
  > = {};

  if (botDealsResponse && botDealsResponse.length > 0) {
    // This would require price data integration similar to useDcaDeals
    // For now, we'll skip this calculation as it's not essential for the core fix
  }

  return {
    data: queryResult.data || null,
    deals: botDealsResponse || [],
    total: responseTotal,
    hasValidResponse,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    dealMetrics,
  };
}
