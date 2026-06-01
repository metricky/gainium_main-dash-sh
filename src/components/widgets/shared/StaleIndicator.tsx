import logger from '@/lib/loggerInstance';
import { FIVE_MINUTES, queryClient } from '@/lib/queryClient';
import { useCacheStatusStore } from '@/stores/cacheStatusStore';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Tooltip } from '../../ui/tooltip';

interface StaleIndicatorProps {
  componentId: string;
  className?: string;
}

/**
 * StaleIndicator component that shows:
 * - A clock icon (or spinning indicator when data is being revalidated)
 * - The last updated timestamp in a tooltip
 *
 * Automatically tracks cache status via the cacheStatusStore
 */
export const StaleIndicator: React.FC<StaleIndicatorProps> = ({
  componentId,
  className = '',
}) => {
  const { getCacheStatus } = useCacheStatusStore();
  const [cacheStatus, setCacheStatus] = useState(getCacheStatus(componentId));
  const [isHovering, setIsHovering] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);

  // Subscribe to cache status updates
  useEffect(() => {
    const unsubscribe = useCacheStatusStore.subscribe((state) => {
      const status = state.cacheStatuses.get(componentId);
      setCacheStatus(status);
      setIsRevalidating(status?.isRevalidating ?? false);
    });

    return unsubscribe;
  }, [componentId]);

  // Force re-render every second to update relative time in tooltip
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!cacheStatus) {
    return null;
  }

  const { lastUpdated, queryKeys } = cacheStatus;

  // Check if data is stale (older than 5 minutes)
  const isStale = Date.now() - lastUpdated > FIVE_MINUTES;

  // Handle revalidation click
  const handleClick = () => {
    logger.info(
      `[StaleIndicator] Manually revalidating cache for ${componentId}`,
      {
        stale: isStale,
        queryKeys,
      }
    );

    // Get cache keys from store and invalidate them
    if (cacheStatus.queryKeys && cacheStatus.queryKeys.length > 0) {
      // We need to find the actual cache keys - this is a bit tricky since we only have query names
      // Get all queries and find matches by name
      const allQueries = queryClient.getQueryCache().getAll();
      const matchingQueries = allQueries.filter((q) =>
        cacheStatus.queryKeys.some((name) =>
          JSON.stringify(q.queryKey).includes(name)
        )
      );

      matchingQueries.forEach((q) => {
        queryClient.invalidateQueries({
          queryKey: q.queryKey,
          refetchType: 'active',
        });
      });
    }
  };

  // Format relative time
  const getRelativeTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Format absolute time
  const getAbsoluteTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const relativeTime = getRelativeTime(lastUpdated);
  const absoluteTime = getAbsoluteTime(lastUpdated);

  // Build tooltip content with proper line breaks
  const tooltipLines = [
    `Last updated: ${absoluteTime} (${relativeTime})`,
    isRevalidating ? 'Revalidating data...' : '',
    !isStale ? 'Click to manually revalidate' : 'Click to revalidate',
    queryKeys.length > 0 ? `Queries: ${queryKeys.join(', ')}` : '',
  ].filter(Boolean);

  const tooltipContent = tooltipLines.join('\n');

  // Determine which icon to show
  const getIcon = () => {
    if (isRevalidating) {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />;
    }
    if (isHovering) {
      return <Loader2 className="h-3.5 w-3.5 text-foreground" />;
    }
    if (isStale) {
      return <AlertCircle className="h-3.5 w-3.5 text-foreground" />;
    }
    return <Check className="h-3.5 w-3.5 text-foreground" />;
  };

  return (
    <Tooltip tooltip={tooltipContent} side="bottom">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`flex items-center self-center leading-none transition-colors hover:opacity-80 cursor-pointer ${className}`}
        title="Click to revalidate"
      >
        {getIcon()}
      </button>
    </Tooltip>
  );
};

export default StaleIndicator;
