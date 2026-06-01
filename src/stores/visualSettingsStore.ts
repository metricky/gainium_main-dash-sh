import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type SpacingMode = 'comfortable' | 'compact';

interface VisualSettingsState {
  // Visual preferences
  theme: ThemeMode;
  spacing: SpacingMode;
  /**
   * Base font size in pixels (10-24px range, default: 14px)
   *
   * This is the root font size that all Tailwind font size classes scale from.
   * When changed, all text using Tailwind classes (text-xs, text-sm, text-lg, etc.)
   * will scale proportionally via the --base-font-size CSS variable.
   *
   * The value is automatically clamped to the 10-24px range by setFontSize().
   */
  fontSize: number;
  visualEffects: boolean; // Controls blur, transparency, and advanced CSS effects

  // Navbar options
  showTradingModeIcon: boolean; // Show/hide trading mode icon next to page title
  moveButtonsToMenu: boolean; // When true on desktop, move page actions & notifications into the page menu
  autoHideNavbar: boolean; // When true, navbar auto-hides on scroll down and reappears on scroll up
  soundEnabled: boolean; // Enable/disable notification sounds

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setSpacing: (spacing: SpacingMode) => void;
  /**
   * Set the base font size with automatic clamping to 10-24px range
   * @param fontSize - Desired font size in pixels
   */
  setFontSize: (fontSize: number) => void;
  setVisualEffects: (enabled: boolean) => void;
  setShowTradingModeIcon: (show: boolean) => void;
  setMoveButtonsToMenu: (move: boolean) => void;
  setAutoHideNavbar: (autoHide: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

// Default values
const DEFAULT_VALUES = {
  theme: 'dark' as ThemeMode,
  spacing: 'comfortable' as SpacingMode,
  fontSize: 14, // Base font size in pixels
  visualEffects: true,
  showTradingModeIcon: false,
  moveButtonsToMenu: false,
  autoHideNavbar: false,
  soundEnabled: false, // Disable sounds by default
} as const;

export const useVisualSettingsStore = create<VisualSettingsState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state (using defaults)
        ...DEFAULT_VALUES,

        // Actions
        setTheme: (theme) =>
          set(() => ({ theme }), false, 'visual-settings/setTheme'),

        setSpacing: (spacing) =>
          set(() => ({ spacing }), false, 'visual-settings/setSpacing'),

        setFontSize: (fontSize) =>
          set(
            () => ({ fontSize: Math.max(10, Math.min(24, fontSize)) }), // Clamp between 10-24px
            false,
            'visual-settings/setFontSize'
          ),

        setVisualEffects: (visualEffects) =>
          set(
            () => ({ visualEffects }),
            false,
            'visual-settings/setVisualEffects'
          ),

        setShowTradingModeIcon: (show) =>
          set(
            () => ({ showTradingModeIcon: show }),
            false,
            'visual-settings/setShowTradingModeIcon'
          ),

        setMoveButtonsToMenu: (move) =>
          set(
            () => ({ moveButtonsToMenu: move }),
            false,
            'visual-settings/setMoveButtonsToMenu'
          ),

        setAutoHideNavbar: (autoHide) =>
          set(
            () => ({ autoHideNavbar: autoHide }),
            false,
            'visual-settings/setAutoHideNavbar'
          ),

        setSoundEnabled: (enabled) =>
          set(
            () => ({ soundEnabled: enabled }),
            false,
            'visual-settings/setSoundEnabled'
          ),

        resetToDefaults: () =>
          set(
            () => ({ ...DEFAULT_VALUES }),
            false,
            'visual-settings/resetToDefaults'
          ),
      }),
      {
        name: 'visual-settings-store',
        partialize: (state) => ({
          theme: state.theme,
          spacing: state.spacing,
          fontSize: state.fontSize,
          visualEffects: state.visualEffects,
          showTradingModeIcon: state.showTradingModeIcon,
          moveButtonsToMenu: state.moveButtonsToMenu,
          autoHideNavbar: state.autoHideNavbar,
          soundEnabled: state.soundEnabled,
        }),
      }
    ),
    {
      name: 'visual-settings-store',
    }
  )
);

// Hook to resolve the actual theme based on system preference
export const useResolvedTheme = (): 'light' | 'dark' => {
  const theme = useVisualSettingsStore((state) => state.theme);

  if (theme === 'system') {
    // Check system preference for dark mode
    const prefersDark =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    return prefersDark ? 'dark' : 'light';
  }

  return theme;
};
