import { logger } from '@/lib/loggerInstance';
import { getProviderIcon } from '@/utils/exchangeUtils';
import React, { createContext, useMemo } from 'react';
import { useExchangesFromContext } from './ExchangeDataContext';

// Define the exchange data structure based on the GraphQL API
interface ExchangeData {
  uuid: string;
  key: string;
  name: string;
  provider: string;
  balance?: number | undefined;
  status?: boolean | undefined;
}

// Transformed exchange for UI consumption
export interface UIExchange {
  id: string;
  key: string;
  name: string;
  provider: string;
  icon: string;
  type: 'exchange' | 'aggregate';
  balance?: number | undefined;
  status: boolean;
  color?: string;
}

interface ExchangeContextValue {
  exchanges: UIExchange[];
  isLoading: boolean;
  error: Error | null;
}

const ExchangeContext = createContext<ExchangeContextValue | undefined>(
  undefined
);

interface ExchangeProviderProps {
  children: React.ReactNode;
}

export { ExchangeContext };

export const ExchangeProvider: React.FC<ExchangeProviderProps> = ({
  children,
}) => {
  const {
    data: exchangesResponse,
    isLoading,
    error,
  } = useExchangesFromContext();

  // Transform GraphQL data to display format
  const exchanges = useMemo(() => {
    logger.debug('ExchangeProvider: Full response structure:', {
      hasResponse: !!exchangesResponse,
      responseKeys: exchangesResponse ? Object.keys(exchangesResponse) : [],
      hasData: !!exchangesResponse?.data,
      dataKeys: exchangesResponse?.data
        ? Object.keys(exchangesResponse.data)
        : [],
      dataValue: exchangesResponse?.data,
      fullResponse: exchangesResponse,
    });

    // Try different possible paths for the exchanges data
    let exchangesData = null;

    // Path 1: Direct access (if getAllExchangesResponseUserData has exchanges directly)
    if (exchangesResponse?.data?.exchanges) {
      exchangesData = exchangesResponse.data.exchanges;
      logger.debug('ExchangeProvider: Found exchanges via direct path');
    }
    // Path 2: Via data.data (if it's a ReturnResult wrapper)
    // Using type assertion to bypass TypeScript strict checking
    else if (
      (
        exchangesResponse?.data as unknown as {
          data?: { exchanges?: ExchangeData[] };
        }
      )?.data?.exchanges
    ) {
      exchangesData = (
        exchangesResponse?.data as unknown as {
          data: { exchanges: ExchangeData[] };
        }
      ).data.exchanges;
      logger.debug('ExchangeProvider: Found exchanges via data.data path');
    }
    // Path 3: Check if data itself is the exchanges array
    else if (Array.isArray(exchangesResponse?.data)) {
      exchangesData = exchangesResponse.data;
      logger.debug('ExchangeProvider: Data is directly an array');
    }

    if (!exchangesData || !Array.isArray(exchangesData)) {
      logger.warn('ExchangeProvider: No valid exchanges data found');
      return [];
    }

    logger.debug('ExchangeProvider: Processing exchanges data', {
      exchangeCount: exchangesData.length,
      firstExchange: exchangesData[0],
      allExchanges: exchangesData,
    });

    // Add "All Exchanges" item at the beginning
    const allExchanges: UIExchange = {
      id: 'ALL',
      key: 'ALL',
      name: 'All Exchanges',
      provider: 'all',
      icon: getProviderIcon('all'),
      type: 'aggregate' as const,
      balance: exchangesData.reduce(
        (sum: number, ex: ExchangeData) => sum + (ex.balance || 0),
        0
      ),
      status: true,
    };

    // Transform individual exchanges
    const individualExchanges: UIExchange[] = exchangesData.map(
      (exchange: ExchangeData) => ({
        id: exchange.uuid,
        key: exchange.key,
        name: exchange.name,
        provider: exchange.provider,
        icon: getProviderIcon(exchange.provider),
        type: 'exchange' as const,
        balance: exchange.balance ?? undefined,
        status: exchange.status ?? false,
      })
    );

    return [allExchanges, ...individualExchanges];
  }, [exchangesResponse]);

  const value: ExchangeContextValue = {
    exchanges,
    isLoading,
    error,
  };

  return (
    <ExchangeContext.Provider value={value}>
      {children}
    </ExchangeContext.Provider>
  );
};
