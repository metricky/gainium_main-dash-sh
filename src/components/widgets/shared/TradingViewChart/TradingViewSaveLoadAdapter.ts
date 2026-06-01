/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/loggerInstance';
import {
  useTradingViewStore,
  type ChartData,
  type ChartMetaInfo,
  type ChartTemplate,
  type ChartTemplateContent,
  type StudyTemplateData,
  type StudyTemplateMetaInfo,
} from '@/stores/tradingViewStore';
import type {
  EntityId,
  LineToolsAndGroupsLoadRequestContext,
  LineToolsAndGroupsLoadRequestType,
  LineToolsAndGroupsState,
  LineToolState,
} from 'public/static/charting_library/charting_library';

// Runtime registry to remember automated drawing IDs across save/load cycles
const automatedEntityIds = new Set<EntityId>();

// Recursively search an object for boolean flags
function deepFindFlags(
  obj: any,
  depth = 0,
  maxDepth = 4
): { lockFound: boolean; disableFound: boolean } {
  if (!obj || typeof obj !== 'object' || depth > maxDepth)
    return { lockFound: false, disableFound: false };
  let lockFound = false;
  let disableFound = false;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (k.toLowerCase() === 'lock' && v === true) lockFound = true;
    if (k.toLowerCase() === 'disableselection' && v === true)
      disableFound = true;
    if (typeof v === 'object') {
      const r = deepFindFlags(v, depth + 1, maxDepth);
      lockFound = lockFound || r.lockFound;
      disableFound = disableFound || r.disableFound;
    }
    if (lockFound && disableFound) break;
  }
  return { lockFound, disableFound };
}

