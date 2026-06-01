/**
 * RelatedBotsPopover Component
 *
 * A comprehensive popover component that displays all bots using a specific global variable.
 * Features:
 * - Grouped display by bot type
 * - Direct links to bot details
 * - Loading states and error handling
 * - Responsive design for mobile
 * - Pagination for large bot lists
 * - Search and filtering capabilities
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StatusChip } from '@/components/ui/chip/StatusChip';
import { useRelatedBots } from '@/hooks/useGlobalVariables';
import { logger } from '@/lib/loggerInstance';
import { getBotTypeIcon, getBotTypeConfig } from '@/utils/botUtils';
import type {
  BotGroup,
  BotStatus,
  BotType,
  RelatedBot,
} from '@/types/globalVariables';
import {
  AlertCircle,
  Bot,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

interface RelatedBotsPopoverProps {
  variableId: string | null;
  variableName?: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const RelatedBotsPopover: React.FC<RelatedBotsPopoverProps> = ({
  variableId,
  variableName,
  children,
  isOpen,
  onOpenChange,
}) => {
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBotTypes, setSelectedBotTypes] = useState<Set<BotType>>(
    new Set()
  );
  const [selectedStatuses, setSelectedStatuses] = useState<Set<BotStatus>>(
    new Set()
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<BotType>>(new Set());

  // Fetch related bots data (backend does not support pagination — returns all it can)
  const {
    data: relatedBotsData,
    isLoading,
    error,
  } = useRelatedBots(variableId);

  const botGroups: BotGroup[] = useMemo(
    () => relatedBotsData?.data ?? [],
    [relatedBotsData]
  );

  // Process and filter bot data
  const processedBotGroups = useMemo(() => {
    if (!botGroups.length) return [];

    return botGroups
      .map((group: BotGroup) => {
        let filteredBots = group.bots;

        // TODO: Re-enable trading context filter once semantics are confirmed
        // Filter by trading context - only show bots in current context
        // paperContext: true = paper/demo bot, false = live bot
        // isLiveTrading: true = viewing live mode, false = viewing paper mode
        // filteredBots = filteredBots.filter(
        //   (bot) => bot.paperContext === !isLiveTrading
        // );

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filteredBots = filteredBots.filter(
            (bot) =>
              bot.name.toLowerCase().includes(query) ||
              bot._id.toLowerCase().includes(query)
          );
        }

        // Apply bot type filter
        if (selectedBotTypes.size > 0 && !selectedBotTypes.has(group.type)) {
          return null;
        }

        // Apply status filter
        if (selectedStatuses.size > 0) {
          filteredBots = filteredBots.filter((bot) =>
            selectedStatuses.has(bot.status)
          );
        }

        return {
          ...group,
          bots: filteredBots,
          filteredCount: filteredBots.length,
        };
      })
      .filter((group) => group && group.filteredCount > 0)
      .sort((a, b) => (a?.type ?? '').localeCompare(b?.type ?? ''));
  }, [botGroups, searchQuery, selectedBotTypes, selectedStatuses]);

  // Get total counts
  const totalBots = useMemo(() => {
    return processedBotGroups.reduce(
      (sum, group) => sum + (group?.filteredCount || 0),
      0
    );
  }, [processedBotGroups]);

  const totalOriginalBots = useMemo(() => {
    return botGroups.reduce((sum, group) => sum + group.total, 0) || 0;
  }, [botGroups]);

  // Handle group expansion
  const toggleGroupExpansion = (botType: BotType) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(botType)) {
      newExpanded.delete(botType);
    } else {
      newExpanded.add(botType);
    }
    setExpandedGroups(newExpanded);
  };

  // Handle filter changes
  const toggleBotTypeFilter = (botType: BotType) => {
    const newTypes = new Set(selectedBotTypes);
    if (newTypes.has(botType)) {
      newTypes.delete(botType);
    } else {
      newTypes.add(botType);
    }
    setSelectedBotTypes(newTypes);
  };

  const toggleStatusFilter = (status: BotStatus) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedStatuses(newStatuses);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBotTypes(new Set());
    setSelectedStatuses(new Set());
  };

  // Get bot link URL
  const getBotLink = (bot: RelatedBot, botType: BotType) => {
    const baseUrl =
      botType === 'combo' ? '/combo' : botType === 'grid' ? '/grid' : '/bot';
    return `${baseUrl}/view/${bot._id}`;
  };

  // Format bot name for display
  const formatBotName = (bot: RelatedBot) => {
    const maxLength = 25;
    if (bot.name.length <= maxLength) {
      return bot.name;
    }
    return `${bot.name.slice(0, 10)}...${bot.name.slice(-10)}`;
  };

  // Log popover interactions
  const handleOpenChange = (open: boolean) => {
    if (open && variableId) {
      logger.info('[RelatedBotsPopover] Opening popover', {
        variableId,
        variableName,
      });
    }
    onOpenChange?.(open);
  };

  return (
    <Popover open={isOpen ?? false} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[95vw] max-w-96 p-0 sm:w-96"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="p-md border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Related Bots</h4>
            <Badge variant="secondary" className="text-xs">
              {totalBots} of {totalOriginalBots}
            </Badge>
          </div>
          {variableName && (
            <p className="text-xs text-muted-foreground">
              Bots using variable:{' '}
              <code className="font-mono">{variableName}</code>
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-xl">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading bots...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-md">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Failed to load related bots. Please try again.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Search and Filters */}
            <div className="p-md border-b space-y-sm">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>

              {/* Quick Filters */}
              {(selectedBotTypes.size > 0 || selectedStatuses.size > 0) && (
                <div className="flex items-center gap-xs">
                  <span className="text-xs text-muted-foreground">
                    Filters:
                  </span>
                  {Array.from(selectedBotTypes).map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => toggleBotTypeFilter(type)}
                    >
                      {type} ×
                    </Badge>
                  ))}
                  {Array.from(selectedStatuses).map((status) => (
                    <Badge
                      key={status}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => toggleStatusFilter(status)}
                    >
                      {status} ×
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Bot Groups */}
            <ScrollArea className="max-h-80">
              {processedBotGroups.length === 0 ? (
                <div className="p-xl text-center">
                  <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {totalOriginalBots === 0
                      ? 'No bots are using this variable'
                      : 'No bots match the current filters'}
                  </p>
                </div>
              ) : (
                <div className="p-xs">
                  {processedBotGroups.map((group, index) => {
                    if (!group) return null;

                    const isExpanded = expandedGroups.has(group.type);
                    const GroupTypeIcon = getBotTypeIcon(group.type);

                    return (
                      <div key={group.type}>
                        <Collapsible
                          open={isExpanded}
                          onOpenChange={() => toggleGroupExpansion(group.type)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between p-xs h-auto"
                            >
                              <div className="flex items-center gap-xs">
                                <GroupTypeIcon className="h-4 w-4" />
                                <span className="font-medium text-sm capitalize">
                                  {group.type} Bots
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {group.filteredCount}
                                </Badge>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="space-y-1 ml-6">
                            {group.bots.map((bot) => {
                              const botTypeConfig = getBotTypeConfig(
                                group.type
                              );
                              const BotIconComponent = botTypeConfig.icon;

                              return (
                                <div
                                  key={bot._id}
                                  className="flex items-center justify-between p-xs rounded-md hover:bg-muted/50 group"
                                >
                                  <div className="flex items-center gap-xs min-w-0 flex-1">
                                    <div
                                      className="flex items-center justify-center rounded-md w-7 h-7 shrink-0"
                                      style={{
                                        backgroundColor: botTypeConfig.color,
                                      }}
                                    >
                                      <BotIconComponent
                                        size={14}
                                        className="text-white"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1">
                                        <p className="text-sm font-medium truncate">
                                          {formatBotName(bot)}
                                        </p>
                                        <StatusChip
                                          status={bot.status}
                                          dotOnly={true}
                                          size="xs"
                                        />
                                      </div>
                                      <p className="text-xs text-muted-foreground font-mono">
                                        {bot._id.slice(0, 8)}...
                                      </p>
                                    </div>
                                  </div>

                                  <Link
                                    to={getBotLink(bot, group.type)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      logger.info(
                                        '[RelatedBotsPopover] Navigating to bot',
                                        {
                                          botId: bot._id,
                                          botName: bot.name,
                                          botType: group.type,
                                        }
                                      );
                                    }}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="p-0"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </Link>
                                </div>
                              );
                            })}
                          </CollapsibleContent>
                        </Collapsible>

                        {index < processedBotGroups.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default RelatedBotsPopover;
