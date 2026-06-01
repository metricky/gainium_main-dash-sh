/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBalanceStore } from '@/stores/live/balanceStore';
import type { BotFormData } from '@/types/bots/form';

interface UseBalanceRefreshControlParams {
  formData: BotFormData;
  onUpdateBalances?: () => unknown;
}

interface UseBalanceRefreshControlResult {
  hasExchangeSelection: boolean;
  canTriggerBalanceRefresh: boolean;
  showBalanceSpinner: boolean;
  handleRefreshBalances: () => Promise<unknown> | void;
}

export const useBalanceRefreshControl = (
  params: UseBalanceRefreshControlParams
): UseBalanceRefreshControlResult => {
  const { formData, onUpdateBalances } = params;

  const hasExchangeSelection = useMemo(() => {
    if (typeof formData.exchangeUUID !== 'string') {
      return false;
    }
    return formData.exchangeUUID.trim().length > 0;
  }, [formData.exchangeUUID]);

  const canTriggerBalanceRefresh =
    hasExchangeSelection && typeof onUpdateBalances === 'function';

  const [showBalanceSpinner, setShowBalanceSpinner] = useState(false);
  const balanceLoading = useBalanceStore((state) => state.loading);
  const balanceRefreshTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (balanceRefreshTimerRef.current) {
        window.clearTimeout(balanceRefreshTimerRef.current);
        balanceRefreshTimerRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    let hideTimer: number | undefined;
    if (balanceLoading) {
      setShowBalanceSpinner(true);
      if (balanceRefreshTimerRef.current) {
        window.clearTimeout(balanceRefreshTimerRef.current);
        balanceRefreshTimerRef.current = null;
      }
    } else if (showBalanceSpinner && balanceRefreshTimerRef.current === null) {
      hideTimer = window.setTimeout(() => {
        setShowBalanceSpinner(false);
      }, 500);
    }

    return () => {
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
    };
  }, [balanceLoading, showBalanceSpinner]);

  const handleRefreshBalances = useCallback((): Promise<unknown> | void => {
    if (!canTriggerBalanceRefresh || typeof onUpdateBalances !== 'function') {
      return;
    }

    setShowBalanceSpinner(true);
    if (balanceRefreshTimerRef.current) {
      window.clearTimeout(balanceRefreshTimerRef.current);
    }
    balanceRefreshTimerRef.current = window.setTimeout(() => {
      if (!useBalanceStore.getState().loading) {
        setShowBalanceSpinner(false);
      }
      balanceRefreshTimerRef.current = null;
    }, 1200);

    try {
      const maybeResult = onUpdateBalances();
      if (
        maybeResult &&
        typeof (maybeResult as { finally?: unknown }).finally === 'function'
      ) {
        const p = maybeResult as Promise<unknown>;
        p.finally(() => {
          if (!useBalanceStore.getState().loading) {
            setShowBalanceSpinner(false);
          }
        });
        return p;
      }
      return Promise.resolve(undefined);
    } catch (error) {
      console.error('[useBalanceRefreshControl] Balance refresh failed', error);
      if (!useBalanceStore.getState().loading) {
        setShowBalanceSpinner(false);
      }
    }
  }, [canTriggerBalanceRefresh, onUpdateBalances]);

  return {
    hasExchangeSelection,
    canTriggerBalanceRefresh,
    showBalanceSpinner,
    handleRefreshBalances,
  };
};
