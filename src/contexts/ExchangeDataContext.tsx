/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useExchanges } from '@/hooks/useExchanges';
import {
  useTradingPairs,
  type TradingPairsByExchange,
} from '@/hooks/useTradingPairs';
import {
  useTransformedExchanges,
  type UIExchange,
} from '@/hooks/useTransformedExchanges';
import type { ExchangeInUser } from '@/types/exchange.types';

// Define the context type with return types from all three hooks
interface ExchangeDataContextType {
  // From useExchanges
  exchanges: {
    data: { data: { exchanges: ExchangeInUser[] } };
    loading: boolean;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
    addOrUpdateExchange: (exchange: ExchangeInUser) => void;
    removeExchange: (uuid: string) => void;
    getExchange: (uuid: string) => ExchangeInUser | undefined | null;
    getExchangesByProvider: (provider: string) => ExchangeInUser[];
    clearAll: () => void;
  };

  // From useTradingPairs
  tradingPairs: {
    isLoading: boolean;
    error: Error | null;
    pairsByExchange: TradingPairsByExchange;
    refresh: () => Promise<void>;
  };

  // From useTransformedExchanges
  transformedExchanges: {
    exchanges: UIExchange[];
    isLoading: boolean;
  };
}

// Create the context
const ExchangeDataContext = createContext<ExchangeDataContextType | undefined>(
  undefined
);

// Provider component
interface ExchangeDataProviderProps {
  children: ReactNode;
}

export function ExchangeDataProvider({ children }: ExchangeDataProviderProps) {
  // Call all three hooks once at this level
  const exchangesResult = useExchanges();
  const tradingPairsResult = useTradingPairs();
  const transformedExchangesResult = useTransformedExchanges();

  const contextValue: ExchangeDataContextType = useMemo(
    () => ({
      exchanges: exchangesResult,
      tradingPairs: tradingPairsResult,
      transformedExchanges: transformedExchangesResult,
    }),
    [exchangesResult, tradingPairsResult, transformedExchangesResult]
  );

  return (
    <ExchangeDataContext.Provider value={contextValue}>
      {children}
    </ExchangeDataContext.Provider>
  );
}

// Custom hooks to access the context data
export function useExchangeDataContext() {
  const context = useContext(ExchangeDataContext);
  if (context === undefined) {
    throw new Error(
      'useExchangeDataContext must be used within an ExchangeDataProvider'
    );
  }
  return context;
}

// Individual hooks that components can use instead of the original hooks
export function useExchangesFromContext() {
  const { exchanges } = useExchangeDataContext();
  return exchanges;
}

export function useTradingPairsFromContext() {
  const { tradingPairs } = useExchangeDataContext();
  return tradingPairs;
}

export function useTransformedExchangesFromContext() {
  const { transformedExchanges } = useExchangeDataContext();
  return transformedExchanges;
}
