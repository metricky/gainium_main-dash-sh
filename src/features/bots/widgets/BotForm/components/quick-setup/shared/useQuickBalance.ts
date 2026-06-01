import { useMemo } from 'react';

import { useBotFormQuery } from '@/features/bots/widgets/BotForm/providers/BotFormQueryProvider';
import type { ExchangeInUser } from '@/types';

interface UseQuickBalanceArgs {
  currentExchange: ExchangeInUser | null;
  /** Asset the investment field is denominated in. For long DCA bots this is
   *  the quote asset (e.g. USDT); for shorts the orderSizeType flips to base,
   *  so the relevant balance is the base asset's. */
  asset: string;
}

interface UseQuickBalanceResult {
  /**
   * Effective balance the slider uses. Falls back to the exchange's
   * total USD balance when the asset entry is missing or zero.
   */
  availableBalance: number;
  /**
   * True when `availableBalance` came from `currentExchange.balance`
   * (the account total in USD) rather than the matched asset entry.
   * Lets the consumer label the trailing summary correctly.
   */
  usingExchangeTotal: boolean;
  /** Raw free balance of the requested asset from the balances list (0 if missing). */
  freeAssetBalance: number;
  /** Raw exchange total balance (0 if missing). */
  exchangeTotalBalance: number;
}

/**
 * Resolves the balance the investment slider should percentage off
 * for a quick-setup form. Prefers the free asset balance (what the
 * bot can actually deploy); falls back to the exchange's total
 * balance so the slider isn't stuck at 0% when the asset entry is
 * simply absent.
 */
export const useQuickBalance = ({
  currentExchange,
  asset,
}: UseQuickBalanceArgs): UseQuickBalanceResult => {
  const { balances } = useBotFormQuery();

  const freeAssetBalance = useMemo(() => {
    if (!asset || !balances) return 0;
    const match = balances.find((b) => b.asset === asset);
    if (!match) return 0;
    const value = Number(match.free);
    return Number.isFinite(value) ? value : 0;
  }, [balances, asset]);

  const exchangeTotalBalance = useMemo(() => {
    const value = Number(currentExchange?.balance);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [currentExchange?.balance]);

  const availableBalance =
    freeAssetBalance > 0 ? freeAssetBalance : exchangeTotalBalance;
  const usingExchangeTotal =
    availableBalance > 0 && freeAssetBalance <= 0 && exchangeTotalBalance > 0;

  return {
    availableBalance,
    usingExchangeTotal,
    freeAssetBalance,
    exchangeTotalBalance,
  };
};
