import { useIsReadOnly } from '@/lib/demoMode';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  BotPanelLayout,
  type BotPanelInsightsConfig,
} from '@/components/bots/panels/BotPanelLayout';
import BotNotesPanel from '@/components/bots/panels/contents/notes/BotNotesPanel';
import { type PanelContentConfig } from '@/components/bots/panels/PanelContainer';
import MainLayout from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Backtests from '@/components/widgets/bots/Backtests';
import { useBacktests } from '@/hooks/useBacktests';
import { useBacktestsSummary } from '@/hooks/useBacktestsSummary';
import { useNotesStore } from '@/stores/notesStore';

const INITIAL_LOADING_DELAY_MS = 900;

const GridBotDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isReadOnly = useIsReadOnly();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Redirect if in demo mode
  useEffect(() => {
    if (isReadOnly) {
      navigate('/grid', { replace: true });
    }
  }, [isReadOnly, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsBootstrapping(false);
    }, INITIAL_LOADING_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const hasBotId = Boolean(id);
  const safeBotId = id ?? '';

  const {
    backtests,
    isLoading: backtestsLoading,
    error: backtestsError,
  } = useBacktests({
    filters: {
      page: 0,
      pageSize: 25,
    },
    enabled: hasBotId,
  });

  const backtestsSummary = useBacktestsSummary({
    backtests,
    isLoading: backtestsLoading,
    error: backtestsError,
    messages: {
      loadingSubtitle: 'Loading grid backtests',
    },
  });

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

  const notesWidgetId = hasBotId
    ? `grid-notes-${safeBotId}`
    : 'grid-notes-detail';
  const notesEntry = useNotesStore((state) => state.notes[notesWidgetId]);

  const notesBadge = useMemo<ReactNode>(() => {
    if (!notesEntry) {
      return <Badge variant="secondary">New</Badge>;
    }

    const hasContent = Boolean(notesEntry.content?.trim());
    return hasContent ? (
      <Badge variant="outline">Saved</Badge>
    ) : (
      <Badge variant="outline">Empty</Badge>
    );
  }, [notesEntry]);

  const overviewPanel = useMemo<PanelContentConfig>(
    () => ({
      title: 'Bot overview',
      description: 'Summary metrics and metadata for this grid bot.',
      content: (
        <Card position={2} className="h-full">
          <CardHeader className="space-y-xs px-0">
            <CardTitle className="text-lg">Grid bot snapshot</CardTitle>
            <CardDescription>Detailed metrics are coming soon.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-between gap-md px-0">
            <div className="space-y-xs text-sm text-muted-foreground">
              <p>
                We are migrating this detail view to the new panel system.
                Configuration insights and performance metrics will appear here
                once APIs are wired.
              </p>
              <p>
                In the meantime, switch to the edit page to inspect live
                settings or run backtests from the panel on the right.
              </p>
              <p className="pt-2 text-xs">
                <strong>Note:</strong> Grid bots don't have performance chart
                data from the backend (unlike DCA bots which track equity over
                time). Grid bot profit is tracked as cumulative totals from
                continuous spread captures.
              </p>
            </div>
            <div className="rounded-md bg-muted px-sm py-xs text-xs text-muted-foreground">
              <span className="font-medium">Bot ID</span>:{' '}
              <span className="font-mono">{safeBotId}</span>
            </div>
          </CardContent>
        </Card>
      ),
      contentClassName: 'flex h-full flex-col',
      containerClassName: 'min-h-[280px]',
    }),
    [safeBotId]
  );

  // Grid bots don't have performance chart data - removed chartPanel

  const insightsConfig = useMemo<BotPanelInsightsConfig>(
    () => ({
      defaultTab: backtestsSummary.total > 0 ? 'backtests' : 'notes',
      actions: backtestsSummary.subtitle ? (
        <span>{backtestsSummary.subtitle}</span>
      ) : undefined,
      tabs: [
        {
          key: 'backtests',
          title: 'Backtests',
          badge: backtestsBadge,
          content: (
            <Backtests
              widgetId="grid-backtests-detail"
              variant="panel"
              data={{ botId: safeBotId }}
            />
          ),
        },
        {
          key: 'notes',
          title: 'Notes',
          badge: notesBadge,
          content: <BotNotesPanel widgetId={notesWidgetId} />,
        },
      ],
    }),
    [
      backtestsBadge,
      backtestsSummary.subtitle,
      backtestsSummary.total,
      notesBadge,
      notesWidgetId,
      safeBotId,
    ]
  );

  const loadingOverviewPanel = useMemo<PanelContentConfig>(
    () => ({
      title: 'Bot overview',
      description: 'Preparing summary…',
      content: (
        <div className="flex h-full flex-col gap-md">
          <div className="space-y-sm">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-auto">
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      ),
      containerClassName: 'min-h-[280px]',
    }),
    []
  );

  // Grid bots don't have performance chart data - removed loadingChartPanel

  const loadingInsightsConfig: BotPanelInsightsConfig = useMemo(
    () => ({
      defaultTab: 'backtests',
      tabs: [
        {
          key: 'backtests',
          title: 'Backtests',
          badge: <Skeleton className="h-5 w-16 rounded-full" />,
          content: (
            <div className="flex h-full flex-col gap-sm">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ),
        },
        {
          key: 'notes',
          title: 'Notes',
          badge: <Skeleton className="h-5 w-12 rounded-full" />,
          content: (
            <div className="flex h-full flex-col gap-sm">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
          ),
        },
      ],
    }),
    []
  );

  if (!hasBotId) {
    return (
      <MainLayout pageTitle="Grid Bot Details" activePage="/bot/grid">
        <div className="p-lg">
          <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-md py-md text-amber-900">
            No bot ID provided.
          </div>
        </div>
      </MainLayout>
    );
  }

  const isLoading = isBootstrapping;

  return (
    <MainLayout pageTitle="Grid Bot Details" activePage="/bot/grid">
      <div className="flex flex-1 flex-col gap-md p-sm md:p-md">
        {isLoading ? (
          <div className="space-y-xs">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : (
          <div className="space-y-xs">
            <h1 className="text-2xl font-semibold">Grid Bot Details</h1>
            <p className="text-sm text-muted-foreground">Bot ID: {safeBotId}</p>
          </div>
        )}
        <BotPanelLayout
          form={isLoading ? loadingOverviewPanel : overviewPanel}
          insights={isLoading ? loadingInsightsConfig : insightsConfig}
          className="flex-1"
          botType="grid"
        />
      </div>
    </MainLayout>
  );
};

export default GridBotDetails;
