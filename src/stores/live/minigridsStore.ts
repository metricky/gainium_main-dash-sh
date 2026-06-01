import logger from '@/lib/loggerInstance';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { WebSocketDebouncer } from './webSocketDebouncer';

// ComboMinigrid type from dash/types/index.ts
export enum ComboMinigridStatusEnum {
  active = 'active',
  range = 'range',
  closed = 'closed',
}

interface Balance {
  base: number;
  quote: number;
}

export interface ComboMinigrid {
  _id: string;
  botId: string;
  userId: string;
  dealId: string;
  dcaOrderId: string;
  grids: { buy: number; sell: number };
  status: ComboMinigridStatusEnum;
  initialBalances: Balance;
  currentBalances: Balance;
  initialPrice: number;
  realInitialPrice: number;
  lastPrice: number;
  profit: {
    total: number;
    totalUsd: number;
  };
  avgPrice: number;
  createTime: number;
  updateTime: number;
  closeTime?: number;
  assets: { used: Balance; required: Balance };
  paperContext?: boolean;
  exchange: string;
  exchangeUUID: string;
  symbol: {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
  };
  settings: {
    topPrice: number;
    lowPrice: number;
    levels: number;
    budget: number;
    sellDisplacement: number;
  };
  transactions: {
    buy: number;
    sell: number;
  };
}

interface MinigridsStoreState {
  // Minigrids by bot ID - each bot has minigrids keyed by minigrid ID
  minigrids: Record<string, Record<string, ComboMinigrid>>;

  // Loading states
  loading: Record<string, boolean>;

  // Error states
  errors: Record<string, string | null>;

  // Actions
  updateMinigrid: (minigrid: ComboMinigrid) => void;
  updateMinigridFromWebSocket: (update: {
    botId: string;
    data: ComboMinigrid;
  }) => void;
  applyBatchedMinigridUpdates: (
    updates: Array<{
      botId: string;
      data: ComboMinigrid;
    }>
  ) => void;
  updateMinigrids: (botId: string, minigrids: ComboMinigrid[]) => void;
  removeMinigrid: (botId: string, minigridId: string) => void;
  setMinigridsLoading: (botId: string, loading: boolean) => void;
  setMinigridsError: (botId: string, error: string | null) => void;
  clearMinigrids: (botId: string) => void;
  clearAllMinigrids: () => void;

  // Selectors
  getMinigrids: (botId: string) => ComboMinigrid[];
  getAllMinigrids: () => Record<string, ComboMinigrid[]>;
  getMinigrid: (botId: string, minigridId: string) => ComboMinigrid | null;
  getActiveMinigrids: (botId: string) => ComboMinigrid[];
  getClosedMinigrids: (botId: string) => ComboMinigrid[];
  isMinigridsLoading: (botId: string) => boolean;
  getMinigridsError: (botId: string) => string | null;
}

// Create debouncer instance
let wsDebouncer: WebSocketDebouncer<{
  botId: string;
  data: ComboMinigrid;
}> | null = null;

