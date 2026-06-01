import { createIndexedDBStorage } from '@/lib/zustand-indexeddb-storage';
import type { Layout } from 'react-grid-layout';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  getBotWidgetMetadata,
  type BotWidgetType,
} from '../components/widgets/bots';
import {
  getCompatibilityDefaultSize,
  getCurrentBreakpoint,
  getDefaultWidgetSize,
} from '../components/widgets/DefaultWidgetSizes';
import { DCA_BOT_TYPE_ID } from '../features/bots/constants/botTypeIds';
import {
  ensureBotRegistryBootstrapped,
  resolveBotType,
} from '../features/bots/registry';
import logger from '../lib/loggerInstance';
import type { SavedLayout } from '../types/layout';
import { getEnhancedScreenSize, getScreenSize } from '../utils/screenSize';

const BOT_LAYOUT_VERSION = '4.0';
const LEGACY_LAYOUT_VERSION_KEY = 'bot-layout-version';

const getProfileKey = (
  botTypeId: string | null | undefined,
  mode: 'create' | 'edit'
) => `${botTypeId ?? 'unknown'}:${mode}`;

const getLayoutVersionStorageKey = (profileKey: string) =>
  `${LEGACY_LAYOUT_VERSION_KEY}:${profileKey}`;

interface BotWidgetConfig {
  id: string;
  type: BotWidgetType;
  title: string;
  layoutData: Layout;
  data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  tabs?: Array<{ id: string; title: string; data?: Record<string, unknown> }>;
  hasOptions?: boolean;
}

interface CreateBotStoreOptions {
  defaultBotTypeId?: string | null;
}

interface InitializeWidgetsOptions {
  botTypeId?: string | null;
  mode?: 'create' | 'edit';
  forceReset?: boolean;
}

interface BotLayoutProfile {
  widgets: BotWidgetConfig[];
  currentLayout: Layout[];
  savedLayouts: SavedLayout<BotWidgetConfig>[];
  lastSavedPreset: string | null;
  isGridLayoutLocked: boolean;
}

interface BotStoreState {
  isGridLayoutLocked: boolean;
  widgets: BotWidgetConfig[];
  currentLayout: Layout[];
  savedLayouts: SavedLayout<BotWidgetConfig>[];
  lastSavedPreset: string | null;
  widgetSet: 'create' | 'edit'; // Legacy name maintained for compatibility
  mode: 'create' | 'edit';
  botTypeId: string | null;
  profileKey: string;
  profileSnapshots: Record<string, BotLayoutProfile>;
  setBotTypeId: (botTypeId: string | null) => void;
  initializeDefaultWidgets: (options?: InitializeWidgetsOptions) => void;

  // Required functions for compatibility with GridLayout and WidgetsManager
  updateLayout: (newLayout: Layout[]) => void;
  addWidget: (widget: BotWidgetConfig) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<BotWidgetConfig>) => void;
  reorderWidgets: (activeId: string, overId: string) => void;
  markLayoutAsCustomized: () => void;
  tidyUpLayout: () => void;
  toggleGridLock: () => void;

  // Layout management methods
  saveLayout: (name: string) => void;
  loadLayout: (name: string) => void;
  deleteLayout: (name: string) => void;
  resetToLastSavedPreset: () => void;
  exportLayout: () => string;
  importLayout: (layoutData: string) => boolean;
  applyLayoutPreset: (presetName: string) => void;

  // Tab management stubs (for compatibility)
  moveTab: (
    fromWidgetId: string,
    toWidgetId: string,
    tabId: string,
    toIndex?: number
  ) => void;
  reorderTabs: (widgetId: string, fromIndex: number, toIndex: number) => void;

  // Force layout reset
  forceLayoutReset: () => void;
}

