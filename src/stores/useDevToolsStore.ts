import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DevToolTab = 'logger' | 'query-cache' | 'triggers';

interface DevToolsState {
  // Drawer state
  isOpen: boolean;
  activeTab: DevToolTab;

  // Button position (stored in localStorage)
  buttonPosition: { x: number; y: number };

  // Actions
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setActiveTab: (tab: DevToolTab) => void;
  setButtonPosition: (position: { x: number; y: number }) => void;
}

export const useDevToolsStore = create<DevToolsState>()(
  persist(
    (set) => ({
      // Initial state
      isOpen: false,
      activeTab: 'logger',
      buttonPosition: {
        x: window.innerWidth - 80,
        y: window.innerHeight - 300,
      },

      // Actions
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setButtonPosition: (position) => set({ buttonPosition: position }),
    }),
    {
      name: 'dev-tools-storage',
      // Persist button position, activeTab, and isOpen state
      partialize: (state) => ({
        buttonPosition: state.buttonPosition,
        activeTab: state.activeTab,
        isOpen: state.isOpen,
      }),
    }
  )
);
