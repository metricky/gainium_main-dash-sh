import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import logger from '@/lib/loggerInstance';
import { FIVE_MINUTES, queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';
import {
  Query,
  QueryClient,
  useIsFetching,
  useIsMutating,
} from '@tanstack/react-query';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  Maximize2,
  Minimize2,
  Pause,
  Recycle,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import React, { useCallback } from 'react';

// JSON Viewer Component
interface JsonNodeProps {
  data: unknown;
  path: string;
  searchTerm: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  matchRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  currentMatchIndex: number;
  level?: number;
  matchCounter: { current: number };
  onCopy: (text: string) => void;
}

const JsonNode: React.FC<JsonNodeProps> = ({
  data,
  path,
  searchTerm,
  expandedPaths,
  onToggle,
  matchRefs,
  currentMatchIndex,
  level = 0,
  matchCounter,
  onCopy,
}) => {
  const isExpanded = expandedPaths.has(path);

  const highlightText = (text: string) => {
    if (!searchTerm) return text;

    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();

    // Check if this text contains the search term
    if (!lowerText.includes(lowerSearch)) return text;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let searchIndex = lowerText.indexOf(lowerSearch);

    while (searchIndex !== -1) {
      if (searchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, searchIndex));
      }

      const matchText = text.substring(
        searchIndex,
        searchIndex + searchTerm.length
      );
      // eslint-disable-next-line react-hooks/immutability
      const matchIndex = matchCounter.current++;
      const isCurrentMatch = matchIndex === currentMatchIndex;

      parts.push(
        <mark
          key={`match-${matchIndex}`}
          ref={(el) => {
            if (el) {
              matchRefs.current[matchIndex] = el;
            }
          }}
          className={`px-0.5 rounded ${
            isCurrentMatch
              ? 'bg-orange-400 text-black ring-2 ring-orange-600'
              : 'bg-yellow-300 text-black'
          }`}
        >
          {matchText}
        </mark>
      );

      lastIndex = searchIndex + searchTerm.length;
      searchIndex = lowerText.indexOf(lowerSearch, lastIndex);
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  const copyValue = () => {
    const value = JSON.stringify(data, null, 2);
    onCopy(value);
  };

  if (data === null) {
    return (
      <span className="inline-flex items-center gap-1 group">
        <span className="text-gray-500">null</span>
        <button
          onClick={copyValue}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy value"
        >
          <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
        </button>
      </span>
    );
  }

  if (data === undefined) {
    return (
      <span className="inline-flex items-center gap-1 group">
        <span className="text-gray-500">undefined</span>
        <button
          onClick={copyValue}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy value"
        >
          <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
        </button>
      </span>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <span className="inline-flex items-center gap-1 group">
        <span className="text-blue-600">{String(data)}</span>
        <button
          onClick={copyValue}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy value"
        >
          <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
        </button>
      </span>
    );
  }

  if (typeof data === 'number') {
    return (
      <span className="inline-flex items-center gap-1 group">
        <span className="text-purple-600">{data}</span>
        <button
          onClick={copyValue}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy value"
        >
          <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
        </button>
      </span>
    );
  }

  if (typeof data === 'string') {
    const content = `"${data}"`;
    return (
      <span className="inline-flex items-center gap-1 group">
        <span className="text-green-700">{highlightText(content)}</span>
        <button
          onClick={copyValue}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy value"
        >
          <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
        </button>
      </span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-gray-500">[]</span>;
    }

    return (
      <div>
        <div className="inline-flex items-center gap-1 group">
          <button
            onClick={() => onToggle(path)}
            className="inline-flex items-center hover:bg-gray-100 rounded px-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span className="text-gray-600 ml-1">
              [{data.length} {data.length === 1 ? 'item' : 'items'}]
            </span>
          </button>
          <button
            onClick={copyValue}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy array"
          >
            <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        {isExpanded && (
          <div className="ml-4 border-l border-gray-300 pl-2">
            {data.map((item, index) => (
              <div key={index} className="my-1">
                <span className="text-gray-500">{index}: </span>
                <JsonNode
                  data={item}
                  path={`${path}[${index}]`}
                  searchTerm={searchTerm}
                  expandedPaths={expandedPaths}
                  onToggle={onToggle}
                  matchRefs={matchRefs}
                  currentMatchIndex={currentMatchIndex}
                  level={level + 1}
                  matchCounter={matchCounter}
                  onCopy={onCopy}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return <span className="text-gray-500">{'{}'}</span>;
    }

    return (
      <div>
        <div className="inline-flex items-center gap-1 group">
          <button
            onClick={() => onToggle(path)}
            className="inline-flex items-center hover:bg-gray-100 rounded px-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span className="text-gray-600 ml-1">
              {'{'}
              {entries.length} {entries.length === 1 ? 'key' : 'keys'}
              {'}'}
            </span>
          </button>
          <button
            onClick={copyValue}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy object"
          >
            <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        {isExpanded && (
          <div className="ml-4 border-l border-gray-300 pl-2">
            {entries.map(([key, value]) => (
              <div key={key} className="my-1 group">
                <span className="text-blue-800 font-medium">
                  {highlightText(key)}:
                </span>{' '}
                <JsonNode
                  data={value}
                  path={`${path}.${key}`}
                  searchTerm={searchTerm}
                  expandedPaths={expandedPaths}
                  onToggle={onToggle}
                  matchRefs={matchRefs}
                  currentMatchIndex={currentMatchIndex}
                  level={level + 1}
                  matchCounter={matchCounter}
                  onCopy={onCopy}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span>{String(data)}</span>;
};

interface CacheEntry {
  queryKey: string;
  state: Query['state'];
  hitCount: number;
  accessCount: number;
  observerCount: number;
  timeUntilExpiry: string | null;
  size: number;
  sizeKB: string;
  query: Query;
  isStale: boolean;
  isFresh: boolean;
  cacheAge: string;
  isRevalidating: boolean;
  matchedData?: string | null;
  matchedError?: string | null;
}

type FrameHandle =
  | { type: 'raf'; handle: number }
  | { type: 'timeout'; handle: ReturnType<typeof setTimeout> };

function useStats(qc: QueryClient, enabled: boolean) {
  const hitsRef = React.useRef<Map<string, number>>(new Map());
  const accessCountRef = React.useRef<Map<string, number>>(new Map());
  const prevKeysRef = React.useRef<Set<string>>(new Set());
  const frameHandleRef = React.useRef<FrameHandle | null>(null);

  const scheduleCheck = React.useCallback(() => {
    if (frameHandleRef.current) return;

    if (typeof requestAnimationFrame !== 'undefined') {
      const handle = requestAnimationFrame(() => {
        frameHandleRef.current = null;
      });
      frameHandleRef.current = { type: 'raf', handle };
    } else {
      const handle = setTimeout(() => {
        frameHandleRef.current = null;
      }, 16);
      frameHandleRef.current = { type: 'timeout', handle };
    }
  }, []);

  React.useEffect(() => {
    if (!enabled) return;

    const queries = qc.getQueryCache().getAll();
    const currentKeys = new Set(queries.map((q) => JSON.stringify(q.queryKey)));

    currentKeys.forEach((keyStr) => {
      if (!prevKeysRef.current.has(keyStr)) {
        accessCountRef.current.set(keyStr, 1);
        hitsRef.current.set(keyStr, 0);
      }
      if (!accessCountRef.current.has(keyStr)) {
        accessCountRef.current.set(keyStr, 1);
      }
    });

    prevKeysRef.current = currentKeys;

    return qc.getQueryCache().subscribe((event) => {
      if (!event) return;

      const keyStr = JSON.stringify(event.query.queryKey);

      if (event.type === 'updated') {
        const prevState = event.query.state;
        if (prevState.status === 'success') {
          const currentHits = hitsRef.current.get(keyStr) || 0;
          hitsRef.current.set(keyStr, currentHits + 1);
        }
        const currentAccess = accessCountRef.current.get(keyStr) || 0;
        accessCountRef.current.set(keyStr, currentAccess + 1);
        scheduleCheck();
      }

      if (event.type === 'added') {
        if (!accessCountRef.current.has(keyStr)) {
          accessCountRef.current.set(keyStr, 1);
        }
        if (!hitsRef.current.has(keyStr)) {
          hitsRef.current.set(keyStr, 0);
        }
        scheduleCheck();
      }

      if (event.type === 'removed') {
        hitsRef.current.delete(keyStr);
        accessCountRef.current.delete(keyStr);
      }
    });
  }, [qc, enabled, scheduleCheck]);

  const resetStats = React.useCallback(() => {
    hitsRef.current.clear();
    accessCountRef.current.clear();
    prevKeysRef.current.clear();
    logger.debug('[QueryCacheMonitor] Stats reset');
  }, []);

  const getTimeUntilExpiry = (query: Query): string | null => {
    if (!query.state.dataUpdatedAt) return null;
    const now = Date.now();
    const dataUpdatedAt = query.state.dataUpdatedAt;
    const cacheTime = query.options.gcTime ?? FIVE_MINUTES;
    const expiry = dataUpdatedAt + cacheTime;
    const timeLeft = expiry - now;

    if (timeLeft <= 0) return 'Expired';

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const queries = enabled ? qc.getQueryCache().getAll() : [];
  const detailedQueries = queries.map((query) => {
    const keyStr = JSON.stringify(query.queryKey);
    const querySize = JSON.stringify(query.state).length;
    const now = Date.now();
    const dataUpdatedAt = query.state.dataUpdatedAt || 0;
    const cacheAge = now - dataUpdatedAt;

    const isFresh = !query.isStale();
    const isStale = query.isStale();
    const isRevalidating = query.state.fetchStatus === 'fetching';

    const formatCacheAge = (ms: number): string => {
      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      return `${days}d`;
    };

    return {
      queryKey: keyStr,
      state: query.state,
      hitCount: hitsRef.current.get(keyStr) || 0,
      accessCount: accessCountRef.current.get(keyStr) || 0,
      observerCount: query.getObserversCount(),
      timeUntilExpiry: getTimeUntilExpiry(query),
      size: querySize,
      sizeKB: (querySize / 1024).toFixed(2),
      query,
      isStale,
      isFresh,
      cacheAge: formatCacheAge(cacheAge),
      isRevalidating,
    };
  });

  return {
    detailedQueries,
    isFetching: useIsFetching(),
    isMutating: useIsMutating(),
    size: enabled ? JSON.stringify(queries).length / 1024 : 0,
    resetStats,
  };
}

export const QueryCacheContent: React.FC = () => {
  const [lastRefresh, setLastRefresh] = React.useState(new Date());
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [selectedCacheEntry, setSelectedCacheEntry] =
    React.useState<CacheEntry | null>(null);
  const [cacheDialogOpen, setCacheDialogOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [querySearchTerm, setQuerySearchTerm] = React.useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = React.useState(0);
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(
    new Set()
  );
  const matchRefs = React.useRef<(HTMLElement | null)[]>([]);
  const matchCounter = React.useRef({ current: 0 });
  const stats = useStats(queryClient, true);

  const searchInData = (data: unknown, searchTerm: string): string | null => {
    if (!searchTerm || !data) return null;

    try {
      const dataStr = JSON.stringify(data, null, 2);
      const lowerSearch = searchTerm.toLowerCase();
      const lowerData = dataStr.toLowerCase();

      if (lowerData.includes(lowerSearch)) {
        // Find the line that contains the match
        const lines = dataStr.split('\n');
        const matchingLine = lines.find((line) =>
          line.toLowerCase().includes(lowerSearch)
        );

        if (matchingLine) {
          const trimmed = matchingLine.trim();
          return trimmed.length > 100
            ? trimmed.substring(0, 100) + '...'
            : trimmed;
        }
      }
    } catch {
      // Ignore stringify errors
    }

    return null;
  };

  const filteredQueries = stats.detailedQueries
    .map((query) => {
      const keyMatch = query.queryKey
        .toLowerCase()
        .includes(querySearchTerm.toLowerCase());
      const dataMatch = searchInData(query.state.data, querySearchTerm);
      const errorMatch = query.state.error
        ? searchInData(query.state.error, querySearchTerm)
        : null;

      return {
        query,
        matches: keyMatch || dataMatch || errorMatch,
        dataMatch,
        errorMatch,
      };
    })
    .filter((item) => item.matches)
    .map((item) => ({
      ...item.query,
      matchedData: item.dataMatch,
      matchedError: item.errorMatch,
    }));

  const successCount = stats.detailedQueries.filter(
    (q) => q.state.status === 'success'
  ).length;
  const errorCount = stats.detailedQueries.filter(
    (q) => q.state.status === 'error'
  ).length;
  const pendingCount = stats.detailedQueries.filter(
    (q) => q.state.status === 'pending'
  ).length;

  // Auto-refresh every 2 seconds when auto-refresh is enabled
  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const clearCache = () => {
    queryClient.clear();
    setLastRefresh(new Date());
  };

  const refreshNow = () => {
    setLastRefresh(new Date());
  };

  const resetStats = () => {
    stats.resetStats();
    setLastRefresh(new Date());
  };

  const invalidateQuery = (queryKey: string, refetch = false) => {
    const parsedKey = JSON.parse(queryKey);
    if (refetch) {
      // Default behavior - allow refetch
      queryClient.invalidateQueries({ queryKey: parsedKey });
    } else {
      // Safe default for dev UI: invalidate but do NOT trigger refetch
      queryClient.invalidateQueries({
        queryKey: parsedKey,
        refetchType: 'none',
      });
    }

    setLastRefresh(new Date());
  };

  const markQueryStale = (queryKey: string) => {
    // Mark the query as stale without triggering an immediate refetch
    try {
      // Mark the query as stale but do NOT trigger any refetches (active or inactive)
      const parsedKey = JSON.parse(queryKey);
      queryClient.invalidateQueries({
        queryKey: parsedKey,
        refetchType: 'none',
      });

      // Update selected cache entry immediately so the UI reflects the stale state without waiting
      if (selectedCacheEntry?.queryKey === queryKey) {
        const found = queryClient
          .getQueryCache()
          .getAll()
          .find((q) => JSON.stringify(q.queryKey) === queryKey);
        if (found) {
          setSelectedCacheEntry((prev) =>
            prev
              ? {
                  ...prev,
                  state: found.state,
                  isStale: found.isStale(),
                }
              : prev
          );
        }
      }

      logger.info('[QueryCacheContent] Marked query as stale', { queryKey });
      toast.info('Marked query as stale');
    } catch (error) {
      logger.error('[QueryCacheContent] Failed to mark query as stale', error);
      toast.error('Failed to mark query as stale');
    }

    setLastRefresh(new Date());
  };

  const removeQuery = (queryKey: string) => {
    queryClient.removeQueries({ queryKey: JSON.parse(queryKey) });
    setLastRefresh(new Date());
  };

  const viewCacheEntry = (query: CacheEntry) => {
    setSelectedCacheEntry(query);
    setCacheDialogOpen(true);
    setSearchTerm('');
    setExpandedPaths(new Set()); // Reset expanded state when opening new entry
  };

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getAllPaths = (data: unknown, currentPath = 'root'): string[] => {
    const paths: string[] = [];

    if (Array.isArray(data)) {
      paths.push(currentPath);
      data.forEach((item, index) => {
        paths.push(...getAllPaths(item, `${currentPath}[${index}]`));
      });
    } else if (typeof data === 'object' && data !== null) {
      paths.push(currentPath);
      Object.entries(data).forEach(([key, value]) => {
        paths.push(...getAllPaths(value, `${currentPath}.${key}`));
      });
    }

    return paths;
  };

  const getPathsContainingMatch = useCallback(
    (data: unknown, searchTerm: string, currentPath = 'root'): string[] => {
      if (!searchTerm) return [];

      const paths: string[] = [];
      const lowerSearch = searchTerm.toLowerCase();

      const checkMatch = (value: unknown): boolean => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerSearch);
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value).toLowerCase().includes(lowerSearch);
        }
        return false;
      };

      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          const itemPath = `${currentPath}[${index}]`;
          if (checkMatch(item)) {
            paths.push(currentPath, itemPath);
          }
          if (typeof item === 'object' && item !== null) {
            const nestedPaths = getPathsContainingMatch(
              item,
              searchTerm,
              itemPath
            );
            if (nestedPaths.length > 0) {
              paths.push(currentPath, ...nestedPaths);
            }
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          const keyPath = `${currentPath}.${key}`;
          // Check if key matches
          if (key.toLowerCase().includes(lowerSearch)) {
            paths.push(currentPath, keyPath);
          }
          // Check if value matches
          if (checkMatch(value)) {
            paths.push(currentPath, keyPath);
          }
          // Check nested objects/arrays
          if (typeof value === 'object' && value !== null) {
            const nestedPaths = getPathsContainingMatch(
              value,
              searchTerm,
              keyPath
            );
            if (nestedPaths.length > 0) {
              paths.push(currentPath, ...nestedPaths);
            }
          }
        });
      }

      return [...new Set(paths)]; // Remove duplicates
    },
    []
  );

  const expandAll = () => {
    if (selectedCacheEntry?.state.data) {
      const allPaths = getAllPaths(selectedCacheEntry.state.data);
      setExpandedPaths(new Set(allPaths));
    }
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatErrorDetails = (error: unknown) => {
    if (!error) return 'No error details available';
    if (typeof error === 'string') return error;
    if (error instanceof Error) {
      let details = `Error: ${error.message}`;
      if (error.stack) {
        details += `\n\nStack trace:\n${error.stack}`;
      }
      return details;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const errorObj = error as Record<string, unknown>;
      let details = `Error: ${errorObj['message']}`;
      if ('stack' in errorObj && typeof errorObj['stack'] === 'string') {
        details += `\n\nStack trace:\n${errorObj['stack']}`;
      }
      return details;
    }
    return JSON.stringify(error, null, 2);
  };

  const highlightMatches = (content: string, searchTerm: string) => {
    if (!searchTerm) {
      // Return formatted content without search
      return content
        .split('\n')
        .map((line, index) => <div key={index}>{line}</div>);
    }

    const lines = content.split('\n');
    const lowerSearch = searchTerm.toLowerCase();
    let globalMatchCount = 0;

    const result = lines.map((line, lineIndex) => {
      const lowerLine = line.toLowerCase();
      if (!lowerLine.includes(lowerSearch)) {
        return <div key={lineIndex}>{line}</div>;
      }

      // Highlight matching text
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let searchIndex = lowerLine.indexOf(lowerSearch);

      while (searchIndex !== -1) {
        // Add text before match
        if (searchIndex > lastIndex) {
          parts.push(line.substring(lastIndex, searchIndex));
        }

        // Add highlighted match
        const matchText = line.substring(
          searchIndex,
          searchIndex + searchTerm.length
        );
        const matchIndex = globalMatchCount;
        const isCurrentMatch = matchIndex === currentMatchIndex;
        parts.push(
          <mark
            key={`${lineIndex}-${searchIndex}`}
            ref={(el) => {
              if (el) {
                matchRefs.current[matchIndex] = el;
              }
            }}
            className={`px-0.5 rounded ${
              isCurrentMatch
                ? 'bg-orange-400 text-black ring-2 ring-orange-600'
                : 'bg-yellow-300 text-black'
            }`}
          >
            {matchText}
          </mark>
        );

        globalMatchCount++;
        lastIndex = searchIndex + searchTerm.length;
        searchIndex = lowerLine.indexOf(lowerSearch, lastIndex);
      }

      // Add remaining text
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <div key={lineIndex} className="bg-yellow-50">
          {parts}
        </div>
      );
    });

    return result;
  };

  const getTotalMatches = (data: unknown, searchTerm: string): number => {
    if (!searchTerm || !data) return 0;

    const jsonString = JSON.stringify(data);
    const lowerContent = jsonString.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    let count = 0;
    let pos = 0;

    while ((pos = lowerContent.indexOf(lowerSearch, pos)) !== -1) {
      count++;
      pos += searchTerm.length;
    }

    return count;
  };

  const scrollToMatch = (index: number) => {
    const element = matchRefs.current[index];
    const container = document.getElementById('data-scroll-container');

    if (element && container) {
      const elementRect = element.getBoundingClientRect();

      // Calculate the relative position of the element within the container
      const relativeTop = element.offsetTop - container.offsetTop;

      // Scroll to center the element in the container
      const scrollTo =
        relativeTop - container.clientHeight / 2 + elementRect.height / 2;

      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth',
      });
    }
  };

  React.useEffect(() => {
    // Reset match index and counter when search term changes
    setCurrentMatchIndex(0);
    matchRefs.current = [];
    matchCounter.current.current = 0;

    // Auto-expand paths that contain matches
    if (searchTerm && selectedCacheEntry?.state.data) {
      const matchingPaths = getPathsContainingMatch(
        selectedCacheEntry.state.data,
        searchTerm
      );
      setExpandedPaths(new Set(matchingPaths));
    }
  }, [searchTerm, getPathsContainingMatch, selectedCacheEntry?.state.data]);

  // Scroll to current match after rendering completes and refs are populated
  React.useEffect(() => {
    if (
      searchTerm &&
      matchRefs.current.length > 0 &&
      currentMatchIndex < matchRefs.current.length
    ) {
      // Delay to ensure refs are set after expandedPaths changes
      const timer = setTimeout(() => {
        scrollToMatch(currentMatchIndex);
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentMatchIndex, searchTerm, expandedPaths]);

  const handleNextMatch = () => {
    if (!selectedCacheEntry?.state.data) return;
    const totalMatches = getTotalMatches(
      selectedCacheEntry.state.data,
      searchTerm
    );

    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
    }
  };

  const handlePrevMatch = () => {
    if (!selectedCacheEntry?.state.data) return;
    const totalMatches = getTotalMatches(
      selectedCacheEntry.state.data,
      searchTerm
    );

    if (totalMatches > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="p-md border-b border-border bg-card space-y-sm">
        <div className="flex justify-between items-center gap-sm">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search queries..."
                value={querySearchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setQuerySearchTerm(e.target.value)
                }
                className="pl-9 h-8"
              />
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={`Auto-refresh: ${autoRefresh ? 'ON' : 'OFF'}`}
              className="h-8 w-8"
            >
              {autoRefresh ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={refreshNow}
              title="Refresh now"
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={resetStats}
              title="Reset stats"
              className="h-8 w-8"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={clearCache}
              title="Clear cache"
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <Badge variant="secondary">
              Queries: {stats.detailedQueries.length}
            </Badge>
            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
              Success: {successCount}
            </Badge>
            <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
              Error: {errorCount}
            </Badge>
            <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">
              Pending: {pendingCount}
            </Badge>
            <Badge variant="secondary">Fetching: {stats.isFetching}</Badge>
            <Badge variant="secondary">Mutating: {stats.isMutating}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Cache size: {stats.size.toFixed(1)} KB • Last:{' '}
            {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Queries List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-md space-y-xs">
            {filteredQueries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {querySearchTerm
                  ? 'No queries match your search'
                  : 'No queries cached'}
              </div>
            ) : (
              filteredQueries.map((query) => (
                <div
                  key={query.queryKey}
                  className="p-sm rounded-md border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-xs">
                    <div className="flex items-start justify-between gap-xs">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono break-all text-foreground">
                          {query.queryKey.length > 80
                            ? query.queryKey.substring(0, 80) + '...'
                            : query.queryKey}
                        </div>
                        {querySearchTerm &&
                          (query.matchedData || query.matchedError) && (
                            <div className="mt-2 space-y-1">
                              {query.matchedData && (
                                <div className="text-xs p-xs rounded bg-green-500/10 border border-green-500/20">
                                  <div className="text-green-600 font-medium mb-1">
                                    Match in data:
                                  </div>
                                  <code className="text-muted-foreground break-all">
                                    {query.matchedData}
                                  </code>
                                </div>
                              )}
                              {query.matchedError && (
                                <div className="text-xs p-xs rounded bg-red-500/10 border border-red-500/20">
                                  <div className="text-red-600 font-medium mb-1">
                                    Match in error:
                                  </div>
                                  <code className="text-muted-foreground break-all">
                                    {query.matchedError}
                                  </code>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                      <div
                        className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full"
                        title={query.state.status}
                      >
                        {query.state.status === 'success' ? (
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        ) : query.state.status === 'error' ? (
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-xs flex-wrap text-xs text-muted-foreground">
                      <span>Hits: {query.hitCount}</span>
                      <span>Access: {query.accessCount}</span>
                      <span>Obs: {query.observerCount}</span>
                      <span>Size: {query.sizeKB} KB</span>
                      <span>
                        Age: {query.cacheAge}
                        {query.isStale && (
                          <span className="ml-2 text-xs text-yellow-600 font-semibold">
                            STALE
                          </span>
                        )}
                      </span>
                      {query.timeUntilExpiry && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {query.timeUntilExpiry}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => viewCacheEntry(query)}
                        className="h-7 w-7"
                        title="View details"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => markQueryStale(query.queryKey)}
                        className="h-7 w-7"
                        title="Mark query as stale (no refetch)"
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => invalidateQuery(query.queryKey)}
                        className="h-7 w-7"
                        title="Invalidate query (no refetch)"
                      >
                        <Recycle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => removeQuery(query.queryKey)}
                        className="h-7 w-7"
                        title="Remove query"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Cache Entry Detail Dialog */}
      <Dialog open={cacheDialogOpen} onOpenChange={setCacheDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Query Cache Entry Details</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {selectedCacheEntry && (
              <div className="space-y-md">
                {/* Search */}
                <div className="flex gap-xs items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search in data..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchTerm(e.target.value)
                      }
                      className="pl-9"
                    />
                  </div>
                  {searchTerm && selectedCacheEntry?.state.data
                    ? (() => {
                        const totalMatches = getTotalMatches(
                          selectedCacheEntry.state.data,
                          searchTerm
                        );

                        return totalMatches > 0 ? (
                          <div className="flex items-center gap-xs">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {currentMatchIndex + 1} / {totalMatches}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handlePrevMatch}
                              className="h-8 w-8"
                              title="Previous match"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handleNextMatch}
                              className="h-8 w-8"
                              title="Next match"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null;
                      })()
                    : null}
                </div>

                {/* Query Key */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Query Key:</h3>
                    <button
                      onClick={() =>
                        copyToClipboard(selectedCacheEntry.queryKey, 'queryKey')
                      }
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedField === 'queryKey' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-xs bg-muted p-xs rounded overflow-x-auto">
                    {selectedCacheEntry.queryKey}
                  </pre>
                </div>

                {/* Error Details */}
                {selectedCacheEntry.state.error && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm text-red-600">
                        Error Details:
                      </h3>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            formatErrorDetails(selectedCacheEntry.state.error),
                            'error'
                          )
                        }
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedField === 'error' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-xs bg-red-50 text-red-800 p-sm rounded overflow-x-auto max-h-60 border border-red-200 font-mono">
                      {highlightMatches(
                        formatErrorDetails(selectedCacheEntry.state.error),
                        searchTerm
                      )}
                    </div>
                  </div>
                )}

                {/* Cached Data */}
                {selectedCacheEntry.state.data !== undefined &&
                  selectedCacheEntry.state.data !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">Cached Data:</h3>
                        <div className="flex items-center gap-xs">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={expandAll}
                            className="h-7 text-xs"
                          >
                            <Maximize2 className="h-3 w-3 mr-1" />
                            Expand All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={collapseAll}
                            className="h-7 text-xs"
                          >
                            <Minimize2 className="h-3 w-3 mr-1" />
                            Collapse All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              selectedCacheEntry &&
                              markQueryStale(selectedCacheEntry.queryKey)
                            }
                            className="h-7 text-xs"
                            title="Mark this query as stale (no refetch)"
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Mark stale
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              selectedCacheEntry &&
                              invalidateQuery(selectedCacheEntry.queryKey, true)
                            }
                            className="h-7 text-xs"
                            title="Invalidate and refetch (may trigger network requests)"
                          >
                            <Recycle className="h-3 w-3 mr-1" />
                            Invalidate + refetch
                          </Button>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                JSON.stringify(
                                  selectedCacheEntry.state.data,
                                  null,
                                  2
                                ),
                                'data'
                              )
                            }
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedField === 'data' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div
                        id="data-scroll-container"
                        className="text-xs bg-muted p-sm rounded overflow-x-auto max-h-96 font-mono overflow-y-auto"
                      >
                        {(() => {
                          // Reset match counter before each render
                          matchCounter.current.current = 0;
                          matchRefs.current = [];
                          return (
                            <JsonNode
                              data={selectedCacheEntry.state.data}
                              path="root"
                              searchTerm={searchTerm}
                              expandedPaths={expandedPaths}
                              onToggle={togglePath}
                              matchRefs={matchRefs}
                              currentMatchIndex={currentMatchIndex}
                              matchCounter={matchCounter.current}
                              onCopy={(text) => copyToClipboard(text, 'value')}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
};
