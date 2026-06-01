import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useWidgetSettings } from '@/hooks/useWidgetSettings';

import type { TradingViewDropdownItem } from '../../shared/TradingViewChart/types';
import type { BotChartWidgetSettings } from '../BotChart';

export interface BotChartDisplayOptionsResult {
  showOrders: boolean;
  showTransactions: boolean;
  showPastOrders: boolean;
  showSignals: boolean;
  toolbarDropdownItems: TradingViewDropdownItem[];
}

export const useBotChartDisplayOptions = (
  widgetId: string
): BotChartDisplayOptionsResult => {
  const { usePersistedState } =
    useWidgetSettings<BotChartWidgetSettings>(widgetId);

  const [showOrders, setShowOrders] = usePersistedState('showOrders', true);
  const [showTransactions, setShowTransactions] = usePersistedState(
    'showTransactions',
    true
  );
  const [showPastOrders, setShowPastOrders] = usePersistedState(
    'showPastOrders',
    true
  );
  const [showSignals, setShowSignals] = usePersistedState('showSignals', true);

  const showOrdersRef = useRef(showOrders);
  const showTransactionsRef = useRef(showTransactions);
  const showPastOrdersRef = useRef(showPastOrders);
  const showSignalsRef = useRef(showSignals);

  useEffect(() => {
    showOrdersRef.current = showOrders;
  }, [showOrders]);

  useEffect(() => {
    showTransactionsRef.current = showTransactions;
  }, [showTransactions]);

  useEffect(() => {
    showPastOrdersRef.current = showPastOrders;
  }, [showPastOrders]);

  useEffect(() => {
    showSignalsRef.current = showSignals;
  }, [showSignals]);

  const toggleShowOrders = useCallback(() => {
    setShowOrders(!showOrdersRef.current);
  }, [setShowOrders]);

  const toggleShowTransactions = useCallback(() => {
    setShowTransactions(!showTransactionsRef.current);
  }, [setShowTransactions]);

  const toggleShowPastOrders = useCallback(() => {
    setShowPastOrders(!showPastOrdersRef.current);
  }, [setShowPastOrders]);

  const toggleShowSignals = useCallback(() => {
    setShowSignals(!showSignalsRef.current);
  }, [setShowSignals]);

  const toolbarDropdownItems = useMemo<TradingViewDropdownItem[]>(
    () => [
      {
        title: 'Toggle order lines',
        onSelect: toggleShowOrders,
      },
      {
        title: 'Toggle buy/sell icons',
        onSelect: toggleShowTransactions,
      },
      {
        title: 'Toggle past orders',
        onSelect: toggleShowPastOrders,
      },
      {
        title: 'Toggle entry/exit signals',
        onSelect: toggleShowSignals,
      },
    ],
    [
      toggleShowOrders,
      toggleShowPastOrders,
      toggleShowSignals,
      toggleShowTransactions,
    ]
  );

  return {
    showOrders,
    showTransactions,
    showPastOrders,
    showSignals,
    toolbarDropdownItems,
  };
};
