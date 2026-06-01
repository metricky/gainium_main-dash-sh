import { logger } from '@/lib/loggerInstance';
import {
  isReady as isAnalyticsReady,
  pageview as analyticsPageview,
} from '@/lib/analytics';
import { useEffect, useRef } from 'react';

const ANALYTICS_PREFIX = 'BotAnalytics';

/**
 * Bot type mapping for analytics
 */
export type BotAnalyticsType =
  | 'grid'
  | 'dca'
  | 'combo'
  | 'hedge_dca'
  | 'hedge_combo';

/**
 * Determine bot type from pathname
 */
const getBotTypeFromPath = (pathname: string): BotAnalyticsType | null => {
  if (pathname.startsWith('/bot/view/') || pathname.startsWith('/bot/edit/')) {
    return 'dca';
  }

  if (
    pathname.startsWith('/grid/view/') ||
    pathname.startsWith('/grid/edit/')
  ) {
    return 'grid';
  }

  if (
    pathname.startsWith('/combo/view/') ||
    pathname.startsWith('/combo/edit/')
  ) {
    return 'combo';
  }

  if (
    pathname.startsWith('/hedge/bot/view/') ||
    pathname.startsWith('/hedge/bot/edit/')
  ) {
    return 'hedge_dca';
  }

  if (
    pathname.startsWith('/hedge/combo/view/') ||
    pathname.startsWith('/hedge/combo/edit/')
  ) {
    return 'hedge_combo';
  }

  return null;
};

/**
 * Extract bot ID from pathname
 */
const extractBotId = (pathname: string): string | null => {
  const patterns = [
    /^\/bot\/(view|edit)\/([^/]+)/,
    /^\/grid\/(view|edit)\/([^/]+)/,
    /^\/combo\/(view|edit)\/([^/]+)/,
    /^\/hedge\/bot\/(view|edit)\/([^/]+)/,
    /^\/hedge\/combo\/(view|edit)\/([^/]+)/,
  ];

  for (const pattern of patterns) {
    const match = pathname.match(pattern);
    if (match) {
      return match[2]; // Second capture group is the bot ID
    }
  }

  return null;
};

/**
 * Track bot view with normalized pageview and view_bot event
 */
export const trackBotView = (
  botId: string,
  botType: BotAnalyticsType,
  _pathname: string,
  _additionalProperties?: Record<string, unknown>
): void => {
  if (!isAnalyticsReady()) {
    return;
  }

  try {
    // Use the shared analytics pageview which handles debouncing and
    // path checking — keeps consistency with other pageview tracking.
    analyticsPageview();

    logger.debug(
      `[${ANALYTICS_PREFIX}] Pageview triggered for bot: ${botType} - ${botId}`
    );

    logger.debug(
      `[${ANALYTICS_PREFIX}] Bot view tracked: ${botType} - ${botId}`
    );
  } catch (error) {
    logger.error(`[${ANALYTICS_PREFIX}] Failed to track bot view:`, error);
  }
};

/**
 * Hook to automatically track bot views when a bot detail page is opened
 * @param botId - The bot ID (from URL params)
 * @param pathname - Current pathname from useLocation
 * @param additionalProperties - Optional properties (exchange, pair, status, etc.)
 */
export const useBotViewTracking = (
  botId: string | null | undefined,
  pathname: string,
  additionalProperties?: Record<string, unknown>
): void => {
  // Track the last bot ID to prevent duplicate tracking
  const lastTrackedBotId = useRef<string | null>(null);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Only track if we have a bot ID and it's different from the last tracked one
    if (
      !botId ||
      (botId === lastTrackedBotId.current &&
        pathname === lastTrackedPath.current)
    ) {
      return;
    }

    const botType = getBotTypeFromPath(pathname);
    const extractedBotId = extractBotId(pathname);

    // Only track if we can determine bot type and have a valid bot ID
    if (botType && extractedBotId === botId) {
      trackBotView(botId, botType, pathname, additionalProperties);
      lastTrackedBotId.current = botId;
      lastTrackedPath.current = pathname;
    }
  }, [botId, pathname, additionalProperties]);
};

/**
 * Manually track a bot view (for use in event handlers)
 */
export const useManualBotViewTracking = () => {
  return trackBotView;
};
