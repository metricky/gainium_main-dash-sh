import { useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_INTERVAL,
  DEFAULT_SYMBOL,
  TradingTerminalContext,
  type TradingTerminalContextValue,
} from './tradingTerminalContext';

interface TradingTerminalProviderProps {
  children: ReactNode;
}

export function TradingTerminalProvider({
  children,
}: TradingTerminalProviderProps) {
  const [symbol, setSymbol] = useState<string>(DEFAULT_SYMBOL);
  const [interval, setInterval] = useState<string>(DEFAULT_INTERVAL);

  const value = useMemo<TradingTerminalContextValue>(
    () => ({
      symbol,
      interval,
      setSymbol,
      setInterval,
    }),
    [symbol, interval]
  );

  return (
    <TradingTerminalContext.Provider value={value}>
      {children}
    </TradingTerminalContext.Provider>
  );
}
