import { useDealStore, type DealType, type DealWithType } from '@/stores/live';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { botQueries } from '../lib/api/GraphQLQueries-bot-queries';
import type { ReturnResult } from '../lib/api/types';
import { logger } from '../lib/loggerInstance';
import type {
  DCADeals,
  DCADealStatusEnum,
  GridFilterModel,
  GridSortModel,
} from '../types';
import { useGraphQL, type FetchStamped } from './useGraphQL';
import { useShareContext } from './useShareContext';

// Filter interface for getBotDeals
interface BotDealsFilter {
  botId: string;
  status: DCADealStatusEnum;
  shareId?: string;
  page?: number;
  pageSize?: number;
  sortModel?: GridSortModel;
  filterModel?: GridFilterModel;
  dealType: DealType; // Type of deal: 'dca', 'combo', or 'terminal'
}

// Interface for getBotDeals response
interface GetBotDealsResponse {
  status: string;
  reason?: string;
  data: {
    deals: DCADeals[];
    page: number;
    total: number;
  };
}

export interface UseBotSpecificDealsResult {
  data: ReturnResult<GetBotDealsResponse> | null;
  deals: DealWithType[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

// The status group this hook actually requests from the backend. NOTE: it puts
// `error` in the CLOSED group, which differs from dealStatusFilter.ts's
// OPEN_GROUP (open/start/error). The reconcile scope must match exactly the set
// this hook fetched — otherwise an open fetch would absence-delete `error`
// deals it never requested. So we keep this hook's own grouping, deliberately
// NOT dealStatusGroup().
const requestedStatusGroup = (status: DCADealStatusEnum): string[] =>
  status === 'open' ? ['open', 'start'] : ['closed', 'canceled', 'error'];

export function useBotSpecificDeals(
  filter: BotDealsFilter
): UseBotSpecificDealsResult {
  const dealType = useMemo(() => filter.dealType || 'dca', [filter.dealType]); // Default to 'dca' for backward compatibility

  // Auto-loading pagination state
  const [currentPageLoading, setCurrentPageLoading] = useState(0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([0]));
  const maxPages = 5;

  // Snapshot of the last completed fetch for the current (botId, status).
  // The shared deal store is the source of live updates, but it is also
  // overwritten by the list page's `useDcaDeals` (which fetches open-only with
  // replace=true) and by the cancellable debounced write below. The list page
  // re-writes open deals for us, so the Active tab survives — but Closed deals
  // have no other writer, so a clobber/cancel leaves the Closed tab empty.
  // Returning this snapshot (merged with the store) makes the result robust.
  const [committedDeals, setCommittedDeals] = useState<DCADeals[]>([]);

  // 1. Read from Zustand store (instant, filtered by botId and status)
  const allDealsRecord = useDealStore((state) => state.deals);
  const hasHydrated = useDealStore((state) => state._hasHydrated);
  // Convert to array based on filter (memoized)
  const dealsFromStore = useMemo(() => {
    const botDeals = Object.values(allDealsRecord[filter.botId] ?? {}) || [];
    // Filter by dealType and status
    return botDeals.filter(
      (d) =>
        d.dealType === dealType &&
        (filter.status === 'open'
          ? d.status === 'open' || d.status === 'start'
          : d.status === 'closed' ||
            d.status === 'canceled' ||
            d.status === 'error')
    );
  }, [allDealsRecord, filter.botId, filter.status, dealType]);
  // Pick up share id from URL when caller didn't pass one explicitly.
  const { shareId: ctxShareId } = useShareContext();
  const effectiveShareId = filter.shareId ?? ctxShareId ?? undefined;

  // Prepare input for getBotDeals query
  const input = useMemo(
    () => ({
      id: filter.botId,
      status: filter.status,
      page: currentPageLoading,
      pageSize: filter.pageSize || 100,
      sortModel: filter.sortModel || [],
      filterModel: filter.filterModel || { items: [] },
      ...(effectiveShareId && { shareId: effectiveShareId }),
    }),
    [
      filter.botId,
      filter.status,
      currentPageLoading,
      filter.pageSize,
      filter.sortModel,
      filter.filterModel,
      effectiveShareId,
    ]
  );

  // Get the query and variables from botQueries
  const q = useMemo(
    () =>
      filter.dealType === 'combo'
        ? botQueries.getComboBotDeals
        : botQueries.getBotDeals,
    [filter.dealType]
  );
  const { query, variables } = q(input);
  const key = useMemo(
    () => (filter.dealType === 'combo' ? 'getComboBotDeals' : 'getBotDeals'),
    [filter.dealType]
  );
  // Use the GraphQL hook
  const queryResult = useGraphQL<GetBotDealsResponse>(
    key,
    {
      query,
      variables,
    },
    {
      shareId: effectiveShareId ?? null,
    }
  );

  const [intermediateDeals, setIntermediateDeals] = useState<DCADeals[]>([]);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  // Update store when query succeeds and handle sequential auto-loading
  useEffect(() => {
    if (queryResult.data && queryResult.data.status === 'OK') {
      const response = queryResult.data as unknown as GetBotDealsResponse;
      const apiDeals = response.data?.deals || [];
      const total = response.data?.total || 0;
      const pageSize = filter.pageSize || 100;

      setIntermediateDeals((prev) => [
        ...new Map([...prev, ...apiDeals].map((d) => [d._id, d])).values(),
      ]); // Deduplicate by _id

      // Check if we should load more pages (only if query is not loading to ensure sequential loading)
      const shouldContinueLoading =
        !queryResult.isLoading && // Wait for current query to finish
        currentPageLoading < maxPages - 1 && // Haven't reached max pages
        apiDeals.length === pageSize && // Current page is full
        (currentPageLoading + 1) * pageSize < total; // More data available

      if (shouldContinueLoading) {
        const nextPage = currentPageLoading + 1;
        if (!loadedPages.has(nextPage)) {
          setLoadedPages((prev) => new Set([...prev, nextPage]));

          // Add a small delay to ensure sequential loading and prevent race conditions
          setTimeout(() => {
            setCurrentPageLoading(nextPage);
          }, 100);
        }
      } else {
        // All pages loaded - mark loading as complete
        setIsLoadingComplete(true);
      }
    }
  }, [
    queryResult.data,
    queryResult.isLoading,
    dealType,
    currentPageLoading,
    loadedPages,
    filter.pageSize,
    filter,
  ]);

  // Debounced store update - only update when loading is complete
  useEffect(() => {
    if (isLoadingComplete) {
      if (intermediateDeals.length > 0) {
        // Capture the fetched deals immediately so the returned value survives
        // even if the debounced store write below is cancelled or clobbered.
        setCommittedDeals(intermediateDeals);
        // Use a debounce timeout to prevent rapid updates
        const timeoutId = setTimeout(() => {
          // Single authoritative reconcile for this bot's requested-status
          // scope: snapshot wins, in-scope deals absent from it AND older
          // than the snapshot's network fetch stamp are pruned (subsumes the
          // old removeDeal stale-id loop), per-deal arbitration + tombstones
          // run inside. The stamp keeps a cache-replayed page from deleting
          // deals that arrived (e.g. via websocket) after it was fetched.
          useDealStore.getState().reconcileDeals(
            {
              dealType,
              statuses: requestedStatusGroup(filter.status),
              botId: filter.botId,
              snapshotAt: (queryResult.data as FetchStamped | null)
                ?.__fetchedAt,
            },
            { [filter.botId]: intermediateDeals }
          );
          logger.info(
            `[useBotSpecificDeals] Updated store with ${intermediateDeals.length} ${dealType} deals for bot ${filter.botId}`
          );
          setIntermediateDeals([]); // Clear intermediate deals after updating
          setIsLoadingComplete(false);
        }, 50); // 50ms debounce

        return () => clearTimeout(timeoutId);
      } else {
        // Fetch completed with no deals for this status — drop the snapshot so
        // a previous status's results don't linger, then reconcile with an
        // empty snapshot so the absence-delete prunes this bot's in-scope
        // deals (snapshot-stamped for the same cache-replay reason as above).
        setCommittedDeals([]);
        useDealStore.getState().reconcileDeals(
          {
            dealType,
            statuses: requestedStatusGroup(filter.status),
            botId: filter.botId,
            snapshotAt: (queryResult.data as FetchStamped | null)?.__fetchedAt,
          },
          { [filter.botId]: [] }
        );
        setIsLoadingComplete(false);
      }
    }
    return undefined;
  }, [
    isLoadingComplete,
    intermediateDeals,
    filter.botId,
    dealType,
    filter.status,
    queryResult.data,
  ]);

  // Log errors
  if (queryResult.error) {
    logger.error(
      '[useBotSpecificDeals] Query error:',
      queryResult.error.message
    );
  }

  // Get total from API response (for pagination)
  const apiTotal = useMemo(() => {
    if (queryResult.data && queryResult.data.status === 'OK') {
      const response = queryResult.data as unknown as GetBotDealsResponse;
      return response.data?.total || 0;
    }
    return 0;
  }, [queryResult.data]);

  // Reset pagination state when filter changes
  useEffect(() => {
    setCurrentPageLoading(0);
    setLoadedPages(new Set([0]));
    setIntermediateDeals([]); // Clear accumulated deals
    setCommittedDeals([]); // Drop the previous status's snapshot
    setIsLoadingComplete(false); // Reset loading completion state
  }, [filter.botId, filter.status, filter.dealType, filter.shareId]);

  // Merge the live store with the last-fetched snapshot, deduped by id. The
  // store wins on conflict so active deals keep their live updates; the
  // snapshot backfills any deals the store dropped (e.g. closed deals wiped by
  // the list page's open-only replace). Re-filter by the requested status so a
  // stale snapshot entry can't leak into the wrong tab.
  const matchesRequestedStatus = useCallback(
    (status: string) =>
      filter.status === 'open'
        ? status === 'open' || status === 'start'
        : status === 'closed' ||
          status === 'canceled' ||
          status === 'error',
    [filter.status]
  );
  const mergedDeals = useMemo(() => {
    // Ids the store currently tracks for this bot, regardless of status. The
    // snapshot may only backfill deals the store has *fully dropped* (e.g.
    // closed deals wiped by the list page's open-only replace) — it must never
    // resurrect a stale-status copy of a deal the store still tracks (e.g. one
    // just optimistically marked closed/canceled on close), or that deal would
    // linger in the Active tab after being closed.
    const storeIds = new Set(
      Object.values(allDealsRecord[filter.botId] ?? {}).map((d) => d._id)
    );
    const byId = new Map<string, DealWithType>();
    committedDeals.forEach((d) => {
      if (d._id && !storeIds.has(d._id)) {
        byId.set(d._id, { ...d, dealType } as DealWithType);
      }
    });
    dealsFromStore.forEach((d) => {
      if (d._id) byId.set(d._id, d);
    });
    return Array.from(byId.values()).filter(
      (d) => d.dealType === dealType && matchesRequestedStatus(d.status)
    );
  }, [
    committedDeals,
    dealsFromStore,
    allDealsRecord,
    filter.botId,
    dealType,
    matchesRequestedStatus,
  ]);

  // Only show loading on initial load (when store data is empty) or during
  // auto-loading. Also treat pre-hydration as loading so the table doesn't
  // flash empty during the IDB read window on hard refresh / HMR.
  const isInitialLoad = useMemo(
    () => !hasHydrated || (mergedDeals.length === 0 && queryResult.isLoading),
    [hasHydrated, queryResult.isLoading, mergedDeals.length]
  );

  return {
    data: queryResult.data as ReturnResult<GetBotDealsResponse> | null,
    deals: mergedDeals,
    total: apiTotal || mergedDeals.length,
    isLoading: isInitialLoad,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
