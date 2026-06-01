import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { BacktestsSummaryResult } from '@/hooks/useBacktestsSummary';
import { useMemo, type ReactNode } from 'react';

/**
 * Hook to generate badges for bot page insights tabs
 */
export const useBotInsightsBadges = (
  backtestsSummary: BacktestsSummaryResult
) => {
  const backtestsBadge = useMemo<ReactNode>(() => {
    switch (backtestsSummary.status) {
      case 'loading':
        return <Badge variant="secondary">{backtestsSummary.badgeLabel}</Badge>;
      case 'error':
        return (
          <Badge variant="destructive">{backtestsSummary.badgeLabel}</Badge>
        );
      case 'empty':
        return <Badge variant="outline">{backtestsSummary.badgeLabel}</Badge>;
      case 'ready':
      default:
        return <Badge variant="secondary">{backtestsSummary.badgeLabel}</Badge>;
    }
  }, [backtestsSummary.badgeLabel, backtestsSummary.status]);

  const loadingBacktestsBadge = useMemo<ReactNode>(
    () => <Skeleton className="h-5 w-16 rounded-full" />,
    []
  );

  return {
    backtestsBadge,
    loadingBacktestsBadge,
  };
};
