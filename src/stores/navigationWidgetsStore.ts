import { pouchdbSync } from '@/lib/zustand-pouchdb-middleware';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavigationWidgetType =
  | 'watchlist'
  | 'profit-over-time'
  | 'fear-greed-index'
  | 'portfolio-value';

export interface NavigationWidgetConfig {
  id: string;
  type: NavigationWidgetType;
  title: string;
  settings: Record<string, unknown>;
  data: Record<string, unknown>;
}

interface NavigationWidgetsState {
  widgets: NavigationWidgetConfig[];

  // Actions
  addWidget: (widget: NavigationWidgetConfig) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (
    widgetId: string,
    updates: Partial<NavigationWidgetConfig>
  ) => void;
  updateWidgetSettings: (
    widgetId: string,
    settings: Record<string, unknown>
  ) => void;
  updateWidgetData: (widgetId: string, data: Record<string, unknown>) => void;
  reorderWidgets: (widgets: NavigationWidgetConfig[]) => void;
  hasWidget: (type: NavigationWidgetType) => boolean;
  getWidget: (widgetId: string) => NavigationWidgetConfig | undefined;
  getWidgetByType: (
    type: NavigationWidgetType
  ) => NavigationWidgetConfig | undefined;
}

export const useNavigationWidgetsStore = create<NavigationWidgetsState>()(
  pouchdbSync(
    persist(
      (set, get) => ({
        widgets: [],

        addWidget: (widget: NavigationWidgetConfig) => {
          const { widgets } = get();
          // Check if widget of this type already exists
          const existingWidget = widgets.find((w) => w.type === widget.type);
          if (existingWidget) {
            console.warn(
              `Navigation widget of type ${widget.type} already exists`
            );
            return;
          }

          set((state) => ({
            widgets: [...state.widgets, widget],
          }));
        },

        removeWidget: (widgetId: string) => {
          set((state) => ({
            widgets: state.widgets.filter((w) => w.id !== widgetId),
          }));
        },

        updateWidget: (
          widgetId: string,
          updates: Partial<NavigationWidgetConfig>
        ) => {
          set((state) => ({
            widgets: state.widgets.map((w) =>
              w.id === widgetId ? { ...w, ...updates } : w
            ),
          }));
        },

        updateWidgetSettings: (
          widgetId: string,
          settings: Record<string, unknown>
        ) => {
          set((state) => ({
            widgets: state.widgets.map((w) =>
              w.id === widgetId
                ? { ...w, settings: { ...w.settings, ...settings } }
                : w
            ),
          }));
        },

        updateWidgetData: (widgetId: string, data: Record<string, unknown>) => {
          set((state) => ({
            widgets: state.widgets.map((w) =>
              w.id === widgetId ? { ...w, data: { ...w.data, ...data } } : w
            ),
          }));
        },

        reorderWidgets: (widgets: NavigationWidgetConfig[]) => {
          set({ widgets });
        },

        hasWidget: (type: NavigationWidgetType) => {
          const { widgets } = get();
          return widgets.some((w) => w.type === type);
        },

        getWidget: (widgetId: string) => {
          const { widgets } = get();
          return widgets.find((w) => w.id === widgetId);
        },

        getWidgetByType: (type: NavigationWidgetType) => {
          const { widgets } = get();
          return widgets.find((w) => w.type === type);
        },
      }),
      {
        name: 'navigation-widgets-store',
        version: 1,
      }
    ),
    {
      category: 'navigationWidgets',
      selector: (state) => state.widgets,
      debounceMs: 1000,
    }
  )
);
