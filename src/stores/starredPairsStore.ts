import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StarredPairsState {
  /** Keyed by the selector's selection symbol (e.g. `BTC-USDT`). */
  starredPairIds: Set<string>;
  toggleStarredPair: (pairId: string) => void;
  isStarredPair: (pairId: string) => boolean;
}

export const useStarredPairsStore = create<StarredPairsState>()(
  persist(
    (set, get) => ({
      starredPairIds: new Set<string>(),

      toggleStarredPair: (pairId: string) => {
        set((state) => {
          const next = new Set(state.starredPairIds);
          if (next.has(pairId)) {
            next.delete(pairId);
          } else {
            next.add(pairId);
          }
          return { starredPairIds: next };
        });
      },

      isStarredPair: (pairId: string) => {
        return get().starredPairIds.has(pairId);
      },
    }),
    {
      name: 'gainium:starredPairs',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            state: {
              ...parsed.state,
              starredPairIds: new Set(parsed.state.starredPairIds || []),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            state: {
              ...value.state,
              starredPairIds: Array.from(value.state.starredPairIds),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
