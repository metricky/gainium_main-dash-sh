import type { DrawerBot } from '@/types/bots/drawer';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getEventSeverity,
  useBotEvents,
  type BotEvent,
} from '../../../../hooks/useBotEvents';
/* import { useComboBots } from '../../../../hooks/useComboBots';
import { useDcaBots } from '../../../../hooks/useDcaBots';
import { useGridBots } from '../../../../hooks/useGridBots';
import { useHedgeComboBots } from '../../../../hooks/useHedgeComboBots';
import { useHedgeDcaBots } from '../../../../hooks/useHedgeDcaBots'; */
import { cn } from '../../../../lib/utils';
import { copyToClipboard } from '../../../../lib/webhookUtils';
import { toast } from '../../../../lib/toast';
import CoinPair from '../../shared/CoinPair';
import { BotTypesEnum, type GridFilterModel } from '../../../../types';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../ui/dialog';
import { Input } from '../../../ui/input';
import { ScrollArea } from '../../../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Timeline, type TimelineItem } from '../../../ui/timeline';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  Info,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';

const formatEventMetadata = (metadata: BotEvent['metadata']): string => {
  if (!metadata) {
    return '{}';
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.stringify(JSON.parse(metadata), null, 2);
    } catch (_error) {
      return metadata;
    }
  }

  return JSON.stringify(metadata, null, 2);
};

const formatDayWithSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) {
    return `${day}th`;
  }

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

const normalizeMetadataString = (metadata: BotEvent['metadata']): string => {
  if (!metadata) {
    return '';
  }

  const candidate = metadata as unknown;

  if (typeof candidate === 'string') {
    const lower = candidate.toLowerCase();

    try {
      const parsedLower = JSON.stringify(JSON.parse(candidate)).toLowerCase();
      return `${lower} ${parsedLower}`;
    } catch (_error) {
      return lower;
    }
  }

  try {
    return JSON.stringify(candidate).toLowerCase();
  } catch (_error) {
    return '';
  }
};

const SELL_KEYWORDS = [
  'sell',
  'close',
  'closing',
  'exit',
  'take-profit',
  'take profit',
  'tp',
];
const BUY_KEYWORDS = ['buy', 'entry', 'long'];
const TRADE_CONTEXT_KEYWORDS = [
  'deal',
  'order',
  'entry',
  'exit',
  'position',
  'buy',
  'sell',
  'take profit',
  'take-profit',
  'tp',
  'safety order',
  'filled',
  'executed',
  'closed',
  'opened',
];
const NON_TRADE_CONTEXT_KEYWORDS = [
  'status',
  'restart',
  'restarted',
  'bot restarted',
  'setting',
  'configuration',
  'webhook',
  'alert',
  'warning',
  'error',
  'open -> closed',
  'closed -> open',
];

type TradeDirection = 'buy' | 'sell';

const detectTradeDirection = (event: BotEvent): TradeDirection | null => {
  const sources: string[] = [];
  const eventText = (event.event ?? '').toLowerCase();
  if (eventText) {
    sources.push(eventText);
  }

  const descriptionText = (event.description ?? '').toLowerCase();
  if (descriptionText) {
    sources.push(descriptionText);
  }

  const metadataText = normalizeMetadataString(event.metadata);
  if (metadataText) {
    sources.push(metadataText);
  }

  const includesKeyword = (keywords: string[]) =>
    sources.some((text) => keywords.some((keyword) => text.includes(keyword)));

  const hasTradeContext = includesKeyword(TRADE_CONTEXT_KEYWORDS);
  const hasNonTradeContext = includesKeyword(NON_TRADE_CONTEXT_KEYWORDS);

  const hasExplicitSell = sources.some((text) => /\b(sell|short)\b/.test(text));
  const hasExplicitBuy = sources.some((text) => /\b(buy|long)\b/.test(text));

  if (!hasTradeContext && !hasExplicitSell && !hasExplicitBuy) {
    return null;
  }

  if (hasNonTradeContext && !hasExplicitSell && !hasExplicitBuy) {
    return null;
  }

  if (hasExplicitSell || includesKeyword(SELL_KEYWORDS)) {
    return 'sell';
  }

  if (hasExplicitBuy || includesKeyword(BUY_KEYWORDS)) {
    return 'buy';
  }

  return null;
};

