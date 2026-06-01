import logger from '@/lib/loggerInstance';
import { createQueuedIndexedDBStorage } from '@/lib/zustand-indexeddb-storage';
import type { DCADeals } from '@/types';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { DealUpdate } from '../../services/websocket/BotWebSocketManager';
import { WebSocketDebouncer } from './webSocketDebouncer';

export type DealType = 'dca' | 'combo' | 'terminal';

export interface DealWithType extends DCADeals {
  dealType: DealType;
}

interface DealStoreState {
  // Deals by bot ID (includes type for filtering) - each bot has deals keyed by deal ID
  deals: Record<string, Record<string, DealWithType>>;

  // Loading states
  loading: Record<string, boolean>;

  // Error states
  errors: Record<string, string | null>;

  /** True once IndexedDB rehydration has completed. Lets consumers
   *  distinguish "deals not loaded yet" from "fetched and there really are no
   *  deals" so the table doesn't flash empty during the IDB read window. */
  _hasHydrated: boolean;

  // Actions
  updateDeals: (
    botId: string,
    deals: DCADeals[],
    dealType: DealType,
    replace?: boolean
  ) => void;
  updateDeal: (botId: string, deal: DCADeals, dealType: DealType) => void;
  updateDealFromWebSocket: (update: DealUpdate, dealType: DealType) => void;
  applyBatchedDealUpdates: (
    updates: Array<DealUpdate & { dealType?: DealType }>
  ) => void;
  removeDeal: (botId: string, dealId: string) => void;
  setDealLoading: (botId: string, loading: boolean) => void;
  setDealError: (botId: string, error: string | null) => void;
  setHasHydrated: (state: boolean) => void;
  clearDeals: (botId: string) => void;
  clearAllDeals: () => void;

  // Selectors
  getDeals: (botId: string, dealType?: DealType) => DealWithType[];
  getAllDeals: (dealType?: DealType) => Record<string, DealWithType[]>;
  getDeal: (botId: string, dealId: string) => DealWithType | null;
  getActiveDeals: (botId: string, dealType?: DealType) => DealWithType[];
  getClosedDeals: (botId: string, dealType?: DealType) => DealWithType[];
  isDealLoading: (botId: string) => boolean;
  getDealError: (botId: string) => string | null;
}

// Migration function to convert array-based deals to object-based
const migrateDealData = (
  data:
    | Record<string, DealWithType[]>
    | Record<string, Record<string, DealWithType>>
): Record<string, Record<string, DealWithType>> => {
  if (!data || typeof data !== 'object') return {};

  const migrated: Record<string, Record<string, DealWithType>> = {};

  Object.entries(data).forEach(([botId, deals]) => {
    if (Array.isArray(deals)) {
      // Old format: array of deals - convert to object keyed by deal ID
      migrated[botId] = {};
      deals.forEach((deal: DealWithType) => {
        if (deal && deal._id) {
          migrated[botId][deal._id] = deal;
        }
      });
    } else if (deals && typeof deals === 'object') {
      // New format: already object keyed by deal ID
      migrated[botId] = deals as Record<string, DealWithType>;
    } else {
      // Initialize empty object for invalid data
      migrated[botId] = {};
    }
  });

  return migrated;
};

// Create debouncer instance
type DealUpdateWithType = DealUpdate & { dealType?: DealType };
let wsDebouncer: WebSocketDebouncer<DealUpdateWithType> | null = null;

