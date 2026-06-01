import { SHORTCUT_IDS } from '@/config/shortcuts';
import {
  ShortcutPriority,
  useKeyboardShortcutManagerStore,
} from '@/hooks/useKeyboardShortcutManager';
import { logger } from '@/lib/loggerInstance';
import { useShortcutStore } from '@/stores/shortcutStore';
import { useSplitPanelShortcutStore } from '@/stores/splitPanelShortcutStore';
import { useCallback, useEffect } from 'react';

const LOG_PREFIX = 'SplitPanelShortcuts';

/**
 * Hook to register split panel arrow key shortcuts with the global keyboard manager.
 * This should be called once in the app root (e.g., App.tsx or Layout component).
 */
export function useSplitPanelShortcuts() {
  const { registerShortcut, unregisterShortcut } =
    useKeyboardShortcutManagerStore();
  const shortcuts = useShortcutStore((s) => s.shortcuts);

  // Get the current key bindings from the shortcut store
  const leftKey = shortcuts[SHORTCUT_IDS.PanelExpandLeft]?.currentKey;
  const rightKey = shortcuts[SHORTCUT_IDS.PanelExpandRight]?.currentKey;
  const upKey = shortcuts[SHORTCUT_IDS.PanelExpandUp]?.currentKey;
  const downKey = shortcuts[SHORTCUT_IDS.PanelExpandDown]?.currentKey;

  const leftEnabled =
    shortcuts[SHORTCUT_IDS.PanelExpandLeft]?.enabled !== false;
  const rightEnabled =
    shortcuts[SHORTCUT_IDS.PanelExpandRight]?.enabled !== false;
  const upEnabled = shortcuts[SHORTCUT_IDS.PanelExpandUp]?.enabled !== false;
  const downEnabled =
    shortcuts[SHORTCUT_IDS.PanelExpandDown]?.enabled !== false;

  const hasHorizontalHandlers = useCallback(() => {
    const handlers = useSplitPanelShortcutStore.getState().handlers;
    return Array.from(handlers.values()).some(
      (h) => h.direction === 'horizontal'
    );
  }, []);

  const hasVerticalHandlers = useCallback(() => {
    const handlers = useSplitPanelShortcutStore.getState().handlers;
    return Array.from(handlers.values()).some(
      (h) => h.direction === 'vertical'
    );
  }, []);

  useEffect(() => {
    const shortcutIds: string[] = [];

    // Cleanup legacy duplicated CMD-based shortcuts (they may be persisted from earlier versions).
    // Remove any shortcut that uses Arrow keys with Cmd modifier and is not one of the canonical panel shortcuts.
    const canonicalPanelIds = new Set<string>([
      SHORTCUT_IDS.PanelExpandLeft,
      SHORTCUT_IDS.PanelExpandRight,
      SHORTCUT_IDS.PanelExpandUp,
      SHORTCUT_IDS.PanelExpandDown,
    ]);

    Object.values(shortcuts).forEach((sc) => {
      const key = sc?.currentKey?.key;
      const mod = sc?.currentKey?.modifiers;
      if (key && key.startsWith('Arrow') && mod && mod.cmd === true) {
        // Remove any legacy CMD-based shortcut entries. If the entry is one of the
        // canonical panel shortcuts but already marked deleted (disabled/persisted),
        // remove it as well to avoid showing stale duplicates in the UI.
        if (!canonicalPanelIds.has(sc.id) || sc.deleted) {
          logger.debug(
            `[${LOG_PREFIX}] Removing legacy CMD-based duplicate shortcut: ${sc.id}`
          );
          useShortcutStore.getState().deleteShortcut(sc.id);
        }
      }
    });

    // Register ArrowLeft shortcut
    if (leftKey && leftEnabled) {
      // Use canonical ID so we don't create duplicate shortcut entries in the manager
      const leftId = SHORTCUT_IDS.PanelExpandLeft;
      // Remove any legacy runtime shortcut IDs if present
      useShortcutStore.getState().deleteShortcut?.('split-panel-arrow-left');

      // If the stored shortcut used Cmd modifiers previously, migrate it to Alt
      const existingLeft = shortcuts[leftId];
      if (existingLeft?.currentKey?.modifiers?.cmd && !existingLeft.deleted) {
        const migrated = {
          key: existingLeft.currentKey.key,
          modifiers: {
            ...existingLeft.currentKey.modifiers,
            cmd: false,
            alt: true,
          },
        };
        logger.debug(
          `[${LOG_PREFIX}] Migrating ${leftId} from Cmd -> Alt modifiers`
        );
        useShortcutStore.getState().updateShortcut(leftId, migrated);
      }

      registerShortcut({
        id: leftId,
        key: leftKey.key,
        modifiers: leftKey.modifiers,
        callback: () => {
          if (hasHorizontalHandlers()) {
            logger.debug(`[${LOG_PREFIX}] ArrowLeft triggered`);
            useSplitPanelShortcutStore.getState().handleHorizontalArrow('left');
          }
        },
        priority: ShortcutPriority.PAGE,
        enabled: true,
        allowInInputs: false,
        description: 'Push content left (expand right panel progressively)',
      });
      shortcutIds.push(leftId);
    }

    // Register ArrowRight shortcut
    if (rightKey && rightEnabled) {
      const rightId = SHORTCUT_IDS.PanelExpandRight;
      // Remove any legacy runtime shortcut IDs if present
      useShortcutStore.getState().deleteShortcut?.('split-panel-arrow-right');

      // Migrate Cmd -> Alt if necessary
      const existingRight = shortcuts[rightId];
      if (existingRight?.currentKey?.modifiers?.cmd && !existingRight.deleted) {
        const migrated = {
          key: existingRight.currentKey.key,
          modifiers: {
            ...existingRight.currentKey.modifiers,
            cmd: false,
            alt: true,
          },
        };
        logger.debug(
          `[${LOG_PREFIX}] Migrating ${rightId} from Cmd -> Alt modifiers`
        );
        useShortcutStore.getState().updateShortcut(rightId, migrated);
      }

      registerShortcut({
        id: rightId,
        key: rightKey.key,
        modifiers: rightKey.modifiers,
        callback: () => {
          if (hasHorizontalHandlers()) {
            logger.debug(`[${LOG_PREFIX}] ArrowRight triggered`);
            useSplitPanelShortcutStore
              .getState()
              .handleHorizontalArrow('right');
          }
        },
        priority: ShortcutPriority.PAGE,
        enabled: true,
        allowInInputs: false,
        description: 'Push content right (collapse right panel progressively)',
      });
      shortcutIds.push(rightId);
    }

    // Register ArrowUp shortcut
    if (upKey && upEnabled) {
      const upId = SHORTCUT_IDS.PanelExpandUp;
      // Remove any legacy runtime shortcut IDs if present
      useShortcutStore.getState().deleteShortcut?.('split-panel-arrow-up');

      // Migrate Cmd -> Alt if necessary
      const existingUp = shortcuts[upId];
      if (existingUp?.currentKey?.modifiers?.cmd && !existingUp.deleted) {
        const migrated = {
          key: existingUp.currentKey.key,
          modifiers: {
            ...existingUp.currentKey.modifiers,
            cmd: false,
            alt: true,
          },
        };
        logger.debug(
          `[${LOG_PREFIX}] Migrating ${upId} from Cmd -> Alt modifiers`
        );
        useShortcutStore.getState().updateShortcut(upId, migrated);
      }

      registerShortcut({
        id: upId,
        key: upKey.key,
        modifiers: upKey.modifiers,
        callback: () => {
          if (hasVerticalHandlers()) {
            logger.debug(`[${LOG_PREFIX}] ArrowUp triggered`);
            useSplitPanelShortcutStore.getState().handleVerticalArrow('up');
          }
        },
        priority: ShortcutPriority.PAGE,
        enabled: true,
        allowInInputs: false,
        description: 'Push content up (expand bottom panel progressively)',
      });
      shortcutIds.push(upId);
    }

    // Register ArrowDown shortcut
    if (downKey && downEnabled) {
      const downId = SHORTCUT_IDS.PanelExpandDown;
      // Remove any legacy runtime shortcut IDs if present
      useShortcutStore.getState().deleteShortcut?.('split-panel-arrow-down');

      // Migrate Cmd -> Alt if necessary
      const existingDown = shortcuts[downId];
      if (existingDown?.currentKey?.modifiers?.cmd && !existingDown.deleted) {
        const migrated = {
          key: existingDown.currentKey.key,
          modifiers: {
            ...existingDown.currentKey.modifiers,
            cmd: false,
            alt: true,
          },
        };
        logger.debug(
          `[${LOG_PREFIX}] Migrating ${downId} from Cmd -> Alt modifiers`
        );
        useShortcutStore.getState().updateShortcut(downId, migrated);
      }

      registerShortcut({
        id: downId,
        key: downKey.key,
        modifiers: downKey.modifiers,
        callback: () => {
          if (hasVerticalHandlers()) {
            logger.debug(`[${LOG_PREFIX}] ArrowDown triggered`);
            useSplitPanelShortcutStore.getState().handleVerticalArrow('down');
          }
        },
        priority: ShortcutPriority.PAGE,
        enabled: true,
        allowInInputs: false,
        description: 'Push content down (collapse bottom panel progressively)',
      });
      shortcutIds.push(downId);
    }

    logger.debug(`[${LOG_PREFIX}] Registered ${shortcutIds.length} shortcuts`);

    return () => {
      shortcutIds.forEach((id) => unregisterShortcut(id));
      logger.debug(`[${LOG_PREFIX}] Unregistered shortcuts`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    leftKey,
    rightKey,
    upKey,
    downKey,
    leftEnabled,
    rightEnabled,
    upEnabled,
    downEnabled,
    registerShortcut,
    unregisterShortcut,
    hasHorizontalHandlers,
    hasVerticalHandlers,
    //shortcuts,
  ]);
}
