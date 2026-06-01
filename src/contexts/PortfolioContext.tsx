/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from 'react';

export interface PortfolioContextValue {
  selectedExchanges: string[];
  setSelectedExchanges: (exchangeIds: string[]) => void;
}

export const PortfolioContext = createContext<
  PortfolioContextValue | undefined
>(undefined);

interface PortfolioProviderProps {
  children: React.ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({
  children,
}) => {
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(['ALL']);

  const value: PortfolioContextValue = {
    selectedExchanges,
    setSelectedExchanges,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
