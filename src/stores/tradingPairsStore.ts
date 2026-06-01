import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TradingPairSelection {
  pair: string;
  exchange: string;
}

interface TradingPairsState {
  selectedPairs: TradingPairSelection[];
  addPair: (pair: TradingPairSelection) => void;
  removePair: (pairSymbol: string) => void;
  setPairs: (pairs: TradingPairSelection[]) => void;
  hasPair: (pairSymbol: string) => boolean;
}

export const useTradingPairsStore = create<TradingPairsState>()(
  persist(
    (set, get) => ({
      selectedPairs: [
        { pair: 'BTCUSDT', exchange: 'binance' },
        { pair: 'ETHUSDT', exchange: 'binance' },
        { pair: 'BNBUSDT', exchange: 'binance' },
        { pair: 'BTCUSDT', exchange: 'bybit' },
        { pair: 'ETHUSDT', exchange: 'bybit' },
      ],

      addPair: (pair: TradingPairSelection) => {
        const { selectedPairs } = get();
        if (!selectedPairs.some((p) => p.pair === pair.pair)) {
          set({ selectedPairs: [...selectedPairs, pair] });
        }
      },

      removePair: (pairSymbol: string) => {
        const { selectedPairs } = get();
        set({
          selectedPairs: selectedPairs.filter((p) => p.pair !== pairSymbol),
        });
      },

      setPairs: (pairs: TradingPairSelection[]) => {
        set({ selectedPairs: pairs });
      },

      hasPair: (pairSymbol: string) => {
        const { selectedPairs } = get();
        return selectedPairs.some((p) => p.pair === pairSymbol);
      },
    }),
    {
      name: 'trading-pairs-storage',
      version: 1,
    }
  )
);