function createBotStore(
  storeKey: string,
  widgetSet: 'create' | 'edit' = 'create',
  options: CreateBotStoreOptions = {}
) {
  return create<BotStoreState>()(
    devtools(
      persist(
        (set, get) => {
          const initialMode: 'create' | 'edit' = widgetSet;
          const initialBotTypeId = options.defaultBotTypeId ?? null;
          const initialProfileKey = getProfileKey(
            initialBotTypeId,
            initialMode
          );

          const createEmptyProfile = (): BotLayoutProfile => ({
            widgets: [],
            currentLayout: [],
            savedLayouts: [],
            lastSavedPreset: null,
            isGridLayoutLocked: false,
          });

          const ensureSnapshot = (
            snapshots: Record<string, BotLayoutProfile>,
            profileKey: string
          ): BotLayoutProfile => snapshots[profileKey] ?? createEmptyProfile();

          const initialProfile = createEmptyProfile();

          return {
            isGridLayoutLocked: initialProfile.isGridLayoutLocked,
            widgets: initialProfile.widgets,
            currentLayout: initialProfile.currentLayout,
            savedLayouts: initialProfile.savedLayouts,
            lastSavedPreset: initialProfile.lastSavedPreset,
            widgetSet,
            mode: initialMode,
            botTypeId: initialBotTypeId,
            profileKey: initialProfileKey,
            profileSnapshots: {
              [initialProfileKey]: initialProfile,
            },
            setBotTypeId: (botTypeId) => set({ botTypeId }),

            initializeDefaultWidgets: (initOptions) => {
              try {
                ensureBotRegistryBootstrapped();

                const state = get();
                const requestedMode =
                  initOptions?.mode ?? state.mode ?? widgetSet;
                const activeMode: 'create' | 'edit' =
                  requestedMode === 'edit' ? 'edit' : 'create';

                const desiredBotTypeId =
                  initOptions?.botTypeId ??
                  state.botTypeId ??
                  options.defaultBotTypeId ??
                  null;

                const resolvedConfig = resolveBotType(
                  desiredBotTypeId ?? undefined
                );

                const profileKey = getProfileKey(resolvedConfig.id, activeMode);

                const defaultWidgetTypes =
                  activeMode === 'edit'
                    ? resolvedConfig.defaults.editWidgetTypes
                    : resolvedConfig.defaults.createWidgetTypes;

                if (!defaultWidgetTypes || defaultWidgetTypes.length === 0) {
                  console.warn(
                    `[BotStore] No default widget types registered for botType=${resolvedConfig.id} (mode=${activeMode}). Skipping initialization.`
                  );

                  set((prevState) => ({
                    botTypeId: resolvedConfig.id,
                    mode: activeMode,
                    profileKey,
                    profileSnapshots: {
                      ...prevState.profileSnapshots,
                      [profileKey]: ensureSnapshot(
                        prevState.profileSnapshots,
                        profileKey
                      ),
                    },
                  }));
                  return;
                }

                const layoutPresets =
                  resolvedConfig.defaults.layoutPresets?.[activeMode];

                const desiredVersion = `${resolvedConfig.id}:${activeMode}:${BOT_LAYOUT_VERSION}`;

                let currentVersion: string | null = null;
                if (typeof window !== 'undefined') {
                  const versionKey = getLayoutVersionStorageKey(profileKey);
                  currentVersion =
                    localStorage.getItem(versionKey) ??
                    localStorage.getItem(LEGACY_LAYOUT_VERSION_KEY);
                }

                const existingSnapshot = ensureSnapshot(
                  state.profileSnapshots,
                  profileKey
                );

                const shouldReset =
                  initOptions?.forceReset ||
                  existingSnapshot.widgets.length === 0 ||
                  currentVersion !== desiredVersion;

                if (shouldReset) {
                  const baseWidth =
                    typeof window !== 'undefined'
                      ? Math.max(window.innerWidth - 64, 320)
                      : 1200;
                  const breakpoint = getCurrentBreakpoint(baseWidth);
                  const isMobile = baseWidth < 768;
                  const isTablet = baseWidth >= 768 && baseWidth < 1024;
                  const screenType = isMobile
                    ? 'mobile'
                    : isTablet
                      ? 'tablet'
                      : 'desktop';

                  let fallbackY = 0;

                  const widgets: BotWidgetConfig[] = defaultWidgetTypes.map(
                    (widgetType, index) => {
                      const preset = layoutPresets?.[widgetType]?.[screenType];
                      const defaultSize = getDefaultWidgetSize(
                        widgetType,
                        breakpoint
                      );
                      const layout = preset ?? {
                        x: 0,
                        y: fallbackY,
                        w: defaultSize.w,
                        h: defaultSize.h,
                      };

                      if (!preset) {
                        fallbackY += defaultSize.h;
                      }

                      const uniqueId = `${widgetType}-${activeMode}-${Date.now()}-${index}`;

                      return {
                        id: uniqueId,
                        type: widgetType,
                        title: getBotWidgetMetadata(widgetType).title,
                        layoutData: {
                          i: uniqueId,
                          x: layout.x,
                          y: layout.y,
                          w: layout.w,
                          h: layout.h,
                          moved: false,
                          static: false,
                          minW:
                            widgetType === 'create-bot' ||
                            widgetType === 'edit-bot'
                              ? isMobile
                                ? 12
                                : 6
                              : isMobile
                                ? 12
                                : 3,
                          minH:
                            widgetType === 'create-bot' ||
                            widgetType === 'edit-bot'
                              ? 8
                              : 4,
                          maxW: 12,
                          maxH:
                            widgetType === 'create-bot' ||
                            widgetType === 'edit-bot'
                              ? 16
                              : 12,
                        },
                        data: {},
                        settings: {},
                        hasOptions:
                          getBotWidgetMetadata(widgetType).hasOptions || false,
                      };
                    }
                  );

                  const newProfile: BotLayoutProfile = {
                    widgets,
                    currentLayout: widgets.map((w) => w.layoutData),
                    savedLayouts: [],
                    lastSavedPreset: null,
                    isGridLayoutLocked: false,
                  };

                  set((prevState) => ({
                    widgets: newProfile.widgets,
                    currentLayout: newProfile.currentLayout,
                    savedLayouts: newProfile.savedLayouts,
                    lastSavedPreset: newProfile.lastSavedPreset,
                    isGridLayoutLocked: newProfile.isGridLayoutLocked,
                    botTypeId: resolvedConfig.id,
                    mode: activeMode,
                    profileKey,
                    profileSnapshots: {
                      ...prevState.profileSnapshots,
                      [profileKey]: newProfile,
                    },
                  }));

                  if (!layoutPresets) {
                    try {
                      get().tidyUpLayout();
                    } catch (error) {
                      console.error(
                        'Failed to tidy layout after initialization:',
                        error
                      );
                    }
                  }
                } else {
                  set((prevState) => ({
                    widgets: existingSnapshot.widgets,
                    currentLayout: existingSnapshot.currentLayout,
                    savedLayouts: existingSnapshot.savedLayouts,
                    lastSavedPreset: existingSnapshot.lastSavedPreset,
                    isGridLayoutLocked: existingSnapshot.isGridLayoutLocked,
                    botTypeId: resolvedConfig.id,
                    mode: activeMode,
                    profileKey,
                    profileSnapshots: {
                      ...prevState.profileSnapshots,
                      [profileKey]: existingSnapshot,
                    },
                  }));
                }

                if (typeof window !== 'undefined') {
                  const versionKey = getLayoutVersionStorageKey(profileKey);
                  localStorage.setItem(versionKey, desiredVersion);
                  localStorage.removeItem(LEGACY_LAYOUT_VERSION_KEY);
                }
              } catch (error) {
                console.error('Failed to initialize bot widgets:', error);
                const fallbackKey = getProfileKey(
                  options.defaultBotTypeId ?? null,
                  widgetSet
                );
                const emptyProfile = createEmptyProfile();
                set((prevState) => ({
                  widgets: emptyProfile.widgets,
                  currentLayout: emptyProfile.currentLayout,
                  savedLayouts: emptyProfile.savedLayouts,
                  lastSavedPreset: emptyProfile.lastSavedPreset,
                  isGridLayoutLocked: emptyProfile.isGridLayoutLocked,
                  botTypeId: options.defaultBotTypeId ?? null,
                  mode: widgetSet,
                  profileKey: fallbackKey,
                  profileSnapshots: {
                    ...prevState.profileSnapshots,
                    [fallbackKey]: emptyProfile,
                  },
                }));
              }
            },

            updateLayout: (newLayout) =>
              set((state) => ({
                currentLayout: newLayout,
                profileSnapshots: {
                  ...state.profileSnapshots,
                  [state.profileKey]: {
                    widgets: state.widgets,
                    currentLayout: newLayout,
                    savedLayouts: state.savedLayouts,
                    lastSavedPreset: state.lastSavedPreset,
                    isGridLayoutLocked: state.isGridLayoutLocked,
                  },
                },
              })),

            addWidget: (widget) =>
              set((state) => {
                const widgets = [...state.widgets, widget];
                return {
                  widgets,
                  profileSnapshots: {
                    ...state.profileSnapshots,
                    [state.profileKey]: {
                      widgets,
                      currentLayout: state.currentLayout,
                      savedLayouts: state.savedLayouts,
                      lastSavedPreset: state.lastSavedPreset,
                      isGridLayoutLocked: state.isGridLayoutLocked,
                    },
                  },
                };
              }),

            removeWidget: (widgetId) =>
              set((state) => {
                const widgets = state.widgets.filter((w) => w.id !== widgetId);
                const currentLayout = state.currentLayout.filter(
                  (l) => l.i !== widgetId
                );
                return {
                  widgets,
                  currentLayout,
                  profileSnapshots: {
                    ...state.profileSnapshots,
                    [state.profileKey]: {
                      widgets,
                      currentLayout,
                      savedLayouts: state.savedLayouts,
                      lastSavedPreset: state.lastSavedPreset,
                      isGridLayoutLocked: state.isGridLayoutLocked,
                    },
                  },
                };
              }),

            updateWidget: (widgetId, updates) =>
              set((state) => {
                const updatedWidgets = state.widgets.map((w) =>
                  w.id === widgetId ? { ...w, ...updates } : w
                );

                const newCurrentLayout = updatedWidgets.map((widget) => ({
                  ...widget.layoutData,
                }));

                return {
                  widgets: updatedWidgets,
                  currentLayout: newCurrentLayout,
                  profileSnapshots: {
                    ...state.profileSnapshots,
                    [state.profileKey]: {
                      widgets: updatedWidgets,
                      currentLayout: newCurrentLayout,
                      savedLayouts: state.savedLayouts,
                      lastSavedPreset: state.lastSavedPreset,
                      isGridLayoutLocked: state.isGridLayoutLocked,
                    },
                  },
                };
              }),

            reorderWidgets: (activeId, overId) =>
              set((state) => {
                const activeIndex = state.widgets.findIndex(
                  (w) => w.id === activeId
                );
                const overIndex = state.widgets.findIndex(
                  (w) => w.id === overId
                );

                if (activeIndex === -1 || overIndex === -1) {
                  return state;
                }

                const newWidgets = [...state.widgets];
                const [movedWidget] = newWidgets.splice(activeIndex, 1);
                newWidgets.splice(overIndex, 0, movedWidget);

                const GRID_COLS = 12;
                let currentX = 0;
                let currentY = 0;
                let rowHeight = 0;

                const updatedWidgets = newWidgets.map((widget) => {
                  const widgetWidth = widget.layoutData.w;
                  const widgetHeight = widget.layoutData.h;

                  if (currentX + widgetWidth > GRID_COLS) {
                    currentX = 0;
                    currentY += rowHeight;
                    rowHeight = 0;
                  }

                  const updatedWidget = {
                    ...widget,
                    layoutData: {
                      ...widget.layoutData,
                      x: currentX,
                      y: currentY,
                    },
                  };

                  currentX += widgetWidth;
                  rowHeight = Math.max(rowHeight, widgetHeight);

                  return updatedWidget;
                });

                const newCurrentLayout = updatedWidgets.map((widget) => ({
                  ...widget.layoutData,
                }));

                return {
                  widgets: updatedWidgets,
                  currentLayout: newCurrentLayout,
                  profileSnapshots: {
                    ...state.profileSnapshots,
                    [state.profileKey]: {
                      widgets: updatedWidgets,
                      currentLayout: newCurrentLayout,
                      savedLayouts: state.savedLayouts,
                      lastSavedPreset: state.lastSavedPreset,
                      isGridLayoutLocked: state.isGridLayoutLocked,
                    },
                  },
                };
              }),

            markLayoutAsCustomized: () => {
              // Stub implementation - bot layouts are always customizable
            },

            tidyUpLayout: () => {
              const state = get();

              if (state.widgets.length === 0) {
                return;
              }

              const getDefaultSize = (type: string) => {
                return getCompatibilityDefaultSize(type);
              };

              const GRID_COLS = 12;

              const createTidyLayout = (
                widgets: BotWidgetConfig[]
              ): Layout[] => {
                const layouts: Layout[] = [];
                let currentX = 0;
                let currentY = 0;
                let rowHeight = 0;

                for (const widget of widgets) {
                  const defaultSize = getDefaultSize(widget.type);
                  const widgetWidth = defaultSize.w;
                  const widgetHeight = defaultSize.h;

                  if (currentX + widgetWidth > GRID_COLS) {
                    currentX = 0;
                    currentY += rowHeight;
                    rowHeight = 0;
                  }

                  layouts.push({
                    i: widget.id,
                    x: currentX,
                    y: currentY,
                    w: widgetWidth,
                    h: widgetHeight,
                  });

                  currentX += widgetWidth;
                  rowHeight = Math.max(rowHeight, widgetHeight);
                }

                return layouts;
              };

              const initialLayout = createTidyLayout(state.widgets);

              const updatedWidgets = state.widgets.map((widget) => {
                const layoutItem = initialLayout.find(
                  (item) => item.i === widget.id
                );
                if (layoutItem) {
                  return {
                    ...widget,
                    layoutData: { ...layoutItem },
                  };
                }
                return widget;
              });

              set((prevState) => ({
                widgets: updatedWidgets,
                currentLayout: initialLayout,
                profileSnapshots: {
                  ...prevState.profileSnapshots,
                  [prevState.profileKey]: {
                    widgets: updatedWidgets,
                    currentLayout: initialLayout,
                    savedLayouts: prevState.savedLayouts,
                    lastSavedPreset: prevState.lastSavedPreset,
                    isGridLayoutLocked: prevState.isGridLayoutLocked,
                  },
                },
              }));
            },

            toggleGridLock: () =>
              set((state) => {
                const isGridLayoutLocked = !state.isGridLayoutLocked;
                return {
                  isGridLayoutLocked,
                  profileSnapshots: {
                    ...state.profileSnapshots,
                    [state.profileKey]: {
                      widgets: state.widgets,
                      currentLayout: state.currentLayout,
                      savedLayouts: state.savedLayouts,
                      lastSavedPreset: state.lastSavedPreset,
                      isGridLayoutLocked,
                    },
                  },
                };
              }),

            saveLayout: (name: string) => {
              try {
                const screenInfo = getEnhancedScreenSize();
                set((state) => {
                  const filtered = state.savedLayouts.filter(
                    (l) => l.name !== name
                  );
                  const savedLayouts = [
                    ...filtered,
                    {
                      name,
                      layout: state.currentLayout,
                      widgets: state.widgets,
                      screenSize: getScreenSize(),
                      screenInfo,
                    },
                  ];
                  return {
                    savedLayouts,
                    lastSavedPreset: name,
                    profileSnapshots: {
                      ...state.profileSnapshots,
                      [state.profileKey]: {
                        widgets: state.widgets,
                        currentLayout: state.currentLayout,
                        savedLayouts,
                        lastSavedPreset: name,
                        isGridLayoutLocked: state.isGridLayoutLocked,
                      },
                    },
                  };
                });
              } catch (error) {
                console.error('Failed to save layout to localStorage:', error);
              }
            },

            loadLayout: (name: string) => {
              try {
                const found = get().savedLayouts.find((l) => l.name === name);
                if (found) {
                  set((state) => ({
                    widgets: found.widgets,
                    currentLayout: found.layout,
                    lastSavedPreset: name,
                    profileSnapshots: {
                      ...state.profileSnapshots,
                      [state.profileKey]: {
                        widgets: found.widgets,
                        currentLayout: found.layout,
                        savedLayouts: state.savedLayouts,
                        lastSavedPreset: name,
                        isGridLayoutLocked: state.isGridLayoutLocked,
                      },
                    },
                  }));
                }
              } catch (error) {
                console.error(
                  'Failed to load layout from localStorage:',
                  error
                );
              }
            },

            deleteLayout: (name: string) => {
              try {
                set((state) => {
                  const savedLayouts = state.savedLayouts.filter(
                    (l) => l.name !== name
                  );
                  const lastSavedPreset =
                    state.lastSavedPreset === name
                      ? null
                      : state.lastSavedPreset;
                  return {
                    savedLayouts,
                    lastSavedPreset,
                    profileSnapshots: {
                      ...state.profileSnapshots,
                      [state.profileKey]: {
                        widgets: state.widgets,
                        currentLayout: state.currentLayout,
                        savedLayouts,
                        lastSavedPreset,
                        isGridLayoutLocked: state.isGridLayoutLocked,
                      },
                    },
                  };
                });
              } catch (error) {
                console.error(
                  'Failed to delete layout from localStorage:',
                  error
                );
              }
            },

            resetToLastSavedPreset: () => {
              try {
                const state = get();
                if (state.lastSavedPreset) {
                  const found = state.savedLayouts.find(
                    (l) => l.name === state.lastSavedPreset
                  );
                  if (found) {
                    set((prevState) => ({
                      widgets: found.widgets,
                      currentLayout: found.layout,
                      profileSnapshots: {
                        ...prevState.profileSnapshots,
                        [prevState.profileKey]: {
                          widgets: found.widgets,
                          currentLayout: found.layout,
                          savedLayouts: prevState.savedLayouts,
                          lastSavedPreset: prevState.lastSavedPreset,
                          isGridLayoutLocked: prevState.isGridLayoutLocked,
                        },
                      },
                    }));
                    return;
                  }
                }
                get().initializeDefaultWidgets();
              } catch (error) {
                console.error('Failed to reset to last saved preset:', error);
              }
            },

            exportLayout: () => {
              const state = get();
              const screenInfo = getEnhancedScreenSize();
              return JSON.stringify({
                profileKey: state.profileKey,
                botTypeId: state.botTypeId,
                mode: state.mode,
                widgets: state.widgets,
                currentLayout: state.currentLayout,
                savedLayouts: state.savedLayouts,
                exportedAt: new Date().toISOString(),
                screenSize: getScreenSize(),
                screenInfo,
                version: '1.2',
              });
            },

            importLayout: (layoutData: string) => {
              try {
                const parsedData = JSON.parse(layoutData);
                if (parsedData.widgets && parsedData.currentLayout) {
                  set((state) => ({
                    widgets: parsedData.widgets,
                    currentLayout: parsedData.currentLayout,
                    savedLayouts: parsedData.savedLayouts || state.savedLayouts,
                    profileSnapshots: {
                      ...state.profileSnapshots,
                      [state.profileKey]: {
                        widgets: parsedData.widgets,
                        currentLayout: parsedData.currentLayout,
                        savedLayouts:
                          parsedData.savedLayouts || state.savedLayouts,
                        lastSavedPreset: state.lastSavedPreset,
                        isGridLayoutLocked: state.isGridLayoutLocked,
                      },
                    },
                  }));
                  return true;
                }
                return false;
              } catch {
                return false;
              }
            },

            applyLayoutPreset: (presetName: string) => {
              if (presetName === 'default') {
                get().initializeDefaultWidgets();
              }
            },

            moveTab: () => {
              // Stub implementation - bot widgets don't typically use tabs
            },

            reorderTabs: () => {
              // Stub implementation - bot widgets don't typically use tabs
            },

            forceLayoutReset: () => {
              logger.info(
                '[BotStore] Force resetting layout - clearing all data'
              );

              if (typeof window !== 'undefined') {
                const state = get();
                Object.keys(state.profileSnapshots).forEach((key) => {
                  localStorage.removeItem(getLayoutVersionStorageKey(key));
                });
                localStorage.removeItem(LEGACY_LAYOUT_VERSION_KEY);
                localStorage.removeItem('trading-bot-store');
                localStorage.removeItem('combo-bot-store');
                localStorage.removeItem('grid-bot-store');
                localStorage.removeItem('hedge-dca-bot-store');
                localStorage.removeItem('hedge-combo-bot-store');
              }

              const resetProfile = createEmptyProfile();

              set((state) => ({
                widgets: resetProfile.widgets,
                currentLayout: resetProfile.currentLayout,
                savedLayouts: resetProfile.savedLayouts,
                lastSavedPreset: resetProfile.lastSavedPreset,
                isGridLayoutLocked: resetProfile.isGridLayoutLocked,
                profileSnapshots: {
                  [state.profileKey]: resetProfile,
                },
              }));

              setTimeout(() => {
                const currentBotTypeId = get().botTypeId;
                get().initializeDefaultWidgets({
                  botTypeId:
                    currentBotTypeId ?? options.defaultBotTypeId ?? null,
                  mode: widgetSet,
                  forceReset: true,
                });
              }, 100);
            },
          };
        },
        {
          name: storeKey,
          storage: createIndexedDBStorage(storeKey),
          version: 2,
          partialize: (state) => ({
            isGridLayoutLocked: state.isGridLayoutLocked,
            widgets: state.widgets,
            currentLayout: state.currentLayout,
            savedLayouts: state.savedLayouts,
            lastSavedPreset: state.lastSavedPreset,
            widgetSet: state.widgetSet,
            mode: state.mode,
            botTypeId: state.botTypeId,
            profileKey: state.profileKey,
            profileSnapshots: state.profileSnapshots,
          }),
          migrate: (persistedState, version) => {
            if (!persistedState || version >= 2) {
              return persistedState;
            }

            const legacyState = persistedState as Partial<BotStoreState> & {
              widgets?: BotWidgetConfig[];
              currentLayout?: Layout[];
              savedLayouts?: SavedLayout<BotWidgetConfig>[];
              lastSavedPreset?: string | null;
              isGridLayoutLocked?: boolean;
              profileSnapshots?: Record<string, BotLayoutProfile>;
            };

            const fallbackMode: 'create' | 'edit' =
              legacyState.mode === 'edit' || legacyState.widgetSet === 'edit'
                ? 'edit'
                : 'create';
            const fallbackBotTypeId =
              legacyState.botTypeId ?? options.defaultBotTypeId ?? null;
            const profileKey = getProfileKey(fallbackBotTypeId, fallbackMode);

            const profile: BotLayoutProfile = {
              widgets: legacyState.widgets ?? [],
              currentLayout: legacyState.currentLayout ?? [],
              savedLayouts: legacyState.savedLayouts ?? [],
              lastSavedPreset: legacyState.lastSavedPreset ?? null,
              isGridLayoutLocked: legacyState.isGridLayoutLocked ?? false,
            };

            return {
              ...legacyState,
              profileKey,
              profileSnapshots: {
                ...(legacyState.profileSnapshots ?? {}),
                [profileKey]: profile,
              },
            };
          },
        }
      )
    )
  );
}

