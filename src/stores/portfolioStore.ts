import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface PortfolioState {
  // Selected coins for portfolio visualization
  selectedCoins: string[];

  // Actions
  setSelectedCoins: (coins: string[]) => void;
  addCoin: (coin: string) => void;
  removeCoin: (coin: string) => void;
  toggleCoin: (coin: string) => void;
  resetToDefault: () => void;
}

// Default state - "All coins" selected by default
const DEFAULT_SELECTED_COINS: string[] = ['ALL'];

export const usePortfolioStore = create<PortfolioState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - only "All coins" by default
        selectedCoins: DEFAULT_SELECTED_COINS,

        // Actions
        setSelectedCoins: (coins) => set({ selectedCoins: coins }),

        addCoin: (coin) => {
          const state = get();
          if (!state.selectedCoins.includes(coin)) {
            set({ selectedCoins: [...state.selectedCoins, coin] });
          }
        },

        removeCoin: (coin) => {
          const state = get();
          const newSelectedCoins = state.selectedCoins.filter(
            (c) => c !== coin
          );

          // If removing this coin would result in an empty array, automatically select "ALL"
          if (newSelectedCoins.length === 0) {
            set({ selectedCoins: ['ALL'] });
          } else {
            set({ selectedCoins: newSelectedCoins });
          }
        },

        toggleCoin: (coin) => {
          const state = get();
          if (state.selectedCoins.includes(coin)) {
            const newSelectedCoins = state.selectedCoins.filter(
              (c) => c !== coin
            );

            // If toggling off this coin would result in an empty array, automatically select "ALL"
            if (newSelectedCoins.length === 0) {
              set({ selectedCoins: ['ALL'] });
            } else {
              set({ selectedCoins: newSelectedCoins });
            }
          } else {
            set({
              selectedCoins: [...state.selectedCoins, coin],
            });
          }
        },

        resetToDefault: () => set({ selectedCoins: DEFAULT_SELECTED_COINS }),
      }),
      {
        name: 'portfolio-store',
        partialize: (state) => ({
          selectedCoins: state.selectedCoins,
        }),
      }
    ),
    {
      name: 'portfolio-store',
    }
  )
);
