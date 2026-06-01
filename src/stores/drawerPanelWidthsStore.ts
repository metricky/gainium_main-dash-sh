import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIndexedDBStorage } from '@/lib/zustand-indexeddb-storage';
import logger from '@/lib/loggerInstance';

/**
 * Store for persisting DetailDrawer panel widths
 * Organized by bot type to maintain separate sizing for different bot types
 */

export type BotType =
  | 'dca'
  | 'combo'
  | 'grid'
  | 'hedge-dca'
  | 'hedge-combo'
  | 'terminal'
  | 'signal';

export interface PanelWidths {
  left: number;
  right: number;
}

// Store state interface
interface DrawerPanelWidthsState {
  // Panel widths by bot type
  widths: Partial<Record<BotType, PanelWidths>>;
  // Shared total drawer width across bot types and trades
  totalWidth: number | null;
  // Hydration tracking
  _hasHydrated: boolean;

  // Actions
  setPanelWidths: (botType: BotType, widths: PanelWidths) => void;
  getPanelWidths: (botType: BotType) => PanelWidths | undefined;
  resetPanelWidths: (botType: BotType) => void;
  resetAllPanelWidths: () => void;
  setTotalWidth: (width: number) => void;
  setHasHydrated: (state: boolean) => void;
}

// Default widths
const DEFAULT_WIDTHS: PanelWidths = {
  left: 640,
  right: 640,
};

// Create the store with persistence
export const useDrawerPanelWidthsStore = create<DrawerPanelWidthsState>()(
  persist(
    (set, get) => ({
      widths: {},
      totalWidth: null,
      _hasHydrated: false,

      setPanelWidths: (botType: BotType, widths: PanelWidths) => {
        logger.info('[DrawerPanelWidths] Setting panel widths', {
          botType,
          widths,
        });
        set((state) => ({
          widths: {
            ...state.widths,
            [botType]: widths,
          },
        }));
      },

      setTotalWidth: (width: number) => {
        if (!Number.isFinite(width) || width <= 0) {
          return;
        }
        set({ totalWidth: width });
      },

      getPanelWidths: (botType: BotType) => {
        return get().widths[botType];
      },

      resetPanelWidths: (botType: BotType) => {
        set((state) => {
          const newWidths = { ...state.widths };
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete newWidths[botType];
          return { widths: newWidths };
        });
      },

      resetAllPanelWidths: () => {
        set({ widths: {}, totalWidth: null });
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'drawer-panel-widths-storage',
      version: 1,
      storage: createIndexedDBStorage('drawer-panel-widths-storage'),
      partialize: (state) => ({
        widths: state.widths,
        totalWidth: state.totalWidth,
      }),
      onRehydrateStorage: () => (state) => {
        logger.info('[DrawerPanelWidths] Rehydrated from storage', {
          widths: state?.widths,
          totalWidth: state?.totalWidth,
        });
        useDrawerPanelWidthsStore.getState().setHasHydrated(true);
      },
    }
  )
);

// Hook to get panel widths with defaults for a specific bot type
export const useDrawerPanelWidths = (
  botType: BotType,
  defaultWidths: PanelWidths = DEFAULT_WIDTHS
) => {
  const { widths, setPanelWidths } = useDrawerPanelWidthsStore();

  const panelWidths = widths[botType] ?? defaultWidths;

  return {
    panelWidths,
    setPanelWidths: (widths: PanelWidths) => setPanelWidths(botType, widths),
  };
};
