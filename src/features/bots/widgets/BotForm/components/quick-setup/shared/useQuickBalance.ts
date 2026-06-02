import { useMemo } from 'react';

import { useBalanceStore } from '@/stores/live/balanceStore';
import type { ExchangeInUser } from '@/types';

interface UseQuickBalanceArgs {
  currentExchange: ExchangeInUser | null;
  /** Asset the investment field is denominated in. For long DCA bots this is
   *  the quote asset (e.g. USDT); for shorts the orderSizeType flips to base,
   *  so the relevant balance is the base asset's. */
  asset: string;
}

interface UseQuickBalanceResult {
  /** Balance the slider percentages off — the real free balance of `asset`
   *  on the selected exchange (0 when the user holds none). */
  availableBalance: number;
  /** Raw free balance of the requested asset (alias of `availableBalance`). */
  freeAssetBalance: number;
}

/**
 * Resolves the free balance of the investment asset for a quick-setup form,
 * read from the live balance store (the same source the manual tab uses, kept
 * hydrated per-exchange by BotForm's `getBalances`). Scoped to the selected
 * exchange and the exact asset — a 0 is a real zero (the user holds none of
 * that asset) and is reported as 0. It never falls back to the exchange's
 * total USD balance: that figure is denominated in the account's settlement
 * asset, so showing it for a different quote asset (e.g. USDC when the account
 * holds USDT) is always wrong.
 */
export const useQuickBalance = ({
  currentExchange,
  asset,
}: UseQuickBalanceArgs): UseQuickBalanceResult => {
  const balances = useBalanceStore((state) => state.balances);
  const exchangeUUID = currentExchange?.uuid;

  const freeAssetBalance = useMemo(() => {
    if (!asset || !exchangeUUID) return 0;
    const wanted = asset.toUpperCase();
    const value = balances
      .filter(
        (b) =>
          b.exchangeUUID === exchangeUUID && b.asset?.toUpperCase() === wanted
      )
      .reduce((sum, b) => sum + (Number(b.free) || 0), 0);
    return Number.isFinite(value) ? value : 0;
  }, [balances, asset, exchangeUUID]);

  return {
    availableBalance: freeAssetBalance,
    freeAssetBalance,
  };
};
