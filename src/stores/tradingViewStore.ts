/* eslint-disable @typescript-eslint/no-explicit-any */
import { createIndexedDBStorage } from '@/lib/zustand-indexeddb-storage';
import { pouchdbSync } from '@/lib/zustand-pouchdb-middleware';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import logger from '../lib/loggerInstance';

// TradingView save/load interfaces based on the documentation
export interface ChartData {
  id?: string | number;
  name?: string;
  content: string;
  timestamp?: number;
  symbol?: string;
  resolution?: string;
  persistenceKey?: string; // Widget-level namespace for chart isolation
}

export interface ChartMetaInfo {
  id: string;
  name: string;
  timestamp: number;
  symbol?: string;
  resolution?: string;
}

export interface StudyTemplateData {
  name: string;
  content: string;
}

export interface StudyTemplateMetaInfo {
  name: string;
}

export interface DrawingTemplate {
  name: string;
  toolName: string;
  content: string;
}

export interface ChartTemplate {
  content?: unknown;
}

export interface ChartTemplateContent {
  [key: string]: unknown;
}

export interface SavedChartTemplate extends ChartTemplate {
  name: string;
}

// Line tools and groups storage
export interface SerializedLineToolsState {
  layoutId: string;
  chartId: string | number;
  state: string; // JSON stringified LineToolsAndGroupsState
  timestamp: number;
  persistenceKey?: string; // Widget-level namespace for drawings isolation
}

function normalizeChartId(
  id: string | number | null | undefined
): string | undefined {
  if (id === null || id === undefined) {
    return undefined;
  }
  return String(id);
}

function chartIdsMatch(
  a: string | number | null | undefined,
  b: string | number | null | undefined
): boolean {
  return normalizeChartId(a) === normalizeChartId(b);
}

interface TradingViewState {
  // Charts
  charts: ChartData[];
  studyTemplates: StudyTemplateData[];
  drawingTemplates: DrawingTemplate[];
  chartTemplates: SavedChartTemplate[];
  lineToolsStorage: SerializedLineToolsState[]; // Storage for drawings

  // Auto-save settings
  autoSaveEnabled: boolean;
  lastSavedLayoutIds: Record<string, string | null>; // Keyed by persistenceKey

  /** True once IndexedDB rehydration has completed. Lets consumers
   *  distinguish "layouts not loaded yet" from "no saved layouts" so the UI
   *  doesn't flash an empty state during the IDB read window on hard refresh
   *  / HMR. Opt-in: read this flag to gate empty-state rendering. */
  _hasHydrated: boolean;

  // Actions
  saveChart: (chartData: ChartData) => Promise<string>;
  setHasHydrated: (state: boolean) => void;
  getAllCharts: (persistenceKey?: string) => Promise<ChartMetaInfo[]>;
  getChartContent: (
    id: string | number,
    persistenceKey?: string
  ) => Promise<string>;
  removeChart: (id: string | number, persistenceKey?: string) => Promise<void>;

  // Study Templates
  saveStudyTemplate: (studyTemplateData: StudyTemplateData) => Promise<void>;
  getAllStudyTemplates: () => Promise<StudyTemplateData[]>;
  getStudyTemplateContent: (
    studyTemplateData: StudyTemplateMetaInfo
  ) => Promise<string>;
  removeStudyTemplate: (
    studyTemplateData: StudyTemplateMetaInfo
  ) => Promise<void>;

  // Drawing Templates
  saveDrawingTemplate: (
    toolName: string,
    templateName: string,
    content: string
  ) => Promise<void>;
  getDrawingTemplates: () => Promise<string[]>;
  loadDrawingTemplate: (
    toolName: string,
    templateName: string
  ) => Promise<string>;
  removeDrawingTemplate: (
    toolName: string,
    templateName: string
  ) => Promise<void>;

  // Chart Templates
  saveChartTemplate: (
    templateName: string,
    content: ChartTemplateContent
  ) => Promise<void>;
  getAllChartTemplates: () => Promise<string[]>;
  getChartTemplateContent: (templateName: string) => Promise<ChartTemplate>;
  removeChartTemplate: (templateName: string) => Promise<void>;

  // Auto-save actions
  setAutoSaveEnabled: (enabled: boolean) => void;
  setLastSavedLayoutId: (
    layoutId: string | null,
    persistenceKey?: string
  ) => void;
  getLastSavedLayoutId: (persistenceKey?: string) => string | null;

