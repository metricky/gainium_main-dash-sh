import { useContext } from 'react';

import { TradingTerminalContext } from './tradingTerminalContext';

export function useTradingTerminal() {
  const context = useContext(TradingTerminalContext);

  if (!context) {
    throw new Error(
      'useTradingTerminal must be used within a TradingTerminalProvider'
    );
  }

  return context;
}