export const useTradingBotStore = createBotStore(
  'trading-bot-store',
  'create',
  {
    defaultBotTypeId: DCA_BOT_TYPE_ID,
  }
);
export const useTradingBotEditStore = createBotStore(
  'trading-bot-edit-store',
  'edit',
  { defaultBotTypeId: DCA_BOT_TYPE_ID }
);
export const useComboBotStore = createBotStore('combo-bot-store', 'create', {
  defaultBotTypeId: 'combo',
});
export const useGridBotStore = createBotStore('grid-bot-store', 'create', {
  defaultBotTypeId: 'grid',
});
export const useGridBotEditStore = createBotStore(
  'grid-bot-edit-store',
  'edit',
  { defaultBotTypeId: 'grid' }
);
export const useHedgeDcaBotStore = createBotStore(
  'hedge-dca-bot-store',
  'create',
  {
    defaultBotTypeId: 'hedge-dca',
  }
);
export const useHedgeComboBotStore = createBotStore(
  'hedge-combo-bot-store',
  'create',
  { defaultBotTypeId: 'hedge-combo' }
);
export const useComboBotEditStore = createBotStore(
  'combo-bot-edit-store',
  'edit',
  { defaultBotTypeId: 'combo' }
);
export const useHedgeDcaBotEditStore = createBotStore(
  'hedge-dca-bot-edit-store',
  'edit',
  { defaultBotTypeId: 'hedge-dca' }
);
export const useHedgeComboBotEditStore = createBotStore(
  'hedge-combo-bot-edit-store',
  'edit',
  { defaultBotTypeId: 'hedge-combo' }
);

export { createBotStore };
