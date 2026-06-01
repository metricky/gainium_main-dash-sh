import { logger } from '@/lib/loggerInstance';
import type { BotFormData } from '@/types/bots/form';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Interface for the last used DCA bot configuration
 * Stores form data for restoring bot settings in subsequent creations
 */
interface LastUsedConfig {
  formData: Partial<BotFormData>;
  timestamp: number;
}

/**
 * Interface for DCA bot settings templates (future use)
 * Will allow saving and loading named configuration templates
 */
interface BotTemplate {
  id: string;
  name: string;
  description?: string;
  formData: Partial<BotFormData>;
  createdAt: number;
  updatedAt: number;
}

interface DcaBotSettingsState {
  dcaLastUsedConfig: LastUsedConfig | null;
  terminalLastUsedConfig: LastUsedConfig | null;
  comboLastUsedConfig: LastUsedConfig | null;
  gridLastUsedConfig: LastUsedConfig | null;
  templates: BotTemplate[];
}

export type ConfigType = 'dca' | 'terminal' | 'combo' | 'grid';

interface DcaBotSettingsActions {
  saveLastUsedConfig: (
    formData: Partial<BotFormData>,
    type: ConfigType
  ) => void;
  getLastUsedConfig: (type: ConfigType) => Partial<BotFormData> | null;
  clearLastUsedConfig: (type: ConfigType) => void;

  // Template actions (for future use)
  saveTemplate: (
    name: string,
    formData: Partial<BotFormData>,
    description?: string
  ) => void;
  updateTemplate: (
    id: string,
    updates: Partial<Omit<BotTemplate, 'id' | 'createdAt'>>
  ) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => BotTemplate | undefined;
  getAllTemplates: () => BotTemplate[];
  clearAllTemplates: () => void;
}

type DcaBotSettingsStore = DcaBotSettingsState & DcaBotSettingsActions;

export const useDcaBotSettingsStore = create<DcaBotSettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        dcaLastUsedConfig: null,
        terminalLastUsedConfig: null,
        comboLastUsedConfig: null,
        gridLastUsedConfig: null,
        templates: [],

        // Last used config actions
        saveLastUsedConfig: (
          formData: Partial<BotFormData>,
          type: ConfigType = 'dca'
        ) => {
          try {
            logger.info('[BotFormPersistence] Store: Saving config', {
              hasFormData: !!formData,
              formDataKeys: Object.keys(formData || {}),
            });

            set(
              {
                [`${type}LastUsedConfig`]: {
                  formData,
                  timestamp: Date.now(),
                },
              },
              false,
              'saveLastUsedConfig'
            );

            logger.info(
              '[BotFormPersistence] Store: Config saved successfully'
            );
          } catch (error) {
            logger.error(
              '[BotFormPersistence] Store: Failed to save config:',
              error
            );
          }
        },

        getLastUsedConfig: (type: ConfigType = 'dca') => {
          const config = get()[`${type}LastUsedConfig`];
          logger.info('[BotFormPersistence] Store: Loading config', {
            hasConfig: !!config,
            timestamp: config?.timestamp,
          });
          return config?.formData ?? null;
        },

        clearLastUsedConfig: (type: ConfigType = 'dca') => {
          set({
            [`${type}LastUsedConfig`]: null,
          });
          logger.info('[BotFormPersistence] Store: Cleared config');
        },

        // Template actions
        saveTemplate: (
          name: string,
          formData: Partial<BotFormData>,
          description?: string
        ) => {
          try {
            const newTemplate: BotTemplate = {
              id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name,
              ...(description ? { description } : {}),
              formData,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            set((state) => ({
              templates: [...state.templates, newTemplate],
            }));

            logger.info(`[BotFormPersistence] Store: Saved template: ${name}`);
          } catch (error) {
            logger.error(
              '[BotFormPersistence] Store: Failed to save template:',
              error
            );
          }
        },

        updateTemplate: (
          id: string,
          updates: Partial<Omit<BotTemplate, 'id' | 'createdAt'>>
        ) => {
          try {
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

            logger.info(`[BotFormPersistence] Store: Updated template: ${id}`);
          } catch (error) {
            logger.error(
              '[BotFormPersistence] Store: Failed to update template:',
              error
            );
          }
        },

        deleteTemplate: (id: string) => {
          try {
            set((state) => ({
              templates: state.templates.filter(
                (template) => template.id !== id
              ),
            }));

            logger.info(`[BotFormPersistence] Store: Deleted template: ${id}`);
          } catch (error) {
            logger.error(
              '[BotFormPersistence] Store: Failed to delete template:',
              error
            );
          }
        },

        getTemplate: (id: string) => {
          return get().templates.find((template) => template.id === id);
        },

        getAllTemplates: () => {
          return get().templates;
        },

        clearAllTemplates: () => {
          set({ templates: [] });
          logger.info('[BotFormPersistence] Store: Cleared all templates');
        },
      }),
      {
        name: 'dca-bot-settings-storage',
        version: 1,
      }
    ),
    {
      name: 'DcaBotSettingsStore',
    }
  )
);
