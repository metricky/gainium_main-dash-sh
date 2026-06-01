import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Store for persisting floating button positions
 * Each button can have its own position tracked by a unique ID
 */

export interface ButtonPosition {
  x: number;
  y: number;
}

interface FloatingButtonsState {
  positions: Record<string, ButtonPosition>;
  setPosition: (buttonId: string, position: ButtonPosition) => void;
  getPosition: (buttonId: string) => ButtonPosition;
  resetPosition: (buttonId: string) => void;
  resetAllPositions: () => void;
}

// Default positions for different screen sizes
const getDefaultPosition = (): ButtonPosition => {
  if (typeof window === 'undefined') {
    return { x: 16, y: 16 }; // Default for SSR
  }

  // Default: bottom-right corner with some padding
  const isMobile = window.innerWidth < 768;
  return {
    x: window.innerWidth - (isMobile ? 72 : 72), // 16px padding + 56px button width
    y: window.innerHeight - (isMobile ? 144 : 72), // More padding on mobile for bottom nav
  };
};

export const useFloatingButtonsStore = create<FloatingButtonsState>()(
  persist(
    (set, get) => ({
      positions: {},

      setPosition: (buttonId: string, position: ButtonPosition) =>
        set((state) => ({
          positions: {
            ...state.positions,
            [buttonId]: position,
          },
        })),

      getPosition: (buttonId: string): ButtonPosition => {
        const stored = get().positions[buttonId];
        if (stored) {
          return stored;
        }
        return getDefaultPosition();
      },

      resetPosition: (buttonId: string) =>
        set((state) => {
          const { [buttonId]: _, ...newPositions } = state.positions;
          return { positions: newPositions };
        }),

      resetAllPositions: () => set({ positions: {} }),
    }),
    {
      name: 'floating-buttons-positions',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
