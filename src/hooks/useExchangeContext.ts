import { useContext } from 'react';
import { ExchangeContext } from '../contexts/ExchangeContext';

export const useExchangeContext = () => {
  const context = useContext(ExchangeContext);
  if (context === undefined) {
    throw new Error(
      'useExchangeContext must be used within an ExchangeProvider'
    );
  }
  return context;
};