export const useDealStore = create<DealStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        deals: {},
        loading: {},
        errors: {},
        _hasHydrated: false,
        updateDeals: (botId, deals, dealType, replace) => {
          set((state) => {
            const currentDeals = replace ? {} : state.deals[botId] || {};
            const newDeals: Record<string, DealWithType> = {};

            deals.forEach((deal) => {
              const dealWithType: DealWithType = { ...deal, dealType };
              newDeals[deal._id] = dealWithType;
            });

            return {
              deals: {
                ...state.deals,
                [botId]: {
                  ...currentDeals,
                  ...newDeals,
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
        updateDeal: (botId: string, deal: DCADeals, dealType: DealType) => {
          set((state) => {
            const currentDeals = state.deals[botId] || {};
            const dealWithType: DealWithType = { ...deal, dealType };

            return {
              deals: {
                ...state.deals,
                [botId]: {
                  ...currentDeals,
                  [deal._id]: dealWithType,
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

        updateDealFromWebSocket: (update: DealUpdate, dealType?: DealType) => {
          // Initialize debouncer on first use
          if (!wsDebouncer) {
            wsDebouncer = new WebSocketDebouncer<DealUpdateWithType>(
              (updates) => get().applyBatchedDealUpdates(updates),
              (update) => update.botId,
              50
            );
          }

          const updateWithType: DealUpdateWithType = { ...update, dealType };
          wsDebouncer.enqueue(updateWithType);
        },

        applyBatchedDealUpdates: (updates) => {
          const state = get();
          const updatedDeals = { ...state.deals };
          let hasChanges = false;
          updates.forEach(({ botId, data, dealType }) => {
            const deal = data as unknown as DCADeals;
            const existingBotDeals = updatedDeals[botId] || {};
            const existingDeal = existingBotDeals[deal._id];
            const wsPaperContext =
              typeof (data as { paperContext?: unknown }).paperContext ===
              'boolean'
                ? ((data as { paperContext?: boolean }).paperContext as boolean)
                : undefined;

            // Conflict resolution
            if (existingDeal && deal.updateTime) {
              if (deal.updateTime < existingDeal.updateTime) {
                logger.debug(
                  `[DealStore] Skipping stale WebSocket update for deal ${deal._id}`,
                  {
                    wsTime: deal.updateTime,
                    existingTime: existingDeal.updateTime,
                  }
                );
                return;
              }
            }

            if (
              existingDeal &&
              typeof wsPaperContext === 'boolean' &&
              typeof existingDeal.paperContext === 'boolean' &&
              wsPaperContext !== existingDeal.paperContext
            ) {
              logger.debug(
                `[DealStore] Skipping cross-context WebSocket update for deal ${deal._id}`,
                {
                  wsPaperContext,
                  existingPaperContext: existingDeal.paperContext,
                }
              );
              return;
            }

            // Create deal with type
            const dealWithType: DealWithType = {
              ...deal,
              paperContext:
                typeof deal.paperContext === 'boolean'
                  ? deal.paperContext
                  : wsPaperContext,
              dealType: dealType || existingDeal?.dealType || 'dca',
            };

            // Update the bot's deals object
            updatedDeals[botId] = {
              ...existingBotDeals,
              [deal._id]: dealWithType,
            };

            hasChanges = true;
          });

          if (hasChanges) {
            set({ deals: updatedDeals });
          }
        },

        removeDeal: (botId: string, dealId: string) => {
          set((state) => {
            const currentDeals = state.deals[botId] || {};
            const { [dealId]: _removedDeal, ...remainingDeals } = currentDeals;

            return {
              deals: {
                ...state.deals,
                [botId]: remainingDeals,
              },
            };
          });
        },

        setDealLoading: (botId: string, loading: boolean) => {
          set((state) => ({
            loading: {
              ...state.loading,
              [botId]: loading,
            },
          }));
        },

        setDealError: (botId: string, error: string | null) => {
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

        clearDeals: (botId: string) => {
          set((state) => {
            const { [botId]: _, ...remainingDeals } = state.deals;
            const { [botId]: __, ...remainingLoading } = state.loading;
            const { [botId]: ___, ...remainingErrors } = state.errors;

            return {
              deals: remainingDeals,
              loading: remainingLoading,
              errors: remainingErrors,
            };
          });
        },

        clearAllDeals: () => {
          set({
            deals: {},
            loading: {},
            errors: {},
          });
        },

        getDeals: (botId: string, dealType?: DealType) => {
          const dealsObj = get().deals[botId] || {};
          const deals = Object.values(dealsObj);
          if (dealType) {
            return deals.filter((d) => d.dealType === dealType);
          }
          return deals;
        },

        getAllDeals: (dealType?: DealType) => {
          const allDeals = get().deals;
          const result: Record<string, DealWithType[]> = {};

          Object.entries(allDeals).forEach(([botId, dealsObj]) => {
            const deals = Object.values(dealsObj);
            const filteredDeals = dealType
              ? deals.filter((d) => d.dealType === dealType)
              : deals;

            if (filteredDeals.length > 0) {
              result[botId] = filteredDeals;
            }
          });
          return result;
        },

        getDeal: (botId: string, dealId: string) => {
          const botDeals = get().deals[botId] || {};
          return botDeals[dealId] || null;
        },

        getActiveDeals: (botId: string, dealType?: DealType) => {
          const botDealsObj = get().deals[botId] || {};
          const botDeals = Object.values(botDealsObj);
          let filtered = botDeals.filter(
            (d) => d.status === 'open' || d.status === 'start'
          );
          if (dealType) {
            filtered = filtered.filter((d) => d.dealType === dealType);
          }
          return filtered;
        },

        getClosedDeals: (botId: string, dealType?: DealType) => {
          const botDealsObj = get().deals[botId] || {};
          const botDeals = Object.values(botDealsObj);
          let filtered = botDeals.filter((d) => d.status === 'closed');
          if (dealType) {
            filtered = filtered.filter((d) => d.dealType === dealType);
          }
          return filtered;
        },

        isDealLoading: (botId: string) => {
          return get().loading[botId] || false;
        },

        getDealError: (botId: string) => {
          return get().errors[botId] || null;
        },

        setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      }),
      {
        name: 'deals-store',
        storage: createQueuedIndexedDBStorage('deals-store'),
        // Only persist bot data, not loading/error states
        partialize: (state) => ({
          deals: state.deals,
        }),
        // Merge persisted data with initial state and migrate if necessary
        merge: (persistedState, currentState) => {
          const state = persistedState as Partial<DealStoreState>;
          let migratedDeals = {};

          if (state.deals) {
            try {
              migratedDeals = migrateDealData(state.deals);
              logger.info(
                '[DealStore] Successfully migrated deal data structure'
              );
            } catch (error) {
              logger.error('[DealStore] Failed to migrate deal data:', error);
              migratedDeals = {};
            }
          }

          return {
            ...currentState,
            ...state,
            deals: migratedDeals,
            // Reset loading/error states on hydration
            loading: {},
            errors: {},
          };
        },
        onRehydrateStorage: () => (_state, error) => {
          if (error) {
            logger.error('[DealStore] Rehydration error:', error);
          }
          useDealStore.getState().setHasHydrated(true);
        },
      }
    ),
    {
      name: 'deal-store',
    }
  )
);
