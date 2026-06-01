import { QueryClient } from '@tanstack/react-query';
import {
  type PersistedClient,
  type Persister,
} from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
// import { logger } from './loggerInstance';

// Mock logger to replace removed logger calls
const logger = {
  debug: (..._args: unknown[]) => {},
  info: (..._args: unknown[]) => {},
  warn: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
};

// Cache duration constants
const FIVE_SECONDS = 1000 * 5;
const FIFTEEN_SECONDS = 1000 * 15;
const THIRTY_SECONDS = 1000 * 30;
const ONE_MINUTE = 1000 * 60;
const FIVE_MINUTES = 1000 * 60 * 5;
const ONE_HOUR = 1000 * 60 * 60;
const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

// ⚠️ IMPORTANT: This is a TRADING PLATFORM
// Data like bots, orders, deals, balances, statuses change FREQUENTLY
// Pattern: Show cache immediately on component mount, refetch if stale
// No continuous polling - only fetch when user navigates to a view

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // SHORT stale time: data becomes stale quickly in trading context
      // When component mounts, if data is stale, trigger refetch
      staleTime: FIFTEEN_SECONDS,

      // Keep in memory for 5 minutes max to avoid excessive memory usage
      gcTime: TWENTY_FOUR_HOURS,

      // Retry logic for failed requests
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        if (error && 'status' in error && error.status === 401) return false;
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on component mount if data is stale (don't poll in background)
      refetchOnWindowFocus: false, // User switching tabs doesn't trigger refetch
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // KEY: Refetch when component mounts if stale

      // No background polling - only fetch when needed
      refetchInterval: false,

      // Show cached data immediately while fetching fresh data (best UX)
      placeholderData: (previousData: unknown) => previousData,
    },
  },
});

// Helper function to deeply remove non-serializable values
function makeSerializable(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Promise) return undefined;
  if (typeof obj === 'function') return undefined;
  if (obj instanceof Error) return { message: obj.message, name: obj.name };

  if (Array.isArray(obj)) {
    return obj.map(makeSerializable);
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleaned = makeSerializable(value);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result;
  }

  return obj;
}

// Create IndexedDB persister using idb-keyval
export const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      // Deep clean the client data to remove any non-serializable content
      const cleanedClient = makeSerializable(client) as PersistedClient;

      // Store the cleaned client data
      await set('reactQuery', cleanedClient);
    } catch (error) {
      console.warn('Failed to persist query client:', error);
    }
  },
  restoreClient: async () => {
    try {
      const client = await get<PersistedClient>('reactQuery');

      // Check if the cached data is too old (older than 5 minutes)
      // For trading platform, don't rely on old cached data from previous sessions
      if (
        client &&
        client.timestamp &&
        Date.now() - client.timestamp > FIVE_MINUTES
      ) {
        logger.info('Persisted cache expired, clearing old data');
        await del('reactQuery');
        return undefined;
      }

      return client;
    } catch (error) {
      console.warn('Failed to restore query client:', error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      await del('reactQuery');
    } catch (error) {
      console.warn('Failed to remove query client:', error);
    }
  },
};

export { FIVE_MINUTES, FIVE_SECONDS, ONE_HOUR, ONE_MINUTE, THIRTY_SECONDS };
