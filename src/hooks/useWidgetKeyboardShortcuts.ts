import { useCallback, useEffect, useRef } from 'react';

export interface WidgetKeyboardShortcutsConfig {
  widgetId: string;
  onSettings?: (() => void) | undefined;
  onDuplicate?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  onFullscreen?: (() => void) | undefined;
  isActive?: boolean; // Whether shortcuts should be active (for selected widget or fullscreen)
  enableGlobalShortcuts?: boolean; // Whether to enable global shortcuts (useful for fullscreen)
}

/**
 * Hook for managing widget keyboard shortcuts
 * Provides consistent keyboard shortcuts across fullscreen and normal widget modes
 */
export const useWidgetKeyboardShortcuts = (
  config: WidgetKeyboardShortcutsConfig
) => {
  const {
    widgetId,
    onSettings,
    onDuplicate,
    onDelete,
    onRefresh,
    onFullscreen,
    isActive = false,
    enableGlobalShortcuts = false,
  } = config;

  // Store the currently active widget to prevent conflicts
  const activeWidgetRef = useRef<string | null>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only process shortcuts if this widget is active
      if (!isActive) return;

      // Ignore shortcuts when typing in inputs or textareas
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle modifier key combinations (Ctrl/Cmd + key)
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'o': // Ctrl/Cmd + O for Options/Settings
            if (onSettings) {
              event.preventDefault();
              event.stopPropagation();
              onSettings();
            }
            break;
          case 'd': // Ctrl/Cmd + D for Duplicate
            if (onDuplicate) {
              event.preventDefault();
              event.stopPropagation();
              onDuplicate();
            }
            break;
          case 'u': // Ctrl/Cmd + U for Refresh/Update
            if (onRefresh) {
              event.preventDefault();
              event.stopPropagation();
              onRefresh();
            }
            break;
          case 'backspace': // Ctrl/Cmd + Backspace for Delete
          case 'delete':
            if (onDelete) {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }
            break;
          case 'f': // Ctrl/Cmd + F for Fullscreen (if not already fullscreen)
            if (onFullscreen && !enableGlobalShortcuts) {
              event.preventDefault();
              event.stopPropagation();
              onFullscreen();
            }
            break;
        }
        return;
      }

      // Handle single key shortcuts (only if global shortcuts are enabled)
      if (enableGlobalShortcuts) {
        switch (event.key) {
          case 'o': // O for Options/Settings
          case 'O':
            if (onSettings) {
              event.preventDefault();
              event.stopPropagation();
              onSettings();
            }
            break;
          case 'd': // D for Duplicate
          case 'D':
            if (onDuplicate) {
              event.preventDefault();
              event.stopPropagation();
              onDuplicate();
            }
            break;
          case 'u': // U for Refresh/Update
          case 'U':
            if (onRefresh) {
              event.preventDefault();
              event.stopPropagation();
              onRefresh();
            }
            break;
          case 'Delete':
          case 'Backspace':
            // Only delete with Shift+Delete or Alt+Backspace to prevent accidental deletion
            if (onDelete && (event.shiftKey || event.altKey)) {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }
            break;
          case 'f': // F for Fullscreen
          case 'F':
            if (onFullscreen) {
              event.preventDefault();
              event.stopPropagation();
              onFullscreen();
            }
            break;
        }
      }
    },
    [
      isActive,
      onSettings,
      onDuplicate,
      onDelete,
      onRefresh,
      onFullscreen,
      enableGlobalShortcuts,
    ]
  );

  // Set up event listener
  useEffect(() => {
    if (!isActive) return;

    // Update the active widget reference
    activeWidgetRef.current = widgetId;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Clear active widget reference when unmounting
      if (activeWidgetRef.current === widgetId) {
        activeWidgetRef.current = null;
      }
    };
  }, [isActive, widgetId, handleKeyDown]);

  // Return shortcut information for display in menus
  const shortcuts = {
    settings: { key: 'O', modifier: enableGlobalShortcuts ? '' : '⌘' },
    duplicate: { key: 'D', modifier: enableGlobalShortcuts ? '' : '⌘' },
    refresh: { key: 'U', modifier: enableGlobalShortcuts ? '' : '⌘' },
    delete: { key: enableGlobalShortcuts ? '⇧⌫' : '⌘⌫', modifier: '' },
    fullscreen: { key: 'F', modifier: enableGlobalShortcuts ? '' : '⌘' },
  };

  return { shortcuts };
};

/**
 * Utility function to format shortcut display text
 */
export const formatShortcut = (shortcut: { key: string; modifier: string }) => {
  return shortcut.modifier
    ? `${shortcut.modifier}${shortcut.key}`
    : shortcut.key;
};