function isAutomatedSource(source: LineToolState): boolean {
  try {
    const s: any = source?.state || {};
    const top: any = source as any;
    // If editable by user consider user drawing unless trade annotation pattern
    if (top.userEditEnabled === true || top.isSelectionEnabled === true) {
      const inner = s.state || s;
      const text = inner.text || inner.title || '';
      if (/^#\d+\nPnL:/i.test(text)) return true;
      return false;
    }
    const { lockFound, disableFound } = deepFindFlags(s);
    const shapeType = s.shape || s.type || s.tool || s.name || s?.state?.type;
    const overrides = s.overrides || s.properties || {};
    const lineColor =
      overrides.linecolor ||
      overrides.lineColor ||
      overrides.color ||
      s.state?.linecolor;
    const backgroundColor =
      overrides.backgroundColor || s.state?.backgroundColor;
    const text = s.text || overrides.text || s?.state?.text || '';
    const tradeShapes = [
      'arrow_up',
      'arrow_down',
      'trend_line',
      'rectangle',
      'comment',
      'LineToolTrendLine',
      'LineToolComment',
      'LineToolArrowMarkUp',
      'LineToolArrowMarkDown',
    ];
    const isTradeShape = tradeShapes.includes(shapeType);
    const tradeGreen = ['#00ff00', '#00FF00'];
    const tradeRed = ['#ff0040', '#FF0040'];
    const isTradeColor =
      (lineColor &&
        (tradeGreen.includes(lineColor) || tradeRed.includes(lineColor))) ||
      (backgroundColor &&
        (tradeGreen.includes(backgroundColor) ||
          tradeRed.includes(backgroundColor)));
    const hasTradeCommentPattern =
      typeof text === 'string' && /#\d+(?:\nPnL: )?/i.test(text);
    if (
      (top.userEditEnabled === false || top.isSelectionEnabled === false) &&
      isTradeShape &&
      (isTradeColor || hasTradeCommentPattern)
    )
      return true;
    if (
      lockFound &&
      (disableFound || isTradeColor || hasTradeCommentPattern) &&
      isTradeShape
    )
      return true;
    if (
      (lockFound || top.userEditEnabled === false) &&
      isTradeShape &&
      shapeType === 'rectangle' &&
      overrides.transparency != null
    )
      return true;
    return false;
  } catch {
    return false;
  }
}

// TradingView save/load adapter interface
export interface IExternalSaveLoadAdapter {
  getAllCharts(): Promise<ChartMetaInfo[]>;
  removeChart(id: string | number): Promise<void>;
  saveChart(chartData: ChartData): Promise<string>;
  getChartContent(id: string | number): Promise<string>;
  removeStudyTemplate(studyTemplateData: StudyTemplateMetaInfo): Promise<void>;
  getStudyTemplateContent(
    studyTemplateData: StudyTemplateMetaInfo
  ): Promise<string>;
  saveStudyTemplate(studyTemplateData: StudyTemplateData): Promise<void>;
  getAllStudyTemplates(): Promise<StudyTemplateData[]>;
  removeDrawingTemplate(toolName: string, templateName: string): Promise<void>;
  loadDrawingTemplate(toolName: string, templateName: string): Promise<string>;
  saveDrawingTemplate(
    toolName: string,
    templateName: string,
    content: string
  ): Promise<void>;
  getDrawingTemplates(): Promise<string[]>;
  getAllChartTemplates(): Promise<string[]>;
  saveChartTemplate(
    templateName: string,
    content: ChartTemplateContent
  ): Promise<void>;
  removeChartTemplate(templateName: string): Promise<void>;
  getChartTemplateContent(templateName: string): Promise<ChartTemplate>;
  saveLineToolsAndGroups(
    layoutId: string | undefined,
    chartId: string | number,
    state: LineToolsAndGroupsState
  ): Promise<void>;
  loadLineToolsAndGroups(
    layoutId: string | undefined,
    chartId: string | number,
    requestType: LineToolsAndGroupsLoadRequestType,
    requestContext: LineToolsAndGroupsLoadRequestContext
  ): Promise<Partial<LineToolsAndGroupsState> | null>;
}

interface LayoutLifecycleCallbacks {
  onLayoutSaved?: (layout: {
    id: string;
    name?: string | null;
    symbol?: string | null;
    resolution?: string | null;
  }) => void;
  onLayoutLoaded?: (layout: {
    id: string;
    name?: string | null;
    symbol?: string | null;
    resolution?: string | null;
  }) => void;
}

const normalizeId = (
  id: string | number | null | undefined
): string | undefined => {
  if (id === null || id === undefined) return undefined;
  return String(id);
};

export class ZustandSaveLoadAdapter implements IExternalSaveLoadAdapter {
  constructor(
    private readonly callbacks?: LayoutLifecycleCallbacks,
    private readonly persistenceKey?: string
  ) {}

  private getStore() {
    return useTradingViewStore.getState();
  }

  // Chart operations
  async getAllCharts(): Promise<ChartMetaInfo[]> {
    return this.getStore().getAllCharts(this.persistenceKey);
  }

  async removeChart(id: string | number): Promise<void> {
    return this.getStore().removeChart(id, this.persistenceKey);
  }

  async saveChart(chartData: ChartData): Promise<string> {
    try {
      const store = this.getStore();
      const dataWithKey = {
        ...chartData,
        ...(this.persistenceKey && { persistenceKey: this.persistenceKey }),
      };
      const chartId = await store.saveChart(dataWithKey);

      try {
        const normalizedId = normalizeId(chartId) ?? String(chartId);
        const savedChart = store.charts.find(
          (entry) => normalizeId(entry.id) === normalizedId
        );
        this.callbacks?.onLayoutSaved?.({
          id: normalizedId,
          name: savedChart?.name ?? chartData.name ?? null,
          symbol: savedChart?.symbol ?? chartData.symbol ?? null,
          resolution: savedChart?.resolution ?? chartData.resolution ?? null,
        });
      } catch (err) {
        logger.warn('Layout save callback failed', err);
      }
      return chartId;
    } catch (error) {
      logger.error('❌ [TradingView] Failed to save chart', {
        error,
        chartData: {
          id: chartData.id,
          name: chartData.name,
          symbol: chartData.symbol,
        },
      });
      throw error;
    }
  }

  async getChartContent(id: string | number): Promise<string> {
    const store = this.getStore();
    const content = await store.getChartContent(id, this.persistenceKey);
    try {
      const normalizedId = normalizeId(id);
      if (normalizedId) {
        const savedChart = store.charts.find(
          (entry) => normalizeId(entry.id) === normalizedId
        );
        if (savedChart) {
          this.callbacks?.onLayoutLoaded?.({
            id: normalizedId,
            name: savedChart.name ?? null,
            symbol: savedChart.symbol ?? null,
            resolution: savedChart.resolution ?? null,
          });
        }
      }
    } catch (err) {
      logger.warn('Layout load callback failed', err);
    }
    return content;
  }

  // Study Template operations
  async removeStudyTemplate(
    studyTemplateData: StudyTemplateMetaInfo
  ): Promise<void> {
    return this.getStore().removeStudyTemplate(studyTemplateData);
  }

  async getStudyTemplateContent(
    studyTemplateData: StudyTemplateMetaInfo
  ): Promise<string> {
    return this.getStore().getStudyTemplateContent(studyTemplateData);
  }

  async saveStudyTemplate(studyTemplateData: StudyTemplateData): Promise<void> {
    return this.getStore().saveStudyTemplate(studyTemplateData);
  }

  async getAllStudyTemplates(): Promise<StudyTemplateData[]> {
    return this.getStore().getAllStudyTemplates();
  }

  // Drawing Template operations
  async removeDrawingTemplate(
    toolName: string,
    templateName: string
  ): Promise<void> {
    return this.getStore().removeDrawingTemplate(toolName, templateName);
  }

  async loadDrawingTemplate(
    toolName: string,
    templateName: string
  ): Promise<string> {
    return this.getStore().loadDrawingTemplate(toolName, templateName);
  }

  async saveDrawingTemplate(
    toolName: string,
    templateName: string,
    content: string
  ): Promise<void> {
    return this.getStore().saveDrawingTemplate(toolName, templateName, content);
  }

  async getDrawingTemplates(): Promise<string[]> {
    return this.getStore().getDrawingTemplates();
  }

  // Chart Template operations
  async getAllChartTemplates(): Promise<string[]> {
    return this.getStore().getAllChartTemplates();
  }

  async saveChartTemplate(
    templateName: string,
    content: ChartTemplateContent
  ): Promise<void> {
    return this.getStore().saveChartTemplate(templateName, content);
  }

  async removeChartTemplate(templateName: string): Promise<void> {
    return this.getStore().removeChartTemplate(templateName);
  }

  async getChartTemplateContent(templateName: string): Promise<ChartTemplate> {
    return this.getStore().getChartTemplateContent(templateName);
  }

  // Line Tools and Groups operations
  async saveLineToolsAndGroups(
    layoutId: string | undefined,
    chartId: string | number,
    state: LineToolsAndGroupsState
  ): Promise<void> {
    // Fallback console logging for visibility if logger output filtered
    // (helps diagnose why user doesn't see logs in devtools)

    logger.info('[TV Adapter] saveLineToolsAndGroups called', {
      layoutId,
      chartId,
      sources: state.sources?.size || 0,
      groups: state.groups?.size || 0,
    });
    logger.info('🔵 Saving line tools and groups:', {
      layoutId,
      chartId,
      sourcesCount: state.sources?.size || 0,
      groupsCount: state.groups?.size || 0,
    });

    // Filter out automated drawings (locked and non-selectable)
    // These are created by transactions.ts and should not be persisted
    const filteredSources = new Map<EntityId, LineToolState | null>();

    if (state.sources) {
      // Capture raw sample for debugging (first call only each save cycle)
      try {
        const sample: any[] = [];
        state.sources.forEach((src) => {
          if (sample.length < 5 && src) {
            sample.push({
              id: src.id,
              keys: Object.keys(src.state || {}),
              state: src.state,
            });
          }
        });
        (window as any).__tvRawSourcesSample = sample; // dev inspection

        logger.info('[TV Adapter] raw source sample', sample);
      } catch {
        /* noop */
      }
      state.sources.forEach((source, key) => {
        if (!source) {
          filteredSources.set(key, null);
          return;
        }
        const automated = isAutomatedSource(source);
        if (automated) {
          automatedEntityIds.add(source.id);
          logger.warn('❌ Filtering out automated drawing (heuristic):', {
            id: source.id,
          });
        } else {
          filteredSources.set(key, source);
        }
      });
    }

    const filteredState: LineToolsAndGroupsState = {
      sources: filteredSources.size > 0 ? filteredSources : null,
      groups: state.groups,
      ...(state.symbol && { symbol: state.symbol }),
    };

    // Serialize and save
    const serialized = this.serializeLineToolsState(filteredState);
    await this.getStore().saveLineToolsAndGroups(
      layoutId,
      chartId,
      serialized,
      this.persistenceKey
    );
  }

  async loadLineToolsAndGroups(
    layoutId: string | undefined,
    chartId: string | number
  ): Promise<Partial<LineToolsAndGroupsState> | null> {
    const serialized = await this.getStore().loadLineToolsAndGroups(
      layoutId,
      chartId,
      this.persistenceKey
    );

    if (!serialized) {
      logger.info(
        '📭 No saved line tools found (this is normal for new charts)'
      );
      return null;
    }

    try {
      const state = this.deserializeLineToolsState(serialized);

      if (state.sources) {
        const cleaned = new Map<EntityId, LineToolState | null>();

        state.sources.forEach((src, id) => {
          // Skip null sources entirely - don't add them to cleaned map
          if (!src || !src?.state) {
            return;
          }

          if (automatedEntityIds.has(src.id) || isAutomatedSource(src)) {
            logger.warn('🚫 Removing automated drawing on load:', {
              id: src.id,
            });
          } else {
            cleaned.set(id, src);
          }
        });

        state.sources = cleaned.size ? cleaned : null;
      }
      return state;
    } catch (error) {
      logger.error('❌ Failed to deserialize line tools state:', error);
      return null;
    }
  }

  // Helper methods for serialization
  private serializeLineToolsState(state: LineToolsAndGroupsState): string {
    // Convert Maps to arrays for JSON serialization
    const sourcesArray = state.sources
      ? Array.from(state.sources.entries())
      : null;

    logger.info('[TV Adapter] Serializing line tools:', {
      sourcesCount: state.sources?.size || 0,
      sourcesArrayLength: sourcesArray?.length || 0,
      firstFewEntries: sourcesArray?.slice(0, 3),
    });

    const serializable = {
      sources: sourcesArray,
      groups: Array.from(state.groups.entries()),
      symbol: state.symbol,
    };
    return JSON.stringify(serializable);
  }

  private deserializeLineToolsState(
    serialized: string
  ): LineToolsAndGroupsState {
    const parsed = JSON.parse(serialized);

    logger.info('[TV Adapter] Deserializing line tools:', {
      rawSourcesLength: parsed.sources?.length || 0,
      rawSources: parsed.sources,
    });

    const sourcesMap = parsed.sources ? new Map(parsed.sources) : null;

    logger.info('[TV Adapter] Sources Map created:', {
      mapSize: sourcesMap?.size || 0,
      mapKeys: sourcesMap ? Array.from(sourcesMap.keys()) : [],
    });

    return {
      sources: sourcesMap as Map<EntityId, LineToolState | null> | null,
      groups: new Map(parsed.groups),
      symbol: parsed.symbol,
    };
  }
}
