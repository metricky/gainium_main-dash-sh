import { logger } from '@/lib/loggerInstance';
import { getBotTemplatesPouchDB } from '@/lib/pouchdb/botTemplates';
import { useShortcutStore } from '@/stores/shortcutStore';
import { BotTypesEnum, type HedgeBotSettings } from '@/types';
import type { BotFormData } from '@/types/bots/form';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * A hedge template can't be a single `formData` slice the way dca/combo/grid
 * templates are — a hedge bot is two leg forms plus a shared-settings object.
 * When `botType` is `hedgeDca`/`hedgeCombo`, the full configuration lives here
 * and `formData` carries the long leg only (kept for back-compat with any
 * generic code that reads `formData`). The hedge edit layout reseeds both legs
 * + shared settings from this payload on load.
 */
export interface HedgeTemplatePayload {
  long: Partial<BotFormData>;
  short: Partial<BotFormData>;
  sharedSettings: HedgeBotSettings;
}

export interface BotTemplate {
  id: string;
  name: string;
  description?: string;
  botType: BotTypesEnum;
  formData: Partial<BotFormData>;
  /** Present only for hedge templates (botType hedgeDca/hedgeCombo). */
  hedge?: HedgeTemplatePayload;
  shortcut?: string; // e.g., "Ctrl+1", "Cmd+1"
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
}

interface BotTemplatesState {
  templates: BotTemplate[];
  _syncing: boolean;
}

interface BotTemplatesActions {
  // Template CRUD operations
  saveTemplate: (
    name: string,
    botType: BotTypesEnum,
    formData: Partial<BotFormData>,
    options?: {
      description?: string;
      shortcut?: string;
      isFavorite?: boolean;
      hedge?: HedgeTemplatePayload;
    }
  ) => BotTemplate;

  updateTemplate: (
    id: string,
    updates: Partial<Omit<BotTemplate, 'id' | 'createdAt' | 'botType'>>
  ) => void;

  deleteTemplate: (id: string) => void;

  getTemplate: (id: string) => BotTemplate | undefined;

  getAllTemplates: (botType?: BotTypesEnum) => BotTemplate[];

  clearAllTemplates: () => void;

  toggleFavorite: (id: string) => void;

  duplicateTemplate: (id: string, newName?: string) => BotTemplate | undefined;

  // PouchDB sync operations
  syncToPouchDB: () => Promise<void>;
  loadFromPouchDB: () => Promise<void>;
  _setTemplates: (templates: BotTemplate[]) => void;
}

type BotTemplatesStore = BotTemplatesState & BotTemplatesActions;

export const useBotTemplatesStore = create<BotTemplatesStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        templates: [],
        _syncing: false,

        // Save a new template
        saveTemplate: (name, botType, formData, options) => {
          const newTemplate: BotTemplate = {
            id: `bot-template_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            name,
            botType,
            formData,
            ...(options?.hedge ? { hedge: options.hedge } : {}),
            ...(options?.description
              ? { description: options.description }
              : {}),
            ...(options?.shortcut ? { shortcut: options.shortcut } : {}),
            ...(options?.isFavorite ? { isFavorite: options.isFavorite } : {}),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set((state) => ({
            templates: [...state.templates, newTemplate],
          }));

          logger.info('[BotFormPersistence] Template: Saved', {
            name,
            botType,
            id: newTemplate.id,
          });

          // Sync to PouchDB asynchronously
          void get().syncToPouchDB();

          return newTemplate;
        },

        // Update an existing template
        updateTemplate: (id, updates) => {
          set((state) => ({
            templates: state.templates.map((template) =>
              template.id === id
                ? {
                    ...template,
                    ...updates,
                    updatedAt: Date.now(),
                  }
                : template
            ),
          }));

          logger.info('[BotFormPersistence] Template: Updated', { id });

          // Sync to PouchDB asynchronously
          void get().syncToPouchDB();
          // If the shortcut was cleared, also remove persisted shortcut from shortcut store
          if (updates.shortcut === undefined || updates.shortcut === '') {
            try {
              useShortcutStore.getState().deleteShortcut(`bot-template-${id}`);
            } catch (e) {
              logger.warn('[BotFormPersistence] Shortcut delete failed', {
                id,
                err: e,
              });
            }
          }
        },

        // Delete a template
        deleteTemplate: (id) => {
          set((state) => ({
            templates: state.templates.filter((template) => template.id !== id),
          }));

          logger.info('[BotFormPersistence] Template: Deleted', { id });

          // Sync to PouchDB asynchronously
          void get().syncToPouchDB();
          // Remove persisted global shortcut if any
          try {
            useShortcutStore.getState().deleteShortcut(`bot-template-${id}`);
          } catch (e) {
            logger.warn('[BotFormPersistence] Shortcut delete failed', {
              id,
              err: e,
            });
          }
        },

        // Get a specific template by ID
        getTemplate: (id) => {
          return get().templates.find((template) => template.id === id);
        },

        // Get all templates, optionally filtered by bot type
        getAllTemplates: (botType) => {
          const templates = get().templates;
          if (botType) {
            return templates.filter((t) => t.botType === botType);
          }
          return templates;
        },

        // Clear all templates
        clearAllTemplates: () => {
          set({ templates: [] });
          logger.info('[BotFormPersistence] Template: Cleared all');

          // Sync to PouchDB asynchronously
          void get().syncToPouchDB();
        },

        // Toggle favorite status
        toggleFavorite: (id) => {
          set((state) => ({
            templates: state.templates.map((template) =>
              template.id === id
                ? {
                    ...template,
                    isFavorite: !template.isFavorite,
                    updatedAt: Date.now(),
                  }
                : template
            ),
          }));

          logger.info('[BotFormPersistence] Template: Toggled favorite', {
            id,
          });

          // Sync to PouchDB asynchronously
          void get().syncToPouchDB();
        },

        // Duplicate a template
        duplicateTemplate: (id, newName) => {
          const template = get().getTemplate(id);
          if (!template) {
            logger.warn(
              '[BotFormPersistence] Template: Cannot duplicate - not found',
              { id }
            );
            return undefined;
          }

          const duplicated = get().saveTemplate(
            newName || `${template.name} (Copy)`,
            template.botType,
            template.formData,
            {
              description: template.description,
              isFavorite: false,
              ...(template.hedge ? { hedge: template.hedge } : {}),
            }
          );

          return duplicated;
        },

        // Sync current templates to PouchDB
        syncToPouchDB: async () => {
          const state = get();
          if (state._syncing) {
            logger.info(
              '[BotFormPersistence] Template: Sync already in progress'
            );
            return;
          }

          set({ _syncing: true });

          try {
            const pouchdb = getBotTemplatesPouchDB();
            await pouchdb.syncFromStore(state.templates);
          } catch (error) {
            logger.error(
              '[BotFormPersistence] Template: Sync to PouchDB failed',
              {
                error,
              }
            );
          } finally {
            set({ _syncing: false });
          }
        },

        // Load templates from PouchDB
        loadFromPouchDB: async () => {
          try {
            const pouchdb = getBotTemplatesPouchDB();
            await pouchdb.loadToStore((templates) => {
              set({ templates });
            });
          } catch (error) {
            logger.error(
              '[BotFormPersistence] Template: Load from PouchDB failed',
              {
                error,
              }
            );
          }
        },

        // Internal method to set templates (used by PouchDB sync)
        _setTemplates: (templates) => {
          set({ templates });
        },
      }),
      {
        name: 'bot-templates-storage',
        version: 1,
      }
    ),
    {
      name: 'BotTemplatesStore',
    }
  )
);
