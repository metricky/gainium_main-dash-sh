import logger from '@/lib/loggerInstance';
import { createIndexedDBStorage } from '@/lib/zustand-indexeddb-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UsdRateState {
  rate: number;
  timestamp: number;
  isLoading: boolean;
  error: string | null;
  /** True once IndexedDB rehydration has completed (or failed). Lets callers
   *  distinguish "rate not loaded yet" from "rate is genuinely 0" so we don't
   *  fire a redundant fetch (or render USD as 0) during the IDB read window. */
  _hasHydrated: boolean;

  // Actions
  setRate: (rate: number) => void;
  isExpired: () => boolean;
  clearRate: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useUsdRateStore = create<UsdRateState>()(
  persist(
    (set, get) => ({
      rate: 0,
      timestamp: 0,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setRate: (rate: number) => {
        set({ rate, timestamp: Date.now(), error: null });
      },

      isExpired: () => {
        const state = get();
        if (!state.timestamp) return true; // No data = needs fetch

        const now = new Date();
        const lastUpdate = new Date(state.timestamp);

        // Backend updates USD rate every 12 hours (00:00, 12:00)
        // Check if we've crossed a 12-hour boundary since last update
        const currentHour = now.getHours();

        // Calculate the most recent 12-hour boundary (00:00 or 12:00)
        let recentBoundary;
        if (currentHour >= 12) {
          // Current time is PM, most recent boundary is 12:00 today
          recentBoundary = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            12,
            0,
            0,
            0
          );
        } else {
          // Current time is AM, most recent boundary is 00:00 today
          recentBoundary = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0,
            0
          );
        }

        // If last update was before the most recent 12-hour boundary and now is after it, then expired
        const wasBeforeBoundary =
          lastUpdate.getTime() < recentBoundary.getTime();
        const nowIsAfterBoundary = now.getTime() >= recentBoundary.getTime();

        return wasBeforeBoundary && nowIsAfterBoundary;
      },

      clearRate: () => {
        set({ rate: 0, timestamp: 0, error: null });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'usd-rate-storage',
      storage: createIndexedDBStorage('usd-rate-storage'),
      partialize: (state) => ({
        rate: state.rate,
        timestamp: state.timestamp,
      }),
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          ...(persistedState as Partial<UsdRateState>),
          isLoading: false,
          error: null,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          logger.error('[UsdRateStore] Rehydration error:', error);
        }
        useUsdRateStore.getState().setHasHydrated(true);
      },
    }
  )
);

// Auto-cleanup timer: Check every 4 hours and clear if expired
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      try {
        const state = useUsdRateStore.getState();
        if (state.isExpired()) {
          state.clearRate();
          logger.debug(
            '[UsdRateStore] Automatically cleared expired USD rate cache'
          );
        }
      } catch (error) {
        logger.error('[UsdRateStore] Error during automatic cleanup:', error);
      }
    },
    4 * 60 * 60 * 1000
  ); // Check every 4 hours
}
