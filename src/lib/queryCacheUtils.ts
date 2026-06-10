import logger from '@/lib/loggerInstance';
import { queryClient } from './queryClient';

// Write-through helpers over the singleton queryClient. After a local mutation
// the persisted RQ list caches still hold the pre-mutation response; on the
// next mount a hook replays it into the live store and resurrects the closed
// deal / stopped bot. Patching the cache here (paired with a tombstone) keeps
// the resurrection from happening even before the next refetch lands.
//
// Cache keys are arrays built by useCacheKey:
//   [baseKey, serializedVariables, userIdentifier, tradingContext?]
// We match purely on queryKey[0] (the baseKey) so every variant of a list
// (different filters / contexts) gets patched.

// Every React-Query-backed deal list baseKey that can replay a closed deal
// back into the store.
export const DEAL_LIST_QUERY_KEYS: string[] = [
  'dcaDealList', // useBotDeals.ts
  'comboDealList', // useComboDeals.ts
  'getBotDeals', // useBotSpecificDeals.ts (dca dealType)
  'getComboBotDeals', // useBotSpecificDeals.ts (combo dealType)
];

// Bot list baseKeys per bot type. Grid's real list key is 'botList'.
// 'dcaBotListTerminal' is included under dca so deleting/archiving a DCA bot
// also evicts it from the terminal list cache.
export const BOT_LIST_QUERY_KEYS_BY_TYPE: Record<
  'dca' | 'combo' | 'grid' | 'hedgeDca' | 'hedgeCombo',
  string[]
> = {
  dca: ['dcaBotList', 'dcaBotListTerminal'],
  combo: ['comboBotList'],
  grid: ['botList'],
  hedgeDca: ['hedgeDCABotList'],
  hedgeCombo: ['hedgeComboBotList'],
};

const matchesBase =
  (baseKeys: string[]) =>
  (q: { queryKey?: readonly unknown[] }): boolean =>
    baseKeys.includes(String(q.queryKey?.[0]));

// Cached list entries are loosely typed: the updater receives whatever shape
// the originating query stored. We only rely on `_id` for matching and the two
// container shapes below, so an item is just "something that may carry an _id".
type ListItem = { _id?: string } & Record<string, unknown>;

// ReturnResult<ListData> shape, plus the bare-array bot-list variant.
type ListCacheEntry = {
  data?:
    | { result?: ListItem[]; totalResults?: number } & Record<string, unknown>
    | ListItem[]
    | null;
} & Record<string, unknown>;

export function removeDealFromListCaches(
  dealId: string,
  baseKeys: string[]
): void {
  queryClient.setQueriesData(
    { predicate: matchesBase(baseKeys) },
    (prev?: ListCacheEntry) => {
      try {
        const data = prev?.data;
        if (!data || Array.isArray(data) || !Array.isArray(data.result)) {
          return prev;
        }
        const filtered = data.result.filter((item) => item?._id !== dealId);
        const removedCount = data.result.length - filtered.length;
        if (removedCount === 0) return prev;
        return {
          ...prev,
          data: {
            ...data,
            result: filtered,
            ...(typeof data.totalResults === 'number'
              ? {
                  totalResults: Math.max(0, data.totalResults - removedCount),
                }
              : {}),
          },
        };
      } catch (error) {
        logger.warn('[queryCacheUtils] removeDealFromListCaches failed', error);
        return prev;
      }
    }
  );
}

export function patchDealInListCaches(
  dealId: string,
  patch: object,
  baseKeys: string[]
): void {
  queryClient.setQueriesData(
    { predicate: matchesBase(baseKeys) },
    (prev?: ListCacheEntry) => {
      try {
        const data = prev?.data;
        if (!data || Array.isArray(data) || !Array.isArray(data.result)) {
          return prev;
        }
        let matched = false;
        const mapped = data.result.map((item) => {
          if (item?._id === dealId) {
            matched = true;
            return { ...item, ...patch };
          }
          return item;
        });
        if (!matched) return prev;
        return { ...prev, data: { ...data, result: mapped } };
      } catch (error) {
        logger.warn('[queryCacheUtils] patchDealInListCaches failed', error);
        return prev;
      }
    }
  );
}

export function removeBotFromListCaches(
  botId: string,
  baseKeys: string[]
): void {
  queryClient.setQueriesData(
    { predicate: matchesBase(baseKeys) },
    (prev?: ListCacheEntry) => {
      try {
        // Bot lists come in two shapes: { data: array } or { data: { result } }.
        const data = prev?.data;
        if (Array.isArray(data)) {
          const filtered = data.filter((b) => b?._id !== botId);
          if (filtered.length === data.length) return prev;
          return { ...prev, data: filtered };
        }
        if (data && Array.isArray(data.result)) {
          const filtered = data.result.filter((b) => b?._id !== botId);
          const removedCount = data.result.length - filtered.length;
          if (removedCount === 0) return prev;
          return {
            ...prev,
            data: {
              ...data,
              result: filtered,
              ...(typeof data.totalResults === 'number'
                ? {
                    totalResults: Math.max(0, data.totalResults - removedCount),
                  }
                : {}),
            },
          };
        }
        return prev;
      } catch (error) {
        logger.warn('[queryCacheUtils] removeBotFromListCaches failed', error);
        return prev;
      }
    }
  );
}

export function patchBotInListCaches(
  botId: string,
  patch: object,
  baseKeys: string[]
): void {
  queryClient.setQueriesData(
    { predicate: matchesBase(baseKeys) },
    (prev?: ListCacheEntry) => {
      try {
        const data = prev?.data;
        if (Array.isArray(data)) {
          let matched = false;
          const mapped = data.map((b) => {
            if (b?._id === botId) {
              matched = true;
              return { ...b, ...patch };
            }
            return b;
          });
          if (!matched) return prev;
          return { ...prev, data: mapped };
        }
        if (data && Array.isArray(data.result)) {
          let matched = false;
          const mapped = data.result.map((b) => {
            if (b?._id === botId) {
              matched = true;
              return { ...b, ...patch };
            }
            return b;
          });
          if (!matched) return prev;
          return { ...prev, data: { ...data, result: mapped } };
        }
        return prev;
      } catch (error) {
        logger.warn('[queryCacheUtils] patchBotInListCaches failed', error);
        return prev;
      }
    }
  );
}

export function invalidateListCaches(baseKeys: string[]): void {
  queryClient.invalidateQueries({ predicate: matchesBase(baseKeys) });
}
