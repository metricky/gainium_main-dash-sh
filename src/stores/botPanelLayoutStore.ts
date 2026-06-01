import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store for persisting BotPanelLayout panel sizes
 * Organized by bot type to maintain separate layouts for different bot types
 */

export type BotType =
  | 'dca'
  | 'combo'
  | 'grid'
  | 'hedge-dca'
  | 'hedge-combo'
  | 'terminal'
  | 'signal'
  | 'journal';

/**
 * Panel layout sizes stored as percentages or pixels depending on the panel group
 */
export interface PanelLayoutSizes {
  // Desktop layout
  desktopTopSplit?: number[]; // [chart%, form%]
  desktopVerticalSplit?: number[]; // [upper%, lower%]

  // Mobile layout
  mobileStackSplit?: number[]; // [chart%, remaining%]
  mobileLowerSplit?: number[]; // [form%, insights%]

  // Collapsed states
  isChartCollapsed?: boolean;
  isFormCollapsed?: boolean;
  isBottomCollapsed?: boolean;
  isMobileLowerCollapsed?: boolean;

  // Mobile tab selection
  mobileActiveTab?: 'settings' | 'chart' | 'backtests';
}

// Store state interface
interface BotPanelLayoutState {
  // Panel layouts by bot type
  layouts: Partial<Record<BotType, PanelLayoutSizes>>;

  // Actions
  setPanelLayout: (botType: BotType, layout: PanelLayoutSizes) => void;
  getPanelLayout: (botType: BotType) => PanelLayoutSizes | undefined;
  resetPanelLayout: (botType: BotType) => void;
  resetAllPanelLayouts: () => void;
}

// Create the store with persistence
export const useBotPanelLayoutStore = create<BotPanelLayoutState>()(
  persist(
    (set, get) => ({
      layouts: {},

      setPanelLayout: (botType: BotType, layout: PanelLayoutSizes) => {
        set((state) => ({
          layouts: {
            ...state.layouts,
            [botType]: layout,
          },
        }));
      },

      getPanelLayout: (botType: BotType) => {
        return get().layouts[botType];
      },

      resetPanelLayout: (botType: BotType) => {
        set((state) => {
          const { [botType]: _, ...rest } = state.layouts;
          return { layouts: rest };
        });
      },

      resetAllPanelLayouts: () => {
        set({ layouts: {} });
      },
    }),
    {
      name: 'bot-panel-layouts',
      version: 2,
    }
  )
);