// Order ids only live inside the event description, e.g.
// "Order filled: x-ABC-TP-..." or "...Order id: x-ABC-TP-..., side: sell".
const extractOrderId = (event: BotEvent): string | null => {
  const desc = event.description ?? '';
  const match =
    desc.match(/order\s*id:\s*([^\s,]+)/i) ||
    desc.match(/order\s+filled:\s*([^\s,]+)/i);
  return match ? match[1].trim() : null;
};

// Truncated, click-to-copy id chip with a trailing copy icon (full id copied).
const CopyableId: React.FC<{ id: string; label?: string }> = ({
  id,
  label = 'ID',
}) => {
  const short = id.length > 12 ? `${id.slice(0, 10)}…` : id;
  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const ok = await copyToClipboard(id);
      if (ok) {
        toast.success(`${label} copied`);
      } else {
        toast.error(`Failed to copy ${label}`);
      }
    },
    [id, label]
  );
  return (
    <Badge
      variant="outline"
      onClick={handleCopy}
      title={`Copy ${label.toLowerCase()}: ${id}`}
      className="flex h-4 cursor-pointer items-center gap-1 px-1 py-0 font-mono text-xs hover:bg-muted"
    >
      {short}
      <Copy className="h-2.5 w-2.5 opacity-60" />
    </Badge>
  );
};

// Event message: clamped to 2 lines, click to expand/collapse the full text.
const ExpandableMessage: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) {
    return null;
  }
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setExpanded((v) => !v);
      }}
      title={expanded ? 'Click to collapse' : 'Click to read full message'}
      className={cn(
        'cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground/80',
        expanded ? 'whitespace-pre-wrap break-words' : 'line-clamp-2'
      )}
    >
      {text}
    </div>
  );
};

export interface DrawerBotEventsProps {
  widgetId: string;
  botId?: string;
  bot?: DrawerBot;
}

// Event interface removed - not needed without real events

