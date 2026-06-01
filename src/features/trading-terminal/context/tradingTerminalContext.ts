import { createContext } from 'react';

export interface TradingTerminalContextValue {
  symbol: string;
  interval: string;
  setSymbol: (symbol: string) => void;
  setInterval: (interval: string) => void;
}

export const DEFAULT_SYMBOL = 'BINANCE:BTCUSDT';
export const DEFAULT_INTERVAL = '60';

export const TradingTerminalContext = createContext<
  TradingTerminalContextValue | undefined
>(undefined);
