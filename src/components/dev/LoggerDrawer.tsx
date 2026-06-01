import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type CategoryConfig,
  type LogEntry,
  logger,
  LogLevel,
} from '@/lib/loggerInstance';
import { cn } from '@/lib/utils';
import { useLoggerStore } from '@/stores/useLoggerStore';
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Copy,
  Filter,
  Power,
  RotateCcw,
  Search,
  Settings,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

// Helper function to safely stringify log data
const stringifyLogData = (data: unknown): string => {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

export const LoggerDrawer: React.FC = () => {
  const isOpen = useLoggerStore((state) => state.isOpen);
  const isEnabled = useLoggerStore((state) => state.isEnabled);
  const filters = useLoggerStore((state) => state.filters);
  const closeDrawer = useLoggerStore((state) => state.closeDrawer);
  const toggleEnabled = useLoggerStore((state) => state.toggleEnabled);
  const setSearchQuery = useLoggerStore((state) => state.setSearchQuery);
  const toggleCategory = useLoggerStore((state) => state.toggleCategory);
  const toggleLevel = useLoggerStore((state) => state.toggleLevel);
  const toggleShowDuplicatesOnly = useLoggerStore(
    (state) => state.toggleShowDuplicatesOnly
  );
  const toggleGroupRepeated = useLoggerStore(
    (state) => state.toggleGroupRepeated
  );
  const resetFilters = useLoggerStore((state) => state.resetFilters);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [categorySettings, setCategorySettings] = useState(
    logger.getConfig().categories
  );
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categoryFilterSearch, setCategoryFilterSearch] = useState('');
  const [categorySettingsSearch, setCategorySettingsSearch] = useState('');

  // Activate logger on mount (runs once, regardless of drawer open state)
  useEffect(() => {
    // Sync logger active state with store enabled state
    logger.setActive(isEnabled);
  }, [isEnabled]); // Update when enabled state changes

  // Subscribe to log updates and wait for initialization
  useEffect(() => {
    let mounted = true;

    const unsubscribe = logger.subscribe(() => {
      if (!mounted) return;
      // Always fetch the appropriate log type based on current filter
      const logsToShow = filters.groupRepeated
        ? logger.getLogs()
        : logger.getLogsUngrouped();
      setLogs(logsToShow);
      const categories = logger.getCategories();
      setAvailableCategories(categories);
    });

    // Wait for initialization then load logs
    logger.waitForInitialization().then(() => {
      if (!mounted) return;
      const initialLogs = filters.groupRepeated
        ? logger.getLogs()
        : logger.getLogsUngrouped();
      setLogs(initialLogs);
      const initialCategories = logger.getCategories();
      setAvailableCategories(initialCategories);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [filters.groupRepeated]); // Only depend on groupRepeated to avoid infinite loops

  // NOTE: Auto-selection removed to prevent infinite loops
  // Instead, logs are shown by default when no categories are selected

  // Update category settings when available categories change
  // Use a ref to track if we've already loaded to prevent feedback loops
  const lastCategoriesRef = React.useRef<string>('');
  useEffect(() => {
    const categoriesKey = availableCategories.join(',');
    // Only update if categories actually changed
    if (categoriesKey !== lastCategoriesRef.current) {
      lastCategoriesRef.current = categoriesKey;
      const config = logger.getConfig();
      setCategorySettings(config.categories);
    }
  }, [availableCategories]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.length > 0 || filters.selectedCategories.length > 0 // Any category selection is a filter
    );
  }, [filters.searchQuery, filters.selectedCategories]);

  // Filter logs based on current filters
  const filteredLogs = useMemo(() => {
    const filtered = logs.filter((log) => {
      // Filter by category
      // If NO categories are selected, show ALL logs (default behavior)
      // If categories ARE selected, only show matching logs
      if (filters.selectedCategories.length > 0) {
        // If log has no category, show it
        if (!log.category || log.category.trim() === '') {
          // Allow uncategorized logs through
        } else if (!filters.selectedCategories.includes(log.category)) {
          // Filter out logs not in selected categories
          return false;
        }
      }
      // If no categories selected, all logs pass through

      // Filter by level
      // If NO levels are selected, show ALL logs
      // If levels ARE selected, only show matching logs
      if (
        filters.selectedLevels.length > 0 &&
        filters.selectedLevels.length < Object.keys(LogLevel).length
      ) {
        if (log.level && !filters.selectedLevels.includes(log.level)) {
          return false;
        }
      }

      // Filter by duplicates
      if (
        filters.showDuplicatesOnly &&
        (!log.count || log.count < logger.getConfig().duplicateThreshold)
      ) {
        return false;
      }

      // Filter by search query (combined with other filters, not exclusive)
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          log.message.toLowerCase().includes(query) ||
          (log.category && log.category.toLowerCase().includes(query)) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(query));

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
    return filtered;
  }, [
    logs,
    filters.searchQuery,
    filters.selectedCategories,
    filters.selectedLevels,
    filters.showDuplicatesOnly,
  ]);

  // Get log statistics - calculate from the actual logs being displayed
  const stats = useMemo(() => {
    const categories = availableCategories;
    const statsResult: Record<
      string,
      { total: number; byLevel: Record<string, number> }
    > = {};

    // Initialize stats for all categories
    categories.forEach((category) => {
      statsResult[category] = { total: 0, byLevel: {} };
    });

    // Calculate from current logs (grouped or ungrouped)
    logs.forEach((log) => {
      const logCategory = log.category || 'uncategorized';
      const logLevel = log.level || 'DEBUG';

      if (!statsResult[logCategory]) {
        statsResult[logCategory] = { total: 0, byLevel: {} };
      }
      // If grouped, use the count, otherwise just count as 1
      const count = filters.groupRepeated ? log.count || 1 : 1;
      statsResult[logCategory].total += count;
      statsResult[logCategory].byLevel[logLevel] =
        (statsResult[logCategory].byLevel[logLevel] || 0) + count;
    });

    return statsResult;
  }, [logs, availableCategories, filters.groupRepeated]);

  // Filter categories for filter dropdown
  const filteredCategoriesForFilter = useMemo(() => {
    if (!categoryFilterSearch) return availableCategories;
    return availableCategories.filter((cat) =>
      cat.toLowerCase().includes(categoryFilterSearch.toLowerCase())
    );
  }, [availableCategories, categoryFilterSearch]);

  // Filter categories for settings dropdown
  const filteredCategoriesForSettings = useMemo(() => {
    if (!categorySettingsSearch) return availableCategories;
    return availableCategories.filter((cat) =>
      cat.toLowerCase().includes(categorySettingsSearch.toLowerCase())
    );
  }, [availableCategories, categorySettingsSearch]);

  const handleCopyAll = async () => {
    // If filters are active, copy only filtered logs
    const logsToFormat = hasActiveFilters ? filteredLogs : logs;

    // Format logs similar to logger.copyLogs() but for specific logs
    const text = logsToFormat
      .map((log) => {
        const timestamp = new Date(log.timestamp).toISOString();
        const countStr = log.count && log.count > 1 ? ` (×${log.count})` : '';
        let logText = `[${timestamp}] [${log.level}] [${log.category}]${countStr} ${log.message}`;

        // Include data objects if present
        if (log.data !== undefined) {
          logText += `\n${stringifyLogData(log.data)}`;
        }

        return logText;
      })
      .join('\n\n');

    await navigator.clipboard.writeText(text);
  };

  const handleClearAll = async () => {
    await logger.clearLogs();
    // Force immediate UI update with empty array
    setLogs([]);
    setAvailableCategories([]);
  };

  const toggleLogExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'DEBUG':
        return 'bg-gray-500';
      case 'INFO':
        return 'bg-blue-500';
      case 'WARN':
        return 'bg-yellow-500';
      case 'ERROR':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleToggleCategoryEnabled = (category: string) => {
    const currentEnabled = categorySettings[category]?.enabled ?? true;
    const newSettings = {
      ...categorySettings,
      [category]: {
        ...categorySettings[category],
        enabled: !currentEnabled,
      },
    };
    setCategorySettings(newSettings);
    logger.setCategoryConfig(category, { enabled: !currentEnabled });
  };

  // Always render the component (even if hidden) to keep logger active and subscribed
  return (
    <aside
      className={cn(
        'relative h-full overflow-hidden transition-[width] duration-300 ease-in-out bg-background border-l flex flex-col',
        isOpen
          ? 'w-96 min-w-[24rem] border-border'
          : 'w-0 min-w-0 border-transparent pointer-events-none'
      )}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-md border-b border-border bg-card">
        <div className="flex items-center gap-xs">
          <h2 className="text-lg font-semibold">Dev Logger</h2>
          <Badge variant="secondary" className="text-xs">
            {filteredLogs.length}/{logs.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant={isEnabled ? 'ghost' : 'destructive'}
            size="icon"
            onClick={toggleEnabled}
            title={isEnabled ? 'Disable Logger' : 'Enable Logger'}
            className="h-8 w-8"
          >
            <Power
              className={cn(
                'h-4 w-4',
                !isEnabled && 'text-destructive-foreground'
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Select all categories
              availableCategories.forEach((cat) => {
                if (!filters.selectedCategories.includes(cat)) {
                  toggleCategory(cat);
                }
              });
            }}
            title="Select All Categories"
            className="h-8 w-8"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Deselect all categories
              filters.selectedCategories.forEach((cat: string) => {
                toggleCategory(cat);
              });
            }}
            title="Clear All Categories"
            className="h-8 w-8"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              resetFilters();
              // Also reset all category configs to enabled
              const newSettings: Record<string, CategoryConfig> = {};
              availableCategories.forEach((cat) => {
                newSettings[cat] = {
                  enabled: true,
                  minLevel: 0, // DEBUG level
                };
                logger.setCategoryConfig(cat, { enabled: true });
              });
              setCategorySettings(newSettings);
            }}
            title="Reset Filters & Settings"
            className="h-8 w-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            title="Close"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-md space-y-sm border-b border-border">
        {/* Search and Filter Buttons Row */}
        <div className="flex gap-xs">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={filters.searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-9"
            />
          </div>

          {/* Filter: Levels & Categories */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                title="Filter Levels & Categories"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>Filter Logs</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Level Filter */}
              <div className="px-2 py-1.5">
                <div className="text-xs font-medium mb-2 text-muted-foreground">
                  Filter by Level
                </div>
                <ScrollArea className="max-h-[150px]">
                  <div className="space-y-1 py-1">
                    {Object.keys(LogLevel).map((level) => (
                      <DropdownMenuCheckboxItem
                        key={level}
                        checked={filters.selectedLevels.includes(level)}
                        onCheckedChange={() => toggleLevel(level)}
                      >
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full mr-2',
                            getLevelColor(level)
                          )}
                        />
                        {level}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <DropdownMenuSeparator />

              {/* Category Filter */}
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Filter by Category
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs"
                      onClick={() => {
                        // Select all categories
                        availableCategories.forEach((cat) => {
                          if (!filters.selectedCategories.includes(cat)) {
                            toggleCategory(cat);
                          }
                        });
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs"
                      onClick={() => {
                        // Clear all categories
                        filters.selectedCategories.forEach((cat: string) => {
                          toggleCategory(cat);
                        });
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={categoryFilterSearch}
                    onChange={(e) => setCategoryFilterSearch(e.target.value)}
                    className="h-7 pl-7 text-xs"
                  />
                </div>
              </div>

              {/* Scrollable Category List */}
              <ScrollArea className="h-[200px] px-2">
                <div className="space-y-1 py-1">
                  {filteredCategoriesForFilter.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No categories found
                    </div>
                  ) : (
                    filteredCategoriesForFilter.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={filters.selectedCategories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      >
                        <div className="flex items-center justify-between w-full gap-sm">
                          <span className="truncate flex-1">{category}</span>
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            {stats[category]?.total || 0}
                          </Badge>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </div>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings: Enable/Disable & Display Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Category Enable/Disable Controls */}
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Enable/Disable Logging
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs"
                      onClick={() => {
                        const newSettings = { ...categorySettings };
                        availableCategories.forEach((cat) => {
                          newSettings[cat] = {
                            ...newSettings[cat],
                            enabled: true,
                          };
                          logger.setCategoryConfig(cat, { enabled: true });
                        });
                        setCategorySettings(newSettings);
                      }}
                    >
                      Enable All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs"
                      onClick={() => {
                        const newSettings = { ...categorySettings };
                        availableCategories.forEach((cat) => {
                          newSettings[cat] = {
                            ...newSettings[cat],
                            enabled: false,
                          };
                          logger.setCategoryConfig(cat, { enabled: false });
                        });
                        setCategorySettings(newSettings);
                      }}
                    >
                      Disable All
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySettingsSearch}
                    onChange={(e) => setCategorySettingsSearch(e.target.value)}
                    className="h-7 pl-7 text-xs"
                  />
                </div>
              </div>

              {/* Scrollable Enable/Disable List */}
              <ScrollArea className="h-[200px] px-2">
                <div className="space-y-1 py-1">
                  {filteredCategoriesForSettings.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No categories found
                    </div>
                  ) : (
                    filteredCategoriesForSettings.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={`enable-${category}`}
                        checked={categorySettings[category]?.enabled ?? true}
                        onCheckedChange={() =>
                          handleToggleCategoryEnabled(category)
                        }
                      >
                        <span className="truncate">Enable {category}</span>
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </div>
              </ScrollArea>

              <DropdownMenuSeparator />

              {/* Display Options - Non-scrollable footer */}
              <div className="px-2 py-1">
                <div className="text-xs font-medium mb-2 text-muted-foreground">
                  Display Options
                </div>
                <DropdownMenuCheckboxItem
                  checked={filters.groupRepeated}
                  onCheckedChange={toggleGroupRepeated}
                >
                  Group repeated messages
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.showDuplicatesOnly}
                  onCheckedChange={toggleShowDuplicatesOnly}
                >
                  Show duplicates only (≥{logger.getConfig().duplicateThreshold}
                  )
                </DropdownMenuCheckboxItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyAll}
            title={hasActiveFilters ? 'Copy Filtered Logs' : 'Copy All Logs'}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearAll}
            title="Clear All Logs"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Active Filters Warning */}
        {filters.showDuplicatesOnly && (
          <div className="flex items-center justify-between p-xs bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
            <span className="text-yellow-600 dark:text-yellow-400">
              Showing only duplicates (≥
              {logger.getConfig().duplicateThreshold})
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={toggleShowDuplicatesOnly}
            >
              Clear Filter
            </Button>
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-hidden w-full">
        <ScrollArea className="h-full w-full">
          <div className="p-md space-y-xs w-full max-w-full">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {!isEnabled ? (
                  <>
                    <Power className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium mb-2">Logger Disabled</p>
                    <p className="text-sm">
                      No new logs will be captured until you enable the logger
                    </p>
                  </>
                ) : (
                  'No logs to display'
                )}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-sm rounded-md border border-border bg-card hover:bg-accent/50 transition-colors overflow-hidden w-full max-w-full"
                >
                  <div
                    className="flex items-start gap-xs cursor-pointer overflow-hidden w-full max-w-full"
                    onClick={() => toggleLogExpanded(log.id)}
                  >
                    <button className="mt-1 shrink-0">
                      {expandedLogs.has(log.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-xs mb-1 flex-wrap">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            getLevelColor(log.level || 'DEBUG')
                          )}
                        />
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs truncate max-w-[120px]"
                        >
                          {log.category || 'uncategorized'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {log.level || 'DEBUG'}
                        </Badge>
                        {log.count && log.count > 1 && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            ×{log.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm break-all overflow-hidden w-full">
                        {log.message}
                      </p>
                      {expandedLogs.has(log.id) && (
                        <div className="mt-2 space-y-xs overflow-hidden">
                          {log.data !== undefined && log.data !== null && (
                            <div className="p-xs bg-muted rounded text-xs font-mono overflow-x-auto max-w-full">
                              <pre className="whitespace-pre-wrap break-all max-w-full">
                                {stringifyLogData(log.data)}
                              </pre>
                            </div>
                          )}
                          {log.stack && (
                            <div className="p-xs bg-muted rounded text-xs font-mono overflow-x-auto max-w-full">
                              <pre className="whitespace-pre-wrap break-all max-w-full">
                                {log.stack}
                              </pre>
                            </div>
                          )}
                          <div className="flex gap-xs">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  JSON.stringify(
                                    { ...log, data: log.data },
                                    null,
                                    2
                                  )
                                );
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};

export default LoggerDrawer;
