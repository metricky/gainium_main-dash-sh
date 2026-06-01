import logger from '@/lib/loggerInstance';
import { createQueuedIndexedDBStorage } from '@/lib/zustand-indexeddb-storage';
import type { OrderData } from '@/types';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { OrderUpdate } from '../../services/websocket/BotWebSocketManager';

// Migration function to convert array-based orders to object-based
const migrateOrderData = (
  data:
    | Record<OrderType, Record<string, Record<string, OrderData>>>
    | Record<OrderType, Record<string, OrderData[]>>
): Record<OrderType, Record<string, Record<string, OrderData>>> => {
  if (!data || typeof data !== 'object') {
    return { new: {}, filled: {} };
  }

  const migrated: Record<
    OrderType,
    Record<string, Record<string, OrderData>>
  > = {
    new: {},
    filled: {},
  };

  // Handle both old and new structures
  (['new', 'filled'] as OrderType[]).forEach((orderType) => {
    const typeData = data[orderType];
    if (typeData && typeof typeData === 'object') {
      Object.entries(typeData).forEach(([botId, orders]) => {
        if (Array.isArray(orders)) {
          // Old format: array of orders - convert to object keyed by clientOrderId
          migrated[orderType][botId] = {};
          orders.forEach((order: OrderData) => {
            if (order && order.clientOrderId) {
              migrated[orderType][botId][order.clientOrderId] = order;
            }
          });
        } else if (orders && typeof orders === 'object') {
          // New format: already object keyed by clientOrderId
          migrated[orderType][botId] = orders as Record<string, OrderData>;
        } else {
          // Initialize empty object for invalid data
          migrated[orderType][botId] = {};
        }
      });
    }
  });

  return migrated;
};

export type OrderType = 'filled' | 'new';

interface OrderStoreState {
  // Orders by type, then by bot ID - each bot has orders keyed by clientOrderId
  orders: Record<OrderType, Record<string, Record<string, OrderData>>>;

  // Loading states
  loading: Record<string, boolean>;

  // Error states
  errors: Record<string, string | null>;

  /** True once IndexedDB rehydration has completed. Lets consumers
   *  distinguish "orders not loaded yet" from "fetched and there really are
   *  no orders" so the table doesn't flash empty during the IDB read window. */
  _hasHydrated: boolean;

  // Actions
  updateOrders: (botId: string, orders: OrderData[], type: OrderType) => void;
  updateOrder: (botId: string, order: OrderData, type: OrderType) => void;
  updateOrderFromWebSocket: (update: OrderUpdate, type: OrderType) => void;
  removeOrder: (botId: string, orderId: string, type: OrderType) => void;
  /**
   * Reconcile a single deal's cached orders against an authoritative fetch.
   * Drops any persisted order for `dealId` whose clientOrderId is absent from
   * `freshClientOrderIds` (e.g. canceled in another client) so stale orders
   * don't linger across reloads. Only touches orders belonging to `dealId`.
   */
  reconcileDealOrders: (
    botId: string,
    dealId: string,
    freshClientOrderIds: string[]
  ) => void;
  setOrderLoading: (botId: string, loading: boolean) => void;
  setOrderError: (botId: string, error: string | null) => void;
  setHasHydrated: (state: boolean) => void;
  clearOrders: (botId: string) => void;
  clearAllOrders: () => void;

  // Selectors
  getOrders: (botId: string) => OrderData[];
  getAllOrders: () => Record<string, OrderData[]>;
  getOrder: (botId: string, orderId: string) => OrderData | null;
  isOrderLoading: (botId: string) => boolean;
  getOrderError: (botId: string) => string | null;
}

