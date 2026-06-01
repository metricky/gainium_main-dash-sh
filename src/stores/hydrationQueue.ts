/**
 * HydrationQueue — serializes IndexedDB hydration of the heavy persisted
 * Zustand stores (dca/combo/grid/hedge bots, transactions, deals, orders,
 * minigrids) so their startup memory spikes don't overlap.
 *
 * Why this exists:
 *   IndexedDB returns each persisted record as a single structured-cloned
 *   object. For a heavy-trading user, one store's blob can be tens of MB.
 *   When all 8 live stores hydrate in parallel on page load — which is the
 *   default Zustand behavior — peak heap is roughly the SUM of those
 *   clones held simultaneously. On Windows Chrome (smaller per-tab heap
 *   budget than macOS) this can push the tab past the OOM threshold.
 *
 * What it does:
 *   - Wraps each `getItem` call so it runs strictly after the previous
 *     one completes — peak heap becomes roughly the MAX of one clone,
 *     not the sum.
 *   - Yields to `requestIdleCallback` between hydrations so the V8 GC
 *     gets a chance to reclaim intermediate structures before the next
 *     parse/clone fires.
 *
 * Trade-offs:
 *   - First paint that depends on a later-in-queue store waits a bit
 *     longer. Acceptable because the alternative is an OOM crash.
 *   - The queue is FIFO; hydration order matches store-import order.
 *     If a specific store needs priority, we can add a `prepend()`
 *     option later — not needed today.
 */
import logger from '@/lib/loggerInstance';

type Job<T> = () => Promise<T>;

const yieldToIdle = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      setTimeout(resolve, 0);
    }
  });

class HydrationQueue {
  private chain: Promise<unknown> = Promise.resolve();
  private depth = 0;

  enqueue<T>(label: string, job: Job<T>): Promise<T> {
    this.depth += 1;
    const startedAt = performance.now();
    const next = this.chain.then(async () => {
      const queuedFor = performance.now() - startedAt;
      logger.debug(
        `[HydrationQueue] start "${label}" (waited ${queuedFor.toFixed(0)}ms, depth=${this.depth})`
      );
      try {
        const result = await job();
        const elapsed = performance.now() - startedAt - queuedFor;
        logger.debug(
          `[HydrationQueue] done "${label}" in ${elapsed.toFixed(0)}ms`
        );
        // Yield so V8 GC can reclaim the previous clone's intermediate
        // structures before the next store's clone fires.
        await yieldToIdle();
        return result;
      } finally {
        this.depth -= 1;
      }
    });
    // Never let a rejection break the chain — subsequent stores must
    // still get their turn even if one fails to hydrate.
    this.chain = next.catch(() => undefined);
    return next;
  }
}

export const liveStoreHydrationQueue = new HydrationQueue();