export const DrawerBotEvents: React.FC<DrawerBotEventsProps> = ({
  botId,
  bot: botProp,
}) => {
  const { id: paramBotId } = useParams<{ id: string }>();
  const actualBotId = botId || paramBotId;

  const [selectedTab, setSelectedTab] = useState<'recent' | 'deals' | 'alerts'>(
    'recent'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  // const [selectedEvent, setSelectedEvent] = useState<BotEvent | null>(null);

  // Determine bot type from prop
  const botType = botProp?.type || 'dca';

  // Get bot data
  /* const { bots: dcaBots, isLoading: dcaLoading } = useDcaBots({
    terminal: false,
    paperContext: false,
    all: true,
  });

  const { bots: gridBots, isLoading: gridLoading } = useGridBots({
    paperContext: false,
  });

  const { bots: comboBots, isLoading: comboLoading } = useComboBots({
    paperContext: false,
  });

  const { bots: hedgeDcaBots, isLoading: hedgeDcaLoading } = useHedgeDcaBots({
    terminal: false,
    paperContext: false,
  });

  const { bots: hedgeComboBots, isLoading: hedgeComboLoading } =
    useHedgeComboBots({
      terminal: false,
      paperContext: false,
    }); */

  // Use prop bot if available, otherwise find from fetched data
  const bot = botProp; /* ||
    (botType === 'grid'
      ? gridBots.find((b) => b._id === actualBotId)
      : botType === 'combo'
        ? comboBots.find((b) => b._id === actualBotId)
        : botType === 'hedgeDca'
          ? hedgeDcaBots.find((b) => b._id === actualBotId)
          : botType === 'hedgeCombo'
            ? hedgeComboBots.find((b) => b._id === actualBotId)
            : dcaBots.find((b) => b._id === actualBotId)) */

  /* const botsLoading =
    dcaLoading ||
    gridLoading ||
    comboLoading ||
    hedgeDcaLoading ||
    hedgeComboLoading; */

  // Determine bot type from bot data
  const botTypeEnum = useMemo(() => bot?.type, [bot]);

  // Grid awareness to tweak UX (hide Deals tab)
  const isGrid = botType === 'grid' || botTypeEnum === BotTypesEnum.grid;

  // Ensure selected tab remains valid if bot type is Grid (no Deals tab)
  useEffect(() => {
    if (isGrid && selectedTab === 'deals') {
      setSelectedTab('recent');
    }
  }, [isGrid, selectedTab]);

  // Server-side paging: fetch a handful for the active tab and let
  // "Load more" grow the page size. Reset when the tab or search changes.
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Debounce the search box so each keystroke doesn't hit the backend.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedTab, debouncedSearch]);

  // Server-side search across event name + description (OR). `linkOperator`
  // is the key the backend's grid-options mapper reads to apply `$or`.
  const searchFilterModel = useMemo<GridFilterModel | undefined>(() => {
    if (!debouncedSearch) {
      return undefined;
    }
    return {
      linkOperator: 'or',
      items: [
        {
          id: 'search-event',
          field: 'event',
          operator: 'contains',
          value: debouncedSearch,
        },
        {
          id: 'search-description',
          field: 'description',
          operator: 'contains',
          value: debouncedSearch,
        },
      ],
    };
  }, [debouncedSearch]);

  // Get bot events from backend — categorized + paginated server-side.
  const {
    events,
    total: backendTotal,
    counts,
    hasValidResponse,
    isLoading: eventsLoading,
    isError: eventsError,
    refetch,
  } = useBotEvents(actualBotId || '', botTypeEnum, {
    category: selectedTab,
    pageSize: visibleCount,
    ...(searchFilterModel ? { filterModel: searchFilterModel } : {}),
  });

  // Total matches across all categories (counts already respect the search).
  const totalMatches = counts.recent + counts.deals + counts.alerts;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((current) => current + PAGE_SIZE);
  }, []);

  // Get event icon based on severity
  const getEventIcon = useCallback((event: BotEvent) => {
    const severity = getEventSeverity(event);
    switch (severity) {
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      default:
        return Info;
    }
  }, []);

  // Format event timestamp
  const formatEventTime = useCallback((created: string) => {
    const date = new Date(created);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }, []);

  const formatEventDateLabel = useCallback((created: string) => {
    const date = new Date(created);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const month = date.toLocaleString('default', { month: 'short' });
    const dayWithSuffix = formatDayWithSuffix(date.getDate());

    // Only surface the year when the event is more than a year old; for
    // current events the year is just noise.
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (date < oneYearAgo) {
      const year = date.getFullYear().toString().slice(-2);
      return `${month} ${dayWithSuffix}, ${year}`;
    }

    return `${month} ${dayWithSuffix}`;
  }, []);

  const formatEventTimeLabel = useCallback((created: string) => {
    const date = new Date(created);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, []);

  // Handle metadata viewing
  const handleViewMetadata = useCallback((_event: BotEvent) => {
    // Event metadata is displayed in the dialog modal
  }, []);

  // State for refresh animation
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh with animation
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      // Add a small delay to show completion animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    } catch (_error) {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Reset refreshing state when loading changes
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (!eventsLoading && isRefreshing) {
      // Add a small delay to show completion
      timer = setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [eventsLoading, isRefreshing]);

  const getTradeAction = useCallback((text: string): string | null => {
    if (!text) {
      return null;
    }

    if (text.includes('cancel')) {
      return 'Cancelled';
    }

    if (text.includes('partial') && text.includes('fill')) {
      return 'Partially Filled';
    }

    if (
      text.includes('fill') ||
      text.includes('fulfilled') ||
      text.includes('executed') ||
      text.includes('completed')
    ) {
      return 'Filled';
    }

    if (text.includes('close') || text.includes('closed')) {
      return 'Closed';
    }

    if (
      text.includes('open') ||
      text.includes('placed') ||
      text.includes('submitted') ||
      text.includes('created') ||
      text.includes('start') ||
      text.includes('entry')
    ) {
      return 'Placed';
    }

    if (text.includes('expire') || text.includes('timeout')) {
      return 'Expired';
    }

    return null;
  }, []);

  const getEventLabel = useCallback(
    (
      event: BotEvent,
      tradeDirection: TradeDirection | null
    ): string | undefined => {
      const eventName = (event.event ?? '').toLowerCase();
      const description = (event.description ?? '').toLowerCase();
      const combined = `${eventName} ${description}`;

      if (tradeDirection) {
        const action = getTradeAction(combined);
        const directionLabel = tradeDirection === 'buy' ? 'Buy' : 'Sell';
        return action ? `${directionLabel} ${action}` : directionLabel;
      }

      if (eventName.includes('entry') || eventName.includes('market')) {
        return 'Entry';
      }

      if (combined.includes('deal')) {
        if (combined.includes('open')) return 'Deal Opened';
        if (combined.includes('close')) return 'Deal Closed';
        return 'Deal';
      }

      if (combined.includes('start') || combined.includes('stop')) {
        return 'Bot Status';
      }

      if (combined.includes('error') || combined.includes('warning')) {
        return 'Alert';
      }

      return undefined;
    },
    [getTradeAction]
  );

  const getEventVariant = useCallback(
    (event: BotEvent, tradeDirection: TradeDirection | null) => {
      const severity = getEventSeverity(event);
      const eventText = (event.event ?? '').toLowerCase();
      const descriptionText = (event.description ?? '').toLowerCase();
      const combined = `${eventText} ${descriptionText}`;

      if (tradeDirection === 'buy') {
        return 'profit' as const;
      }

      if (tradeDirection === 'sell') {
        return 'loss' as const;
      }

      if (severity === 'error') {
        return 'error' as const;
      }

      if (severity === 'warning') {
        return 'warning' as const;
      }

      if (severity === 'success') {
        return 'success' as const;
      }

      if (combined.includes('restart') || combined.includes('restarted')) {
        return 'success' as const;
      }

      if (severity === 'info') {
        return 'info' as const;
      }

      return 'default' as const;
    },
    []
  );

  const getEventIconBySemantic = useCallback(
    (event: BotEvent, tradeDirection: TradeDirection | null) => {
      if (tradeDirection === 'buy') {
        return ArrowUp;
      }

      if (tradeDirection === 'sell') {
        return ArrowDown;
      }

      const eventText = (event.event ?? '').toLowerCase();
      const descriptionText = (event.description ?? '').toLowerCase();
      const combined = `${eventText} ${descriptionText}`;

      if (combined.includes('restart')) {
        return RefreshCw;
      }

      if (combined.includes('status')) {
        return Activity;
      }

      return getEventIcon(event);
    },
    [getEventIcon]
  );

  // Convert events to timeline items
  const convertToTimelineItems = useCallback(
    (eventList: BotEvent[]): TimelineItem[] => {
      return eventList.map((event) => {
        const severity = getEventSeverity(event);
        // Error/warning events are alerts, not trades. Don't infer a buy/sell
        // direction from text like "side: sell ... deal close" — otherwise an
        // order error renders as a completed "Sell Closed" trade.
        const isAlert = severity === 'error' || severity === 'warning';
        const tradeDirection = isAlert ? null : detectTradeDirection(event);
        const EventIcon = getEventIconBySemantic(event, tradeDirection);
        const label = isAlert
          ? severity === 'error'
            ? 'Error'
            : 'Warning'
          : getEventLabel(event, tradeDirection);

        const variant = getEventVariant(event, tradeDirection);

        const orderId = extractOrderId(event);
        const badgeContent =
          event.symbol || orderId || event.deal ? (
            <div className="flex items-center gap-1">
              {event.symbol && (
                <CoinPair
                  pair={event.symbol}
                  iconSize="sm"
                  layout="horizontal"
                  showText
                />
              )}
              {orderId ? (
                <CopyableId id={orderId} label="Order ID" />
              ) : (
                event.deal && <CopyableId id={event.deal} label="Deal ID" />
              )}
            </div>
          ) : undefined;

        const dateLabel = formatEventDateLabel(event.created);
        const timeLabel = formatEventTimeLabel(event.created);

        const timelineItem: TimelineItem = {
          id: event._id,
          title: event.event,
          content: event.description ? (
            <ExpandableMessage text={event.description} />
          ) : undefined,
          timestamp: formatEventTime(event.created),
          icon: <EventIcon className="h-full w-full" />,
          variant,
          badge: badgeContent,
          metadata: event.metadata ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs"
                  onClick={() => handleViewMetadata(event)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Event Metadata: {event.event}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-96">
                  <pre className="overflow-x-auto rounded-lg bg-muted p-md text-xs">
                    {formatEventMetadata(event.metadata)}
                  </pre>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          ) : undefined,
        };

        if (dateLabel) {
          timelineItem.date = dateLabel;
        }

        if (timeLabel) {
          timelineItem.time = timeLabel;
        }

        if (label) {
          timelineItem.label = label;
        }

        return timelineItem;
      });
    },
    [
      getEventIconBySemantic,
      getEventLabel,
      getEventVariant,
      formatEventTime,
      formatEventDateLabel,
      formatEventTimeLabel,
      handleViewMetadata,
    ]
  ); // Render event timeline
  const renderEventTimeline = useCallback(
    (
      eventList: BotEvent[],
      emptyMessage: string,
      emptyIcon: React.ComponentType<{ className?: string }>
    ) => {
      if (eventList.length === 0) {
        const EmptyIcon = emptyIcon;
        return (
          <div className="text-center py-8 text-muted-foreground">
            <EmptyIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">{emptyMessage}</p>
            <p className="text-sm">Events will appear here as they occur</p>
          </div>
        );
      }

      const timelineItems = convertToTimelineItems(eventList);
      const canLoadMore = eventList.length < backendTotal;

      return (
        <div className="flex h-full flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1">
            <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <Timeline items={timelineItems} className="py-2" />
            </div>
            {/* Fade indicator for scrollable content */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-linear-to-t from-background to-transparent pointer-events-none" />
          </div>
          {/* Load more pinned at the bottom of the list, always visible */}
          {canLoadMore && (
            <div className="flex shrink-0 justify-center border-t border-border/40 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={eventsLoading}
                className="text-xs"
              >
                {eventsLoading
                  ? 'Loading…'
                  : `Load more (${eventList.length} of ${backendTotal})`}
              </Button>
            </div>
          )}
        </div>
      );
    },
    [convertToTimelineItems, backendTotal, eventsLoading, handleLoadMore]
  );

  if (/* botsLoading || */ eventsLoading) {
    return (
      <div className="w-full">
        <div className="text-center text-muted-foreground py-8">
          Loading bot events...
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="w-full">
        <div className="text-center text-muted-foreground py-8">
          Bot not found
        </div>
      </div>
    );
  }

  if (eventsError || !hasValidResponse) {
    return (
      <div className="w-full">
        <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load bot events. Please try refreshing.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search and Refresh Bar */}
      <div className="flex items-center gap-xs mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-9 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={eventsLoading || isRefreshing}
          className="h-9"
        >
          <RefreshCw
            className={cn(
              'w-4 h-4 mr-2 transition-transform duration-200',
              (eventsLoading || isRefreshing) && 'animate-spin'
            )}
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          setSelectedTab(value as 'recent' | 'deals' | 'alerts')
        }
      >
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger
            value="recent"
            className="flex items-center gap-xs text-xs"
          >
            <Clock className="w-4 h-4" />
            Recent ({counts.recent})
          </TabsTrigger>
          {!isGrid && (
            <TabsTrigger
              value="deals"
              className="flex items-center gap-xs text-xs"
            >
              <Activity className="w-4 h-4" />
              Deals ({counts.deals})
            </TabsTrigger>
          )}
          <TabsTrigger
            value="alerts"
            className="flex items-center gap-xs text-xs"
          >
            <AlertCircle className="w-4 h-4" />
            Alerts ({counts.alerts})
          </TabsTrigger>
        </TabsList>

        {/* Search Results Indicator */}
        {debouncedSearch && (
          <div className="mt-2 mb-2">
            <div className="text-xs text-muted-foreground">
              {totalMatches > 0 ? (
                <>
                  Found {totalMatches} event
                  {totalMatches !== 1 ? 's' : ''} matching "{debouncedSearch}"
                </>
              ) : (
                <>No events found matching "{debouncedSearch}"</>
              )}
            </div>
          </div>
        )}

        <TabsContent value="recent" className="mt-4 flex-1 overflow-hidden">
          {renderEventTimeline(events, 'No Recent Activity', Clock)}
        </TabsContent>

        {!isGrid && (
          <TabsContent value="deals" className="mt-4 flex-1 overflow-hidden">
            {renderEventTimeline(events, 'No Deal Events', TrendingUp)}
          </TabsContent>
        )}

        <TabsContent value="alerts" className="mt-4 flex-1 overflow-hidden">
          {renderEventTimeline(events, 'No Alerts', AlertCircle)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DrawerBotEvents;