export const useOrderStore = create<OrderStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        orders: { new: {}, filled: {} },
        loading: {},
        errors: {},
        _hasHydrated: false,
        updateOrders: (botId: string, orders: OrderData[], type: OrderType) => {
          // Convert array to object keyed by clientOrderId
          const currentOrders = get().orders[type][botId] || {};
          const ordersObj: Record<string, OrderData> = {};
          orders.forEach((order) => {
            if (order.clientOrderId) {
              ordersObj[order.clientOrderId] = order;
            }
          });

          set((state) => ({
            orders: {
              ...state.orders,
              [type]: {
                ...state.orders[type],
                [botId]: {
                  ...currentOrders,
                  ...ordersObj,
                },
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

        updateOrder: (botId: string, order: OrderData, type: OrderType) => {
          set((state) => {
            const currentOrders = state.orders[type][botId] || {};

            return {
              orders: {
                ...state.orders,
                [type]: {
                  ...state.orders[type],
                  [botId]: {
                    ...currentOrders,
                    [order.clientOrderId]: order,
                  },
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

        updateOrderFromWebSocket: (update: OrderUpdate, type: OrderType) => {
          const { botId, data } = update;

          // WebSocket sends the full OrderData object
          const order = { ...data, botId } as OrderData;
          // Conflict resolution: Check if we already have this order
          const existingOrders = get().orders[type][botId] || {};
          const existingOrder = existingOrders[order.clientOrderId];

          if (existingOrder && order.updateTime && existingOrder.updateTime) {
            // Compare updateTime (numbers in milliseconds)
            if (order.updateTime < existingOrder.updateTime) {
              // WebSocket data is older, skip update
              logger.debug(
                `[OrderStore] Skipping stale WebSocket update for order ${order.clientOrderId}`,
                {
                  wsTime: order.updateTime,
                  existingTime: existingOrder.updateTime,
                }
              );
              return;
            }
          }
          get().updateOrder(botId, order, type);
        },

        removeOrder: (botId: string, orderId: string, type: OrderType) => {
          set((state) => {
            const currentOrders = state.orders[type][botId] || {};
            const { [orderId]: _removedOrder, ...remainingOrders } =
              currentOrders;

            return {
              orders: {
                ...state.orders,
                [type]: {
                  ...state.orders[type],
                  [botId]: remainingOrders,
                },
              },
            };
          });
        },

        reconcileDealOrders: (
          botId: string,
          dealId: string,
          freshClientOrderIds: string[]
        ) => {
          const fresh = new Set(freshClientOrderIds);
          set((state) => {
            const next = { ...state.orders };
            let changed = false;
            (['new', 'filled'] as OrderType[]).forEach((type) => {
              const bucket = state.orders[type][botId];
              if (!bucket) return;
              const kept: Record<string, OrderData> = {};
              let removed = false;
              for (const [coid, order] of Object.entries(bucket)) {
                // Only prune orders that belong to this deal and are no longer
                // returned by the backend; leave other deals untouched.
                if (order.dealId === dealId && !fresh.has(coid)) {
                  removed = true;
                  continue;
                }
                kept[coid] = order;
              }
              if (removed) {
                changed = true;
                next[type] = { ...state.orders[type], [botId]: kept };
              }
            });
            return changed ? { orders: next } : {};
          });
        },

        setOrderLoading: (botId: string, loading: boolean) => {
          set((state) => ({
            loading: {
              ...state.loading,
              [botId]: loading,
            },
          }));
        },

        setOrderError: (botId: string, error: string | null) => {
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

        clearOrders: (botId: string) => {
          set((state) => {
            const { [botId]: _, ...remainingOrders } = state.orders.new;
            const { [botId]: __, ...remainingFilledOrders } =
              state.orders.filled;
            const { [botId]: ___, ...remainingLoading } = state.loading;
            const { [botId]: ____, ...remainingErrors } = state.errors;

            return {
              orders: {
                new: remainingOrders,
                filled: remainingFilledOrders,
              },
              loading: remainingLoading,
              errors: remainingErrors,
            };
          });
        },

        clearAllOrders: () => {
          set({
            orders: {
              new: {},
              filled: {},
            },
            loading: {},
            errors: {},
          });
        },

        getOrders: (botId: string) => {
          const newOrdersObj = get().orders.new[botId] || {};
          const filledOrdersObj = get().orders.filled[botId] || {};
          return [
            ...Object.values(newOrdersObj),
            ...Object.values(filledOrdersObj),
          ];
        },

        getAllOrders: () => {
          const combinedOrders: Record<string, OrderData[]> = {};
          const newOrders = get().orders.new;
          const filledOrders = get().orders.filled;

          // Combine orders from both 'new' and 'filled' types
          for (const botId in newOrders) {
            combinedOrders[botId] = [
              ...(combinedOrders[botId] || []),
              ...Object.values(newOrders[botId]),
            ];
          }

          for (const botId in filledOrders) {
            combinedOrders[botId] = [
              ...(combinedOrders[botId] || []),
              ...Object.values(filledOrders[botId]),
            ];
          }

          return combinedOrders;
        },

        getOrder: (botId: string, orderId: string) => {
          const newOrdersObj = get().orders.new[botId] || {};
          const filledOrdersObj = get().orders.filled[botId] || {};

          return newOrdersObj[orderId] || filledOrdersObj[orderId] || null;
        },

        isOrderLoading: (botId: string) => {
          return get().loading[botId] || false;
        },

        getOrderError: (botId: string) => {
          return get().errors[botId] || null;
        },

        setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      }),
      {
        name: 'orders-store',
        storage: createQueuedIndexedDBStorage('orders-store'),
        // Persist only FILLED (historical, immutable) orders. Pending/'new'
        // orders are live data — persisting them lets a stale order (e.g. one
        // canceled in another client/session) reappear on reload, since the
        // store merges rather than replaces. They are cheap to re-fetch and
        // are always reloaded on mount, so we keep them out of IndexedDB.
        partialize: (state) => ({
          orders: { new: {}, filled: state.orders.filled },
        }),
        // Merge persisted data with initial state and migrate if necessary
        merge: (persistedState, currentState) => {
          const state = persistedState as Partial<OrderStoreState>;
          let migratedOrders = { new: {}, filled: {} };

          if (state.orders) {
            try {
              migratedOrders = migrateOrderData(state.orders);
              logger.info(
                '[OrderStore] Successfully migrated order data structure'
              );
            } catch (error) {
              logger.error('[OrderStore] Failed to migrate order data:', error);
              migratedOrders = { new: {}, filled: {} };
            }
          }

          return {
            ...currentState,
            ...state,
            // Never restore pending ('new') orders from storage — they're live
            // data and a stale one would reappear until the next fetch prunes
            // it. Keep only persisted filled history; pending is re-fetched on
            // mount. (Defends against IndexedDB written before this policy.)
            orders: { new: {}, filled: migratedOrders.filled },
            // Reset loading/error states on hydration
            loading: {},
            errors: {},
          };
        },
        onRehydrateStorage: () => (_state, error) => {
          if (error) {
            logger.error('[OrderStore] Rehydration error:', error);
          }
          useOrderStore.getState().setHasHydrated(true);
        },
      }
    ),
    {
      name: 'order-store',
    }
  )
);
