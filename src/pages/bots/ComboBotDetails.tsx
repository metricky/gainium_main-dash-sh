import { useIsReadOnly } from '@/lib/demoMode';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  BotPanelLayout,
  type BotPanelInsightsConfig,
} from '@/components/bots/panels/BotPanelLayout';
import BotChartPanel from '@/components/bots/panels/contents/chart/BotChartPanel';
import BotNotesPanel from '@/components/bots/panels/contents/notes/BotNotesPanel';
import { usePanelMenuBridge } from '@/components/bots/panels/hooks/usePanelMenuBridge';
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

const ComboBotDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isReadOnly = useIsReadOnly();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Redirect if in demo mode
  useEffect(() => {
    if (isReadOnly) {
      navigate('/combo', { replace: true });
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
      loadingSubtitle: 'Loading combo backtests',
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
    ? `combo-notes-${safeBotId}`
    : 'combo-notes-detail';
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

  const [chartMenu, handleChartMenuChange] = usePanelMenuBridge();

  const overviewPanel = useMemo<PanelContentConfig>(
    () => ({
      title: 'Bot overview',
      description: 'Combined strategy summary for this bot.',
      content: (
        <Card position={2} className="h-full">
          <CardHeader className="space-y-xs px-0">
            <CardTitle className="text-lg">Combo bot snapshot</CardTitle>
            <CardDescription>
              Strategy metrics will populate here soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-between gap-md px-0">
            <div className="space-y-xs text-sm text-muted-foreground">
              <p>
                This page now uses the shared panel layout. We are wiring
                combo-specific analytics and position breakdowns into this
                section next.
              </p>
              <p>
                Use the insights tabs to review backtests or jot down notes
                while we finish migrating the remaining widgets.
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

  const chartPanel = useMemo<PanelContentConfig>(() => {
    const base: PanelContentConfig = {
      content: (
        <BotChartPanel
          widgetId="combo-detail-bot-chart"
          data={{ botId: safeBotId }}
          variant="panel"
          className="h-full"
          onPanelMenuChange={handleChartMenuChange}
        />
      ),
      contentClassName: 'flex h-full flex-col',
      containerClassName: 'min-h-[320px]',
    };

    if (chartMenu) {
      base.menu = chartMenu;
    }

    return base;
  }, [chartMenu, handleChartMenuChange, safeBotId]);

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
              widgetId="combo-backtests-detail"
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
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-auto">
            <Skeleton className="h-8 w-36" />
          </div>
        </div>
      ),
      containerClassName: 'min-h-[280px]',
    }),
    []
  );

  const loadingChartPanel = useMemo<PanelContentConfig>(
    () => ({
      title: 'Bot performance chart',
      description: 'Fetching metrics…',
      content: (
        <div className="flex h-full flex-col gap-md">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
          <div className="flex gap-xs">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ),
      containerClassName: 'min-h-[320px]',
    }),
    []
  );

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
      <MainLayout pageTitle="Combo Bot Details" activePage="/bot/combo">
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
    <MainLayout pageTitle="Combo Bot Details" activePage="/bot/combo">
      <div className="flex flex-1 flex-col gap-md p-sm md:p-md">
        {isLoading ? (
          <div className="space-y-xs">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : (
          <div className="space-y-xs">
            <h1 className="text-2xl font-semibold">Combo Bot Details</h1>
            <p className="text-sm text-muted-foreground">Bot ID: {safeBotId}</p>
          </div>
        )}
        <BotPanelLayout
          chart={isLoading ? loadingChartPanel : chartPanel}
          form={isLoading ? loadingOverviewPanel : overviewPanel}
          insights={isLoading ? loadingInsightsConfig : insightsConfig}
          className="flex-1"
          botType="combo"
        />
      </div>
    </MainLayout>
  );
};

export default ComboBotDetails;