export const useMinigridsStore = create<MinigridsStoreState>()(
  devtools(
    (set, get) => ({
      minigrids: {},
      loading: {},
      errors: {},

      updateMinigrid: (minigrid: ComboMinigrid) => {
        const { botId } = minigrid;
        set((state) => {
          const currentMinigrids = state.minigrids[botId] || {};

          return {
            minigrids: {
              ...state.minigrids,
              [botId]: {
                ...currentMinigrids,
                [minigrid._id]: minigrid,
              },
            },
            loading: {
              ...state.loading,
              [botId]: false,
            },
            errors: {
              ...state.errors,
              [botId]: null,
            },
          };
        });
      },

      updateMinigridFromWebSocket: (update: {
        botId: string;
        data: ComboMinigrid;
      }) => {
        // Initialize debouncer on first use
        if (!wsDebouncer) {
          wsDebouncer = new WebSocketDebouncer(
            (updates) => get().applyBatchedMinigridUpdates(updates),
            (update) => update.botId,
            50
          );
        }

        wsDebouncer.enqueue(update);
      },

      applyBatchedMinigridUpdates: (updates) => {
        const state = get();
        const updatedMinigrids = { ...state.minigrids };
        let hasChanges = false;

        updates.forEach(({ botId, data }) => {
          const existingBotMinigrids = updatedMinigrids[botId] || {};
          const existingMinigrid = existingBotMinigrids[data._id];

          // Conflict resolution
          if (existingMinigrid && data.updateTime) {
            if (data.updateTime < existingMinigrid.updateTime) {
              logger.debug(
                `[MinigridsStore] Skipping stale WebSocket update for minigrid ${data._id}`,
                {
                  wsTime: data.updateTime,
                  existingTime: existingMinigrid.updateTime,
                }
              );
              return;
            }
          }

          // Update the bot's minigrids object
          updatedMinigrids[botId] = {
            ...existingBotMinigrids,
            [data._id]: data,
          };

          hasChanges = true;
        });

        if (hasChanges) {
          set({ minigrids: updatedMinigrids });
        }
      },

      updateMinigrids: (botId: string, minigrids: ComboMinigrid[]) => {
        // Convert array to object keyed by minigrid ID
        const minigridsObj: Record<string, ComboMinigrid> = {};
        minigrids.forEach((minigrid) => {
          if (minigrid._id) {
            minigridsObj[minigrid._id] = minigrid;
          }
        });

        set((state) => ({
          minigrids: {
            ...state.minigrids,
            [botId]: {
              ...(state.minigrids[botId] || {}),
              ...minigridsObj,
            },
          },
          loading: {
            ...state.loading,
            [botId]: false,
          },
          errors: {
            ...state.errors,
            [botId]: null,
          },
        }));
      },

      removeMinigrid: (botId: string, minigridId: string) => {
        set((state) => {
          const currentMinigrids = state.minigrids[botId] || {};
          const { [minigridId]: _removedMinigrid, ...remainingMinigrids } =
            currentMinigrids;

          return {
            minigrids: {
              ...state.minigrids,
              [botId]: remainingMinigrids,
            },
          };
        });
      },

      setMinigridsLoading: (botId: string, loading: boolean) => {
        set((state) => ({
          loading: {
            ...state.loading,
            [botId]: loading,
          },
        }));
      },

      setMinigridsError: (botId: string, error: string | null) => {
        set((state) => ({
          errors: {
            ...state.errors,
            [botId]: error,
          },
          loading: {
            ...state.loading,
            [botId]: false,
          },
        }));
      },

      clearMinigrids: (botId: string) => {
        set((state) => {
          const { [botId]: _, ...remainingMinigrids } = state.minigrids;
          const { [botId]: __, ...remainingLoading } = state.loading;
          const { [botId]: ___, ...remainingErrors } = state.errors;

          return {
            minigrids: remainingMinigrids,
            loading: remainingLoading,
            errors: remainingErrors,
          };
        });
      },

      clearAllMinigrids: () => {
        set({
          minigrids: {},
          loading: {},
          errors: {},
        });
      },

      getMinigrids: (botId: string) => {
        const minigridsObj = get().minigrids[botId] || {};
        return Object.values(minigridsObj);
      },

      getAllMinigrids: () => {
        const allMinigrids = get().minigrids;
        const result: Record<string, ComboMinigrid[]> = {};

        Object.entries(allMinigrids).forEach(([botId, minigridsObj]) => {
          result[botId] = Object.values(minigridsObj);
        });

        return result;
      },

      getMinigrid: (botId: string, minigridId: string) => {
        const botMinigrids = get().minigrids[botId] || {};
        return botMinigrids[minigridId] || null;
      },

      getActiveMinigrids: (botId: string) => {
        const botMinigridsObj = get().minigrids[botId] || {};
        const botMinigrids = Object.values(botMinigridsObj);
        return botMinigrids.filter(
          (m) =>
            m.status === ComboMinigridStatusEnum.active ||
            m.status === ComboMinigridStatusEnum.range
        );
      },

      getClosedMinigrids: (botId: string) => {
        const botMinigridsObj = get().minigrids[botId] || {};
        const botMinigrids = Object.values(botMinigridsObj);
        return botMinigrids.filter(
          (m) => m.status === ComboMinigridStatusEnum.closed
        );
      },

      isMinigridsLoading: (botId: string) => {
        return get().loading[botId] || false;
      },

      getMinigridsError: (botId: string) => {
        return get().errors[botId] || null;
      },
    }),
    {
      name: 'minigrids-store',
    }
  )
);
