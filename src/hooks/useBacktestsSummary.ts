import { useMemo } from 'react';

import type { BacktestData } from './useBacktests';

type BacktestsSummaryStatus = 'loading' | 'error' | 'empty' | 'ready';

interface SummaryMessages {
  loadingSubtitle?: string;
  errorSubtitle?: string;
  emptySubtitle?: string;
}

interface ReadySubtitleFormatterInput {
  total: number;
  profitable: number;
  profitablePercent: number;
}

export interface UseBacktestsSummaryOptions {
  backtests?: BacktestData[];
  isLoading: boolean;
  error: unknown;
  messages?: SummaryMessages;
  readySubtitleFormatter?: (
    input: ReadySubtitleFormatterInput
  ) => string | null;
}

export interface BacktestsSummaryResult {
  status: BacktestsSummaryStatus;
  total: number;
  profitable: number;
  profitablePercent: number;
  subtitle: string | null;
  badgeLabel: string;
}

const DEFAULT_MESSAGES: Required<SummaryMessages> = {
  loadingSubtitle: 'Loading backtests',
  errorSubtitle: 'Failed to load backtests',
  emptySubtitle: '',
};

const defaultReadySubtitle = ({
  profitablePercent,
}: ReadySubtitleFormatterInput) => `${profitablePercent}% profitable`;

const defaultReadyBadgeLabel = ({
  total,
  profitable,
}: ReadySubtitleFormatterInput) => `${profitable}/${total}`;

export function useBacktestsSummary({
  backtests,
  isLoading,
  error,
  messages,
  readySubtitleFormatter,
}: UseBacktestsSummaryOptions): BacktestsSummaryResult {
  const mergedMessages = useMemo(
    () => ({ ...DEFAULT_MESSAGES, ...messages }),
    [messages]
  );

  const resolvedReadySubtitle = useMemo(
    () => readySubtitleFormatter ?? defaultReadySubtitle,
    [readySubtitleFormatter]
  );

  return useMemo(() => {
    if (isLoading) {
      return {
        status: 'loading' as const,
        total: 0,
        profitable: 0,
        profitablePercent: 0,
        subtitle: mergedMessages.loadingSubtitle,
        badgeLabel: '...',
      };
    }

    if (error) {
      return {
        status: 'error' as const,
        total: 0,
        profitable: 0,
        profitablePercent: 0,
        subtitle: mergedMessages.errorSubtitle,
        badgeLabel: 'Error',
      };
    }

    const total = backtests?.length ?? 0;

    if (total === 0) {
      return {
        status: 'empty' as const,
        total: 0,
        profitable: 0,
        profitablePercent: 0,
        subtitle: mergedMessages.emptySubtitle,
        badgeLabel: '0',
      };
    }

    const profitable =
      backtests?.filter((entry) => (entry.financial?.netProfitTotal ?? 0) > 0)
        .length ?? 0;
    const profitablePercent = Math.round((profitable / total) * 100);

    const formatterInput: ReadySubtitleFormatterInput = {
      total,
      profitable,
      profitablePercent,
    };

    return {
      status: 'ready' as const,
      total,
      profitable,
      profitablePercent,
      subtitle: resolvedReadySubtitle(formatterInput),
      badgeLabel: defaultReadyBadgeLabel(formatterInput),
    };
  }, [backtests, error, isLoading, mergedMessages, resolvedReadySubtitle]);
}
