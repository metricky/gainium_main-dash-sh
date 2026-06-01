/**
 * Subscribes to live prices the same way the Trading bots / Combo bots
 * pages do (`getLatestPrices` with the same throttle gate) and computes
 * each hedge bot's unrealized PnL via `computeHedgeUnPnl`. Returns a
 * `Map<botId, HedgeUnPnlResult>` so list views can read the value per
 * row without recomputing on every render. Re-runs whenever the bots
 * list changes or a price update is accepted.
 *
 * Lives next to `computeHedgeUnPnl` rather than under `src/hooks/` to
 * keep all the hedge unrealized-PnL plumbing in one place.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import getLatestPrices, { getLocalPrices } from '@/helper/price';
import { useExchangesFromContext } from '@/contexts/ExchangeDataContext';
import type { AllFees, HedgeBot, Prices } from '@/types';
import {
  computeHedgeUnPnl,
  type HedgeUnPnlResult,
} from './computeHedgeUnPnl';

const PRICE_UPDATE_THROTTLE_MS = 10_000;
const EMPTY_FEES: AllFees = [];

export function useHedgeUnPnlMap(
  bots: HedgeBot[],
  isCombo: boolean
): Map<string, HedgeUnPnlResult> {
  const [prices, setPrices] = useState<Prices>(() => getLocalPrices());
  const lastUpdateRef = useRef(0);
  const lastAcceptedLengthRef = useRef(0);

  useEffect(() => {
    const unsubscribe = getLatestPrices((result) => {
      if (result.status !== 'OK' || !result.data) return;
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;
      // Accept when our snapshot is empty or the new payload is
      // materially larger; otherwise throttle. Mirrors the gate used on
      // the standalone bot list pages so the unPnL formula gets a real
      // tickers payload promptly after mount.
      const bypassThrottle =
        result.data.length > 0 &&
        (lastAcceptedLengthRef.current === 0 ||
          result.data.length > lastAcceptedLengthRef.current * 1.1);
      if (bypassThrottle || elapsed > PRICE_UPDATE_THROTTLE_MS) {
        setPrices(result.data);
        lastUpdateRef.current = now;
        lastAcceptedLengthRef.current = result.data.length;
      }
    }, false);
    return () => {
      unsubscribe();
    };
  }, []);

  const { data: exchangesData } = useExchangesFromContext();
  const exchanges = exchangesData?.data?.exchanges;

  return useMemo(() => {
    const map = new Map<string, HedgeUnPnlResult>();
    for (const bot of bots) {
      map.set(
        bot._id,
        computeHedgeUnPnl(bot, prices, EMPTY_FEES, isCombo, exchanges)
      );
    }
    return map;
  }, [bots, prices, isCombo, exchanges]);
}
