import { createIndexedDBStorage } from '@/lib/zustand-indexeddb-storage';
import logger from '@/lib/loggerInstance';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserFeeEntry {
  exchangeUUID: string;
  symbol: string;
  maker: number;
  taker: number;
}

export interface UserFeesState {
  fees: Record<string, UserFeeEntry>;
  timestamp: number;
  isLoading: boolean;
  error: string | null;
  /** True once IndexedDB rehydration has completed (or failed). Lets callers
   *  distinguish "fees not loaded yet" from "fees loaded, none cached for this
   *  exchange/symbol" so they don't fire redundant fetches during the IDB read
   *  window on hard refresh / HMR. */
  _hasHydrated: boolean;

  // Actions
  setFees: (fees: UserFeeEntry[]) => void;
  getFee: (exchangeUUID: string, symbol: string) => UserFeeEntry | null;
  isExpired: () => boolean;
  clearExpiredFees: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (state: boolean) => void;
  clearAll: () => void;
}
// Create fee key for mapping
const createFeeKey = (exchangeUUID: string, symbol: string): string =>
  `${exchangeUUID}::${symbol}`;

// Backend updates fees every hour at :20 (00:20, 01:20, 02:20, etc.)
// Clear cache at :25 of each hour (5 minutes after backend updates)
const CLEANUP_TARGET_MINUTE = 25; // Clear at :25 of each hour

export const useUserFeesStore = create<UserFeesState>()(
  persist(
    (set, get) => ({
      fees: {},
      timestamp: 0,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setFees: (newFees: UserFeeEntry[]) => {
        set((state) => {
          const updatedFees = { ...state.fees };
          for (const fee of newFees) {
            const key = createFeeKey(fee.exchangeUUID, fee.symbol);
            updatedFees[key] = { ...fee };
          }
          return { fees: updatedFees, error: null, timestamp: Date.now() };
        });
      },

      getFee: (exchangeUUID: string, symbol: string) => {
        const key = createFeeKey(exchangeUUID, symbol);
        const fee = get().fees[key];

        if (!fee) return null;

        return fee;
      },

      isExpired: () => {
        const state = get();
        if (!state.timestamp) return true; // No data = needs fetch

        const now = new Date();
        const lastUpdate = new Date(state.timestamp);

        // Get the most recent :25 boundary
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Calculate the most recent :25 time
        let most25Recent;
        if (currentMinute >= CLEANUP_TARGET_MINUTE) {
          // Current hour's :25 has passed, so the most recent :25 is this hour
          most25Recent = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            currentHour,
            CLEANUP_TARGET_MINUTE,
            0,
            0
          );
        } else {
          // Current hour's :25 hasn't come yet, so the most recent :25 is previous hour
          most25Recent = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            currentHour - 1,
            CLEANUP_TARGET_MINUTE,
            0,
            0
          );
        }

        // If last update was before the most recent :25 and now is after it, then expired
        const wasBeforeLast25 = lastUpdate.getTime() < most25Recent.getTime();
        const nowIsAfterLast25 = now.getTime() >= most25Recent.getTime();

        return wasBeforeLast25 && nowIsAfterLast25;
      },

      clearExpiredFees: () => {
        set(() => {
          return { fees: {}, timestamp: 0 };
        });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      clearAll: () =>
        set({
          fees: {},
          error: null,
          isLoading: false,
          timestamp: 0,
        }),
    }),
    {
      name: 'user-fees-storage',
      storage: createIndexedDBStorage('user-fees-storage'),
      partialize: (state) => ({
        fees: state.fees,
        timestamp: state.timestamp,
      }),
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          ...(persistedState as Partial<UserFeesState>),
          isLoading: false,
          error: null,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          logger.error('[UserFeesStore] Rehydration error:', error);
        }
        // Flip hasHydrated regardless of error — callers should stop waiting
        // and let the network fetch take over even if IDB read failed.
        useUserFeesStore.getState().setHasHydrated(true);
      },
    }
  )
);

// Auto-cleanup timer: Clear cache at :25 of each hour (after backend updates at :20)
if (typeof window !== 'undefined') {
  // Calculate time until next :25 minute mark
  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();

  // Calculate milliseconds until next :25
  let msUntilNextCleanup;
  if (currentMinute < CLEANUP_TARGET_MINUTE) {
    // Same hour, wait until :25
    msUntilNextCleanup =
      (CLEANUP_TARGET_MINUTE - currentMinute) * 60 * 1000 -
      currentSecond * 1000;
  } else {
    // Next hour, wait until next :25
    msUntilNextCleanup =
      (60 - currentMinute + CLEANUP_TARGET_MINUTE) * 60 * 1000 -
      currentSecond * 1000;
  }

  // Set initial timeout to align with :25 minute mark
  setTimeout(() => {
    // Run cleanup immediately when we hit :25
    try {
      const state = useUserFeesStore.getState();
      if (state.isExpired()) {
        state.clearExpiredFees();
        console.debug(
          '[UserFeesStore] Automatically cleared expired fees cache at :25'
        );
      }
    } catch (error) {
      console.error('[UserFeesStore] Error during automatic cleanup:', error);
    }

    // Then set up hourly interval to run at :25 of each hour
    setInterval(
      () => {
        try {
          const state = useUserFeesStore.getState();
          if (state.isExpired()) {
            state.clearExpiredFees();
            console.debug(
              '[UserFeesStore] Automatically cleared expired fees cache at :25'
            );
          }
        } catch (error) {
          console.error(
            '[UserFeesStore] Error during automatic cleanup:',
            error
          );
        }
      },
      60 * 60 * 1000
    ); // Run every hour
  }, msUntilNextCleanup);
}
