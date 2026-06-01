import {
  WIDGET_REGISTRY,
  type WidgetType,
} from '../components/widgets/dashboard';
import { useExchangesStore } from '../stores/exchangesStore';
import { useWidgetSettingsStore } from '../stores/widgetSettingsStore';

/**
 * Look up a display name for an exchange UUID (or 'ALL').
 * Falls back to 'Exchange' if the exchange isn't found in the store so that
 * a raw UUID is never shown to the user.
 */
function resolveExchangeDisplayName(id: string): string {
  if (id === 'ALL') return 'All Exchanges';
  const exchange = useExchangesStore.getState().getExchange(id);
  return exchange?.name ?? 'Exchange';
}

/**
 * Build a compact display string for a list of exchange IDs stored in widget settings.
 */
function buildExchangeDisplay(exchangeList: string[]): string {
  if (exchangeList.includes('ALL') || exchangeList.length === 0) {
    return 'All exchanges';
  }
  const names = exchangeList.map(resolveExchangeDisplayName);
  return names.length === 1 ? names[0] : `${names.length} exchanges`;
}

export interface WidgetInfo {
  id: string;
  type: string;
  title: string;
}

/**
 * Get the dynamic display name for a widget.
 * This function handles custom names, dynamic names based on settings, and fallbacks.
 */
export const getWidgetDisplayName = (widget: WidgetInfo): string => {
  const { getWidgetSetting } = useWidgetSettingsStore.getState();

  // First check if there's a custom name set
  const customName = getWidgetSetting(widget.id, 'customName', '') as string;
  if (customName && customName.trim()) {
    return customName;
  }

  const baseMetadata = WIDGET_REGISTRY[widget.type as WidgetType]?.metadata;
  if (!baseMetadata) return widget.title;

  if (widget.type === 'portfolio-value') {
    try {
      const savedExchanges = getWidgetSetting(widget.id, 'selectedExchanges', [
        'ALL',
      ]);
      const savedCoins = getWidgetSetting(widget.id, 'selectedCoins', ['ALL']);

      if (savedExchanges && savedCoins) {
        const exchangeList = Array.isArray(savedExchanges)
          ? savedExchanges
          : [savedExchanges];
        const coins = Array.isArray(savedCoins) ? savedCoins : [savedCoins];

        const exchangeDisplay = buildExchangeDisplay(exchangeList);

        let filters = '';
        if (coins.includes('ALL')) {
          const specificCoins = coins.filter((coin) => coin !== 'ALL');
          filters =
            specificCoins.length > 0
              ? `All coins, ${specificCoins.join(', ')}`
              : 'All coins';
        } else {
          filters = coins.length === 1 ? coins[0] : coins.join(', ');
        }

        return `Portfolio Value | ${exchangeDisplay} | ${filters}`;
      }
    } catch (error) {
      console.error('Error getting portfolio widget dynamic name:', error);
    }
  }

  if (widget.type === 'bot-status') {
    try {
      const savedBotType = getWidgetSetting(
        widget.id,
        'selectedBotType',
        'all'
      );
      const selectedBotTypes = getWidgetSetting(widget.id, 'selectedBotTypes', [
        'ALL',
      ]);

      const botTypes = [
        { id: 'all', name: 'All Bots' },
        { id: 'dca', name: 'DCA Bots' },
        { id: 'grid', name: 'Grid Bots' },
        { id: 'combo', name: 'Combo Bots' },
        { id: 'terminal', name: 'Terminal Deals' },
        { id: 'hedge', name: 'Hedge Bots' },
      ];

      const selectedBotType = botTypes.find((b) => b.id === savedBotType);
      if (selectedBotType && selectedBotTypes) {
        const botTypesList = Array.isArray(selectedBotTypes)
          ? selectedBotTypes
          : [selectedBotTypes];

        let primaryDisplay = '';
        if (botTypesList.includes('ALL')) {
          primaryDisplay = selectedBotType.name;
        } else {
          const selectedNames = botTypesList
            .map((id) => botTypes.find((bot) => bot.id === id)?.name)
            .filter((name): name is string => Boolean(name));
          primaryDisplay =
            selectedNames.length === 1
              ? selectedNames[0]
              : `${selectedNames.length} types`;
        }

        return `Status | ${primaryDisplay}`;
      }
    } catch (error) {
      console.error('Error getting bot stats widget dynamic name:', error);
    }
  }

  if (widget.type === 'portfolio-allocation') {
    try {
      const savedExchanges = getWidgetSetting(widget.id, 'selectedExchanges', [
        'ALL',
      ]);
      if (savedExchanges) {
        const exchangeList = Array.isArray(savedExchanges)
          ? savedExchanges
          : [savedExchanges];
        return `Portfolio Allocation | ${buildExchangeDisplay(exchangeList)}`;
      }
    } catch (error) {
      console.error(
        'Error getting portfolio allocation widget dynamic name:',
        error
      );
    }
  }

  if (widget.type === 'portfolio-balances') {
    try {
      const savedExchanges = getWidgetSetting(widget.id, 'selectedExchanges', [
        'ALL',
      ]);
      if (savedExchanges) {
        const exchangeList = Array.isArray(savedExchanges)
          ? savedExchanges
          : [savedExchanges];
        return `Portfolio Balances | ${buildExchangeDisplay(exchangeList)}`;
      }
    } catch (error) {
      console.error(
        'Error getting portfolio balances widget dynamic name:',
        error
      );
    }
  }

  if (widget.type === 'accumulated-profit') {
    try {
      const savedTimeFilter = getWidgetSetting(widget.id, 'timeFilter', '30D');
      if (savedTimeFilter) {
        return `Accumulated Profit | ${savedTimeFilter}`;
      }
    } catch (error) {
      console.error(
        'Error getting accumulated profit widget dynamic name:',
        error
      );
    }
  }

  if (widget.type === 'profit') {
    try {
      const savedTimeFilter = getWidgetSetting(
        widget.id,
        'timeFilter',
        'Daily'
      );
      if (savedTimeFilter) {
        return `Profit over time | ${savedTimeFilter}`;
      }
    } catch (error) {
      console.error('Error getting profit widget dynamic name:', error);
    }
  }

  return widget.title;
};

