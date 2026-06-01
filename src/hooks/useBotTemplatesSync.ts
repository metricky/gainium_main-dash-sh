import { logger } from '@/lib/loggerInstance';
import { getBotTemplatesPouchDB } from '@/lib/pouchdb/botTemplates';
import {
  useBotTemplatesStore,
  type BotTemplate,
} from '@/stores/botTemplatesStore';
// useShortcutStore already imported above
import { useShortcutStore } from '@/stores/shortcutStore';
import { parseShortcutString as parseHotkeyString } from '@/utils/shortcuts';
import { useEffect, useMemo, useRef } from 'react';

/**
 * Hook to initialize and sync bot templates with PouchDB
 * Call this once at the app level to enable sync
 */
export function useBotTemplatesSync() {
  const loadFromPouchDB = useBotTemplatesStore(
    (state) => state.loadFromPouchDB
  );
  const syncToPouchDB = useBotTemplatesStore((state) => state.syncToPouchDB);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    logger.info('[BotFormPersistence] Initializing bot templates sync');

    // Load templates from PouchDB on mount
    void loadFromPouchDB();

    // Setup PouchDB change listener
    const pouchdb = getBotTemplatesPouchDB();
    const cleanup = pouchdb.setupSync(() => {
      logger.info(
        '[BotFormPersistence] PouchDB change detected, loading templates'
      );
      void loadFromPouchDB();
    });

    // Cleanup on unmount
    return () => {
      cleanup();
      logger.info('[BotFormPersistence] Bot templates sync cleaned up');
    };
  }, [loadFromPouchDB, syncToPouchDB]);
}

// Register/unregister template shortcuts when templates change
export function useBotTemplateShortcuts() {
  const templates = useBotTemplatesStore((s) => s.templates);
  const shortcuts = useShortcutStore((s) => s.shortcuts);

  // Track processed deleted shortcuts to prevent infinite loops
  const processedDeletedShortcuts = useRef(new Set<string>());

  // Create a stable key for templates to detect changes
  const templatesKey = useMemo(
    () => templates.map((t) => `${t.id}:${t.shortcut || 'none'}`).join('|'),
    [templates]
  );

  // Create a stable key for deleted shortcuts to detect changes
  const deletedShortcutsKey = useMemo(
    () =>
      Object.entries(shortcuts)
        .filter(([id, sc]) => id.startsWith('bot-template-') && sc?.deleted)
        .map(([id]) => id)
        .join('|'),
    [shortcuts]
  );

  // Effect 1: Register/unregister template shortcuts based on template changes.
  //
  // Intentionally depends ONLY on `templatesKey` — NOT on `shortcuts`.
  // `registerShortcut` always produces a fresh `shortcuts` object (no
  // identity bail-out), so including `shortcuts` here would re-fire this
  // effect every time it registers one, looping until React throws
  // "Maximum update depth exceeded". We read the live shortcuts via
  // getState() instead of closing over the subscribed value.
  useEffect(() => {
    const registerShortcut = useShortcutStore.getState().registerShortcut;
    const deleteShortcut = useShortcutStore.getState().deleteShortcut;
    const currentShortcuts = useShortcutStore.getState().shortcuts;

    const registeredTemplateIds = new Set<string>();

    // Register or update template shortcuts
    templates.forEach((t: BotTemplate) => {
      const id = `bot-template-${t.id}`;
      registeredTemplateIds.add(id);

      if (!t.shortcut) {
        // Template doesn't define a shortcut; remove persisted shortcut if any
        const existing = currentShortcuts[id];
        if (existing && !existing.deleted) {
          deleteShortcut(id);
        }
        return;
      }

      const parsed = parseHotkeyString(t.shortcut);
      if (!parsed) return;

      registerShortcut({
        id,
        label: t.name,
        description: t.description || `Load template ${t.name}`,
        defaultKey: parsed,
        currentKey: parsed,
        enabled: true,
        category: 'templates',
        action: () => {
          window.dispatchEvent(
            new CustomEvent('bot-template-load', {
              detail: { id: t.id },
            })
          );
        },
        deleted: false,
      });
    });

    // Cleanup any stale persisted bot-template- shortcuts that no longer exist
    Object.keys(currentShortcuts).forEach((id) => {
      if (!id.startsWith('bot-template-')) return;
      if (!registeredTemplateIds.has(id) && !currentShortcuts[id]?.deleted) {
        deleteShortcut(id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templatesKey]); // Re-run only when a template's id/shortcut set changes

  // Effect 2: Handle deleted shortcuts separately to avoid loops
  useEffect(() => {
    const deletedShortcuts = Object.entries(shortcuts).filter(
      ([id, sc]) => id.startsWith('bot-template-') && sc?.deleted
    );

    if (deletedShortcuts.length === 0) return;

    deletedShortcuts.forEach(([id, _sc]) => {
      // Skip if we've already processed this deletion
      if (processedDeletedShortcuts.current.has(id)) return;

      const templateId = id.replace(/^bot-template-/, '');
      const template = useBotTemplatesStore.getState().getTemplate(templateId);

      if (!template) {
        // No template exists; just mark as processed
        processedDeletedShortcuts.current.add(id);
        return;
      }

      if (template.shortcut) {
        // Clear the template's shortcut
        useBotTemplatesStore.getState().updateTemplate(templateId, {
          shortcut: undefined,
        });
        processedDeletedShortcuts.current.add(id);
        logger.info(
          '[BotFormPersistence] Cleared template shortcut after deletion',
          {
            templateId,
            shortcutId: id,
          }
        );
      }
    });

    // Clean up processed set periodically
    if (processedDeletedShortcuts.current.size > 100) {
      processedDeletedShortcuts.current.clear();
    }
  }, [deletedShortcutsKey, shortcuts]); // Only re-run when deleted shortcuts change
}
