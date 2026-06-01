import { useCallback, useMemo } from 'react';
import {
  useWidgetSettingsStore,
  createNamespacedWidgetId,
} from '../stores/widgetSettingsStore';

/**
 * Generic hook for managing widget-specific settings
 * Works with any widget type and any setting structure
 *
 * @param widgetId The widget ID (can be namespaced with storeKey:widgetId)
 * @param storeKey Optional store key to namespace the widgetId (e.g., 'trading-bot-store')
 */
export function useWidgetSettings<T = Record<string, unknown>>(
  widgetId: string,
  storeKey?: string
) {
  const { setWidgetSetting, getWidgetSetting, resetWidgetSettings } =
    useWidgetSettingsStore();

  // Create the namespaced widget ID if storeKey is provided
  const namespacedWidgetId = useMemo(() => {
    return storeKey ? createNamespacedWidgetId(storeKey, widgetId) : widgetId;
  }, [storeKey, widgetId]);

  /**
   * Get a specific setting value for this widget
   */
  const getSetting = useCallback(
    <K extends keyof T>(key: K, defaultValue?: T[K]): T[K] => {
      return getWidgetSetting(
        namespacedWidgetId,
        key as string,
        defaultValue
      ) as T[K];
    },
    [namespacedWidgetId, getWidgetSetting]
  );

  /**
   * Set a specific setting value for this widget
   */
  const setSetting = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setWidgetSetting(namespacedWidgetId, key as string, value);
    },
    [namespacedWidgetId, setWidgetSetting]
  );

  /**
   * Get multiple settings at once
   */
  const getSettings = useCallback(
    (keys: (keyof T)[], defaults: Partial<T> = {}): Partial<T> => {
      const settings: Partial<T> = {};
      keys.forEach((key) => {
        settings[key] = getSetting(key, defaults[key]);
      });
      return settings;
    },
    [getSetting]
  );

  /**
   * Set multiple settings at once
   */
  const setSettings = useCallback(
    (settings: Partial<T>) => {
      Object.entries(settings).forEach(([key, value]) => {
        setSetting(key as keyof T, value as T[keyof T]);
      });
    },
    [setSetting]
  );

  /**
   * Reset all settings for this widget
   */
  const resetSettings = useCallback(() => {
    resetWidgetSettings(namespacedWidgetId);
  }, [namespacedWidgetId, resetWidgetSettings]);

  /**
   * Create a stateful setting that automatically persists changes
   * Returns [value, setValue] similar to useState
   */
  const usePersistedState = useCallback(
    <K extends keyof T>(
      key: K,
      defaultValue: T[K]
    ): [T[K], (value: T[K]) => void] => {
      const value = getSetting(key, defaultValue);
      const setValue = (newValue: T[K]) => setSetting(key, newValue);
      return [value, setValue];
    },
    [getSetting, setSetting]
  );

  return {
    getSetting,
    setSetting,
    getSettings,
    setSettings,
    resetSettings,
    usePersistedState,
  };
}

// Type definitions for common widget settings
export interface PortfolioWidgetSettings {
  selectedExchanges: string[];
  selectedCoins: string[];
  timeFilter: string;
  selectedCurrency: string;
  customName?: string; // Add support for custom widget names
  startYAxisAtZero?: boolean; // Add support for Y axis starting at 0
}

export interface ProfitWidgetSettings {
  selectedExchanges: string[];
  timeFilter: string;
  selectedCurrency: string;
  customName?: string;
}

export interface AccumulatedProfitWidgetSettings {
  selectedExchanges: string[];
  timeFilter: string;
  selectedCurrency: string;
  customName?: string;
}

export interface PortfolioAllocationWidgetSettings {
  selectedExchanges: string[];
  viewType: 'pie' | 'bar';
  customName?: string;
}

export interface PortfolioBalancesWidgetSettings {
  selectedExchanges: string[];
  sortBy: 'value' | 'percentage' | 'name';
  sortOrder: 'asc' | 'desc';
  customName?: string;
}

export interface ChartWidgetSettings {
  chartType: 'line' | 'bar' | 'area';
  timeframe: string;
  indicators: string[];
}

export interface TableWidgetSettings {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  visibleColumns: string[];
  pageSize: number;
}

export interface BotStatsWidgetSettings {
  selectedBotType: 'all' | 'dca' | 'grid' | 'combo' | 'terminal' | 'hedge';
  selectedBotTypes: string[];
}

// Example usage:
// const { getSetting, setSetting, usePersistedState } = useWidgetSettings<PortfolioWidgetSettings>(widgetId);
// const [selectedExchange, setSelectedExchange] = usePersistedState('selectedExchange', 'ALL');
//
// For trading bot widgets:
// const { usePersistedState } = useWidgetSettings<TradingBotWidgetSettings>(widgetId);
// const [botId, setBotId] = usePersistedState('botId', null);
// const [isRunning, setIsRunning] = usePersistedState('isRunning', false);
//
// For table widgets:
// const { usePersistedState } = useWidgetSettings<TableWidgetSettings>(widgetId);
// const [sortBy, setSortBy] = usePersistedState('sortBy', 'name');
// const [sortOrder, setSortOrder] = usePersistedState('sortOrder', 'asc');