/**
 * React hook version of getWidgetDisplayName that can be used in components.
 * This ensures proper reactivity when widget settings change.
 */
export const useWidgetDisplayName = (widget: WidgetInfo): string => {
  const { getWidgetSetting } = useWidgetSettingsStore();

  // First check if there's a custom name set
  const customName = getWidgetSetting(widget.id, 'customName', '') as string;
  if (customName && customName.trim()) {
    return customName;
  }

  const baseMetadata = WIDGET_REGISTRY[widget.type as WidgetType]?.metadata;
  if (!baseMetadata) return widget.title;

  if (widget.type === 'portfolio-value') {
    try {
      const savedExchanges = getWidgetSetting(widget.id, 'selectedExchanges', [
        'ALL',
      ]);
      const savedCoins = getWidgetSetting(widget.id, 'selectedCoins', ['ALL']);

      if (savedExchanges && savedCoins) {
        const exchangeList = Array.isArray(savedExchanges)
          ? savedExchanges
          : [savedExchanges];
        const coins = Array.isArray(savedCoins) ? savedCoins : [savedCoins];

        const exchangeDisplay = buildExchangeDisplay(exchangeList);

        let filters = '';
        if (coins.includes('ALL')) {
          const specificCoins = coins.filter((coin) => coin !== 'ALL');
          filters =
            specificCoins.length > 0
              ? `All coins, ${specificCoins.join(', ')}`
              : 'All coins';
        } else {
          filters = coins.length === 1 ? coins[0] : coins.join(', ');
        }

        return `Portfolio Value | ${exchangeDisplay} | ${filters}`;
      }
    } catch (error) {
      console.error('Error getting portfolio widget dynamic name:', error);
    }
  }

  if (widget.type === 'bot-status') {
    try {
      const savedBotType = getWidgetSetting(
        widget.id,
        'selectedBotType',
        'all'
      );
      const selectedBotTypes = getWidgetSetting(widget.id, 'selectedBotTypes', [
        'ALL',
      ]);

      const botTypes = [
        { id: 'all', name: 'All Bots' },
        { id: 'dca', name: 'DCA Bots' },
        { id: 'grid', name: 'Grid Bots' },
        { id: 'combo', name: 'Combo Bots' },
        { id: 'terminal', name: 'Terminal Deals' },
        { id: 'hedge', name: 'Hedge Bots' },
      ];

      const selectedBotType = botTypes.find((b) => b.id === savedBotType);
      if (selectedBotType && selectedBotTypes) {
        const botTypesList = Array.isArray(selectedBotTypes)
          ? selectedBotTypes
          : [selectedBotTypes];

        let primaryDisplay = '';
        if (botTypesList.includes('ALL')) {
          primaryDisplay = selectedBotType.name;
        } else {
          const selectedNames = botTypesList
            .map((id) => botTypes.find((bot) => bot.id === id)?.name)
            .filter((name): name is string => Boolean(name));
          primaryDisplay =
            selectedNames.length === 1
              ? selectedNames[0]
              : `${selectedNames.length} types`;
        }

        return `Status | ${primaryDisplay}`;
      }
    } catch (error) {
      console.error('Error getting bot stats widget dynamic name:', error);
    }
  }

  if (widget.type === 'portfolio-allocation') {
    try {
      const savedExchanges = getWidgetSetting(widget.id, 'selectedExchanges', [
        'ALL',
      ]);
      if (savedExchanges) {
        const exchangeList = Array.isArray(savedExchanges)
          ? savedExchanges
          : [savedExchanges];
        return `Portfolio Allocation | ${buildExchangeDisplay(exchangeList)}`;
      }
    } catch (error) {
      console.error(
        'Error getting portfolio allocation widget dynamic name:',
        error
      );
    }
  }

  if (widget.type === 'portfolio-balances') {
    try {
      const savedExchanges = getWidgetSetting(widget.id, 'selectedExchanges', [
        'ALL',
      ]);
      if (savedExchanges) {
        const exchangeList = Array.isArray(savedExchanges)
          ? savedExchanges
          : [savedExchanges];
        return `Portfolio Balances | ${buildExchangeDisplay(exchangeList)}`;
      }
    } catch (error) {
      console.error(
        'Error getting portfolio balances widget dynamic name:',
        error
      );
    }
  }

  if (widget.type === 'accumulated-profit') {
    try {
      const savedTimeFilter = getWidgetSetting(widget.id, 'timeFilter', '30D');
      if (savedTimeFilter) {
        return `Accumulated Profit | ${savedTimeFilter}`;
      }
    } catch (error) {
      console.error(
        'Error getting accumulated profit widget dynamic name:',
        error
      );
    }
  }

  if (widget.type === 'profit') {
    try {
      const savedTimeFilter = getWidgetSetting(
        widget.id,
        'timeFilter',
        'Daily'
      );
      if (savedTimeFilter) {
        return `Profit over time | ${savedTimeFilter}`;
      }
    } catch (error) {
      console.error('Error getting profit widget dynamic name:', error);
    }
  }

  return widget.title;
};
