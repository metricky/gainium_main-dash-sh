import { isMacLike } from '@/lib/platform';
import { useCallback, useEffect } from 'react';

/**
 * Global keyboard shortcuts configuration
 * @deprecated Use useNavigationShortcuts instead for the new centralized shortcut system
 */
export interface GlobalKeyboardShortcutsConfig {
  toggleWidgetManager?: {
    key: string;
    callback: () => void;
    enabled: boolean;
  };
  toggleLayoutManager?: {
    key: string;
    callback: () => void;
    enabled: boolean;
  };
  toggleDashboardManager?: {
    key: string;
    callback: () => void;
    enabled: boolean;
  };
  toggleNotifications?: {
    key: string;
    callback: () => void;
    enabled: boolean;
  };
  toggleAiChat?: {
    key: string;
    callback: () => void;
    enabled: boolean;
  };
}

/**
 * Custom hook for global keyboard shortcuts that work across the application
 * These shortcuts are for opening manager drawers and notifications panel
 */
export function useGlobalKeyboardShortcuts(
  config: GlobalKeyboardShortcutsConfig
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const isModifierPressed = event.metaKey || event.ctrlKey;

      // AI Chat shortcut - allow even when inputs are focused since it's for toggling the chat
      if (
        config.toggleAiChat?.enabled &&
        isModifierPressed &&
        event.key.toLowerCase() === config.toggleAiChat.key.toLowerCase()
      ) {
        event.preventDefault();
        config.toggleAiChat.callback();
        return;
      }

      // Ignore shortcuts when typing in inputs, textareas, or contenteditable elements
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      // Widget Manager shortcut
      if (
        config.toggleWidgetManager?.enabled &&
        isModifierPressed &&
        event.key.toLowerCase() === config.toggleWidgetManager.key.toLowerCase()
      ) {
        event.preventDefault();
        config.toggleWidgetManager.callback();
        return;
      }

      // Layout Manager shortcut
      if (
        config.toggleLayoutManager?.enabled &&
        isModifierPressed &&
        event.key.toLowerCase() === config.toggleLayoutManager.key.toLowerCase()
      ) {
        event.preventDefault();
        config.toggleLayoutManager.callback();
        return;
      }

      // Dashboard Manager shortcut
      if (
        config.toggleDashboardManager?.enabled &&
        isModifierPressed &&
        event.key.toLowerCase() ===
          config.toggleDashboardManager.key.toLowerCase()
      ) {
        event.preventDefault();
        config.toggleDashboardManager.callback();
        return;
      }

      // Notifications shortcut
      if (
        config.toggleNotifications?.enabled &&
        isModifierPressed &&
        event.key.toLowerCase() === config.toggleNotifications.key.toLowerCase()
      ) {
        event.preventDefault();
        config.toggleNotifications.callback();
        return;
      }
    },
    [config]
  );

  useEffect(() => {
    // Only add listener if at least one shortcut is enabled
    const hasEnabledShortcuts = Object.values(config).some(
      (shortcut) => shortcut?.enabled
    );

    if (hasEnabledShortcuts) {
      // Use capture phase for higher priority, especially for global shortcuts like chat
      const useCapture =
        !!config.toggleAiChat?.enabled || !!config.toggleNotifications?.enabled;
      document.addEventListener('keydown', handleKeyDown, useCapture);
      return () =>
        document.removeEventListener('keydown', handleKeyDown, useCapture);
    }

    // Return empty cleanup function if no shortcuts are enabled
    return () => {};
  }, [handleKeyDown, config]);
}

/**
 * Utility function to format shortcut display for UI
 */
export function formatGlobalShortcut(key: string): string {
  const isMac = isMacLike();
  const modifier = isMac ? '⌘' : 'Ctrl';
  return `${modifier}+${key.toUpperCase()}`;
}

/**
 * Default global keyboard shortcuts configuration
 */
export const DEFAULT_GLOBAL_SHORTCUTS = {
  WIDGET_MANAGER: 'g',
  LAYOUT_MANAGER: 'l',
  DASHBOARD_MANAGER: 'd',
  NOTIFICATIONS: 'i', // Changed from 'n' to 'i' to avoid conflict with browser's "new window" shortcut
  AI_CHAT: '/',
} as const;