  // Line Tools and Groups
  saveLineToolsAndGroups: (
    layoutId: string | undefined,
    chartId: string | number,
    state: string, // JSON stringified state
    persistenceKey?: string
  ) => Promise<void>;
  loadLineToolsAndGroups: (
    layoutId: string | undefined,
    chartId: string | number,
    persistenceKey?: string
  ) => Promise<string | null>; // Returns JSON stringified state or null
}

export const useTradingViewStore = create<TradingViewState>()(
  pouchdbSync(
    persist(
      (set, get) => ({
        charts: [],
        studyTemplates: [],
        drawingTemplates: [],
        chartTemplates: [],
        lineToolsStorage: [],
        autoSaveEnabled: true,
        lastSavedLayoutIds: {},
        _hasHydrated: false,
        setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

        // Chart operations
        saveChart: async (chartData: ChartData): Promise<string> => {
          try {
            const state = get();

            const normalizedId =
              normalizeChartId(chartData.id) ??
              generateUniqueChartId(chartData.name);

            const persistenceKey = chartData.persistenceKey;

            logger.info('[TradingView Store] Saving chart', {
              normalizedId,
              persistenceKey,
              name: chartData.name,
              existingCharts: state.charts.length,
            });

            // Filter out charts with same ID AND same persistenceKey (or both undefined)
            const filteredCharts = state.charts.filter(
              (chart) =>
                !(
                  chartIdsMatch(chart.id, normalizedId) &&
                  chart.persistenceKey === persistenceKey
                )
            );

            const savedChartData: ChartData = {
              ...chartData,
              id: normalizedId,
              timestamp: Math.round(Date.now() / 1000),
              ...(persistenceKey && { persistenceKey }),
            };

            set({ charts: [...filteredCharts, savedChartData] });

            logger.info('[TradingView Store] Chart saved successfully', {
              normalizedId,
              totalCharts: filteredCharts.length + 1,
            });

            return normalizedId;
          } catch (error) {
            console.error('[TradingView Store] Failed to save chart:', error);
            throw error;
          }
        },

        getAllCharts: async (
          persistenceKey?: string
        ): Promise<ChartMetaInfo[]> => {
          const state = get();
          const filtered = persistenceKey
            ? state.charts.filter(
                (chart) => chart.persistenceKey === persistenceKey
              )
            : state.charts;
          return filtered
            .map((chart) => {
              const id = normalizeChartId(chart.id);
              if (!id) return null;
              return {
                id,
                name: chart.name || `Chart ${id}`,
                timestamp: chart.timestamp || Math.round(Date.now() / 1000),
                ...(chart.symbol && { symbol: chart.symbol }),
                ...(chart.resolution && { resolution: chart.resolution }),
              } satisfies ChartMetaInfo;
            })
            .filter((chart): chart is ChartMetaInfo => chart !== null);
        },

        getChartContent: async (
          id: string | number,
          persistenceKey?: string
        ): Promise<string> => {
          const state = get();
          const targetId = normalizeChartId(id);
          if (!targetId) {
            throw new Error('Invalid chart identifier');
          }
          const chart = state.charts.find(
            (c) =>
              chartIdsMatch(c.id, targetId) &&
              (persistenceKey === undefined ||
                c.persistenceKey === persistenceKey)
          );
          if (!chart) {
            throw new Error('The chart does not exist');
          }
          return chart.content;
        },

        removeChart: async (
          id: string | number,
          persistenceKey?: string
        ): Promise<void> => {
          const state = get();
          const filteredCharts = state.charts.filter(
            (chart) =>
              !(
                chartIdsMatch(chart.id, id) &&
                (persistenceKey === undefined ||
                  chart.persistenceKey === persistenceKey)
              )
          );
          if (filteredCharts.length === state.charts.length) {
            throw new Error('The chart does not exist');
          }
          set({ charts: filteredCharts });
        },

        // Study Template operations
        saveStudyTemplate: async (
          studyTemplateData: StudyTemplateData
        ): Promise<void> => {
          const state = get();
          const filteredTemplates = state.studyTemplates.filter(
            (template) => template.name !== studyTemplateData.name
          );
          set({ studyTemplates: [...filteredTemplates, studyTemplateData] });
        },

        getAllStudyTemplates: async (): Promise<StudyTemplateData[]> => {
          return get().studyTemplates;
        },

        getStudyTemplateContent: async (
          studyTemplateData: StudyTemplateMetaInfo
        ): Promise<string> => {
          const state = get();
          const template = state.studyTemplates.find(
            (t) => t.name === studyTemplateData.name
          );
          if (!template) {
            throw new Error('The study template does not exist');
          }
          return template.content;
        },

        removeStudyTemplate: async (
          studyTemplateData: StudyTemplateMetaInfo
        ): Promise<void> => {
          const state = get();
          const filteredTemplates = state.studyTemplates.filter(
            (template) => template.name !== studyTemplateData.name
          );
          if (filteredTemplates.length === state.studyTemplates.length) {
            throw new Error('The study template does not exist');
          }
          set({ studyTemplates: filteredTemplates });
        },

        // Drawing Template operations
        saveDrawingTemplate: async (
          toolName: string,
          templateName: string,
          content: string
        ): Promise<void> => {
          const state = get();
          const filteredTemplates = state.drawingTemplates.filter(
            (template) =>
              !(
                template.name === templateName && template.toolName === toolName
              )
          );
          set({
            drawingTemplates: [
              ...filteredTemplates,
              { name: templateName, content, toolName },
            ],
          });
        },

        getDrawingTemplates: async (): Promise<string[]> => {
          const state = get();
          return state.drawingTemplates.map((template) => template.name);
        },

        loadDrawingTemplate: async (
          toolName: string,
          templateName: string
        ): Promise<string> => {
          const state = get();
          const template = state.drawingTemplates.find(
            (t) => t.name === templateName && t.toolName === toolName
          );
          if (!template) {
            throw new Error('The drawing template does not exist');
          }
          return template.content;
        },

        removeDrawingTemplate: async (
          toolName: string,
          templateName: string
        ): Promise<void> => {
          const state = get();
          const filteredTemplates = state.drawingTemplates.filter(
            (template) =>
              !(
                template.name === templateName && template.toolName === toolName
              )
          );
          if (filteredTemplates.length === state.drawingTemplates.length) {
            throw new Error('The drawing template does not exist');
          }
          set({ drawingTemplates: filteredTemplates });
        },

        // Chart Template operations
        saveChartTemplate: async (
          templateName: string,
          content: ChartTemplateContent
        ): Promise<void> => {
          const state = get();
          const existingTemplate = state.chartTemplates.find(
            (t) => t.name === templateName
          );

          if (existingTemplate) {
            existingTemplate.content = content;
            set({ chartTemplates: [...state.chartTemplates] });
          } else {
            set({
              chartTemplates: [
                ...state.chartTemplates,
                { name: templateName, content },
              ],
            });
          }
        },

        getAllChartTemplates: async (): Promise<string[]> => {
          const state = get();
          return state.chartTemplates.map((template) => template.name);
        },

        getChartTemplateContent: async (
          templateName: string
        ): Promise<ChartTemplate> => {
          const state = get();
          const template = state.chartTemplates.find(
            (t) => t.name === templateName
          );
          if (!template?.content) {
            throw new Error('The chart template does not exist');
          }
          return {
            content: structuredClone(template.content),
          };
        },

        removeChartTemplate: async (templateName: string): Promise<void> => {
          const state = get();
          const filteredTemplates = state.chartTemplates.filter(
            (template) => template.name !== templateName
          );
          if (filteredTemplates.length === state.chartTemplates.length) {
            throw new Error('The chart template does not exist');
          }
          set({ chartTemplates: filteredTemplates });
        },

        // Auto-save actions
        setAutoSaveEnabled: (enabled: boolean) => {
          set({ autoSaveEnabled: enabled });
        },
        setLastSavedLayoutId: (
          layoutId: string | null,
          persistenceKey?: string
        ) => {
          const key = persistenceKey ?? '__global__';
          const normalized =
            layoutId !== null && layoutId !== undefined
              ? String(layoutId)
              : null;
          set((state) => ({
            lastSavedLayoutIds: {
              ...state.lastSavedLayoutIds,
              [key]: normalized,
            },
          }));
        },
        getLastSavedLayoutId: (persistenceKey?: string) => {
          const key = persistenceKey ?? '__global__';
          const state = get();
          return state.lastSavedLayoutIds[key] ?? null;
        },

        // Line Tools and Groups operations
        saveLineToolsAndGroups: async (
          layoutId: string | undefined,
          chartId: string | number,
          state: string,
          persistenceKey?: string
        ): Promise<void> => {
          const normalizedLayoutId = normalizeChartId(layoutId);
          const normalizedChartId = normalizeChartId(chartId);
          if (!normalizedLayoutId || !normalizedChartId) return; // Can't save without identifiers

          const storage = get().lineToolsStorage;

          // Find existing entry for this layout+chart+persistenceKey combination
          const existingItem = storage.find(
            (item) =>
              item.layoutId === normalizedLayoutId &&
              chartIdsMatch(item.chartId, normalizedChartId) &&
              item.persistenceKey === persistenceKey
          );

          let mergedState = state;

          // If there's existing data, merge the sources instead of replacing
          if (existingItem) {
            try {
              const existingData = JSON.parse(existingItem.state);
              const newData = JSON.parse(state);

              // Merge sources - keep existing sources and add/update with new ones
              const mergedSources = new Map(existingData.sources || []);
              if (newData.sources) {
                newData.sources.forEach(([key, value]: [string, any]) => {
                  mergedSources.set(key, value);
                });
              }

              // Merge groups similarly
              const mergedGroups = new Map(existingData.groups || []);
              if (newData.groups) {
                newData.groups.forEach(([key, value]: [string, any]) => {
                  mergedGroups.set(key, value);
                });
              }

              const mergedData = {
                sources: Array.from(mergedSources.entries()),
                groups: Array.from(mergedGroups.entries()),
                symbol: newData.symbol || existingData.symbol,
              };

              mergedState = JSON.stringify(mergedData);
            } catch (error) {
              console.warn(
                '[TradingView Store] Failed to merge line tools, using new state:',
                error
              );
              // If merging fails, fall back to using the new state as-is
            }
          }

          // Remove existing entry
          const filtered = storage.filter(
            (item) =>
              !(
                item.layoutId === normalizedLayoutId &&
                chartIdsMatch(item.chartId, normalizedChartId) &&
                item.persistenceKey === persistenceKey
              )
          );

          // Add new/merged entry
          set({
            lineToolsStorage: [
              ...filtered,
              {
                layoutId: normalizedLayoutId,
                chartId: normalizedChartId,
                state: mergedState,
                timestamp: Date.now(),
                ...(persistenceKey && { persistenceKey }),
              },
            ],
          });
        },

        loadLineToolsAndGroups: async (
          layoutId: string | undefined,
          chartId: string | number,
          persistenceKey?: string
        ): Promise<string | null> => {
          const normalizedLayoutId = normalizeChartId(layoutId);
          const normalizedChartId = normalizeChartId(chartId);
          if (!normalizedLayoutId || !normalizedChartId) return null;

          const storage = get().lineToolsStorage;
          const found = storage.find(
            (item) =>
              item.layoutId === normalizedLayoutId &&
              chartIdsMatch(item.chartId, normalizedChartId) &&
              item.persistenceKey === persistenceKey
          );

          return found ? found.state : null;
        },
      }),
      {
        name: 'tradingview-storage',
        // Use IndexedDB for larger capacity (chart layouts can be large)
        storage: createIndexedDBStorage('tradingview-storage'),
        // Only persist the data, not the functions
        partialize: (state) => ({
          charts: state.charts,
          studyTemplates: state.studyTemplates,
          drawingTemplates: state.drawingTemplates,
          chartTemplates: state.chartTemplates,
          lineToolsStorage: state.lineToolsStorage,
          autoSaveEnabled: state.autoSaveEnabled,
          lastSavedLayoutIds: state.lastSavedLayoutIds,
        }),
        onRehydrateStorage: () => (_state, error) => {
          if (error) {
            logger.error('[TradingView Store] Rehydration error:', error);
          }
          useTradingViewStore.getState().setHasHydrated(true);
        },
      }
    ),
    {
      category: 'tvLayouts',
      selector: (state) => [
        ...state.charts.map((chart: ChartData) => ({
          ...chart,
          docType: 'chart',
        })),
        ...state.lineToolsStorage.map((drawing: SerializedLineToolsState) => ({
          ...drawing,
          // Generate composite ID from layoutId and chartId for PouchDB sync
          id: `drawing_${drawing.layoutId}_${drawing.chartId}${drawing.persistenceKey ? `_${drawing.persistenceKey}` : ''}`,
          docType: 'drawing',
        })),
      ],
      debounceMs: 1000,
    }
  )
);

// Helper functions
function generateUniqueChartId(chartName?: string): string {
  const timestamp = Date.now();
  const layoutName = chartName
    ? chartName.toLowerCase().replace(/\s+/g, '_')
    : `layout_${timestamp}`;
  return `tvLayouts_${layoutName}_${timestamp}`;
}
