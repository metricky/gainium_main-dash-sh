import { StrategyEnum } from '@/types';
import type { BotFormData } from '@/types/bots/form';

export interface AggregatedBalanceSnapshot {
  free: number;
  total: number;
  usd: number;
}

export interface BaseOrderContextParams {
  currencyReference: BotFormData['dca']['orderSizeType'];
  strategy: BotFormData['dca']['strategy'];
  aggregatedBalances: {
    base: AggregatedBalanceSnapshot;
    quote: AggregatedBalanceSnapshot;
  };
  baseAsset?: string;
  quoteAsset?: string;
  latestPrice?: number;
  futures: boolean;
  coinm: boolean;
}

export interface BaseOrderContextResult {
  currencyLabel: string;
  availableBalance: number;
  balanceCurrency: string; // ALWAYS quote for long, ALWAYS base for short
  balanceAmount: number; // The actual balance to display
}

const safeNumber = (value: number | undefined) =>
  Number.isFinite(value) ? Number(value) : 0;

export const resolveBaseOrderContext = (
  params: BaseOrderContextParams
): BaseOrderContextResult => {
  const {
    currencyReference,
    strategy,
    aggregatedBalances,
    baseAsset,
    quoteAsset,
    latestPrice,
    futures,
    coinm,
  } = params;

  const normalizedReference = futures
    ? coinm
      ? 'base'
      : 'quote'
    : (currencyReference ?? 'quote');
  const normalizedDirection = strategy ?? StrategyEnum.long;

  const baseSnapshot = aggregatedBalances.base;
  const quoteSnapshot = aggregatedBalances.quote;

  // Balance display: ALWAYS quote for long, ALWAYS base for short
  // This doesn't change regardless of currencyReference
  const isShort = normalizedDirection === StrategyEnum.short;
  const balanceCurrency = futures
    ? coinm
      ? (baseAsset ?? 'BASE')
      : (quoteAsset ?? 'QUOTE')
    : isShort
      ? (baseAsset ?? 'BASE')
      : (quoteAsset ?? 'QUOTE');
  const balanceSnapshot = futures
    ? coinm
      ? baseSnapshot
      : quoteSnapshot
    : isShort
      ? baseSnapshot
      : quoteSnapshot;
  const balanceAmount = safeNumber(balanceSnapshot.free);

  // The deposit side is what the bot actually spends: quote for a long
  // (buying base with quote), base for a short. The order size, however, is
  // entered in `currencyReference` units. To validate "value exceeds the
  // available balance" the available figure must be expressed in the SAME
  // unit as the entered value — otherwise a long bot priced in base wrongly
  // checks the (empty) base wallet instead of the quote it will spend.
  const depositIsBase = futures ? coinm : isShort;
  const price = safeNumber(latestPrice);
  // Available balance, converted from the deposit currency into the reference
  // currency. When the reference matches the deposit side, no conversion. When
  // price is unknown (no pair selected yet) we fall back to the raw deposit
  // amount, which errs toward NOT raising a false "exceeds balance" error.
  const availableInReference = (referenceIsBase: boolean): number => {
    if (referenceIsBase === depositIsBase) {
      return balanceAmount;
    }
    if (!price || price <= 0) {
      return balanceAmount;
    }
    // deposit quote → reference base: divide by price (max base affordable)
    // deposit base → reference quote: multiply by price
    return referenceIsBase ? balanceAmount / price : balanceAmount * price;
  };

  switch (normalizedReference) {
    case 'base': {
      return {
        currencyLabel: baseAsset ?? 'BASE',
        availableBalance: availableInReference(true),
        balanceCurrency,
        balanceAmount,
      };
    }
    case 'quote': {
      return {
        currencyLabel: quoteAsset ?? 'QUOTE',
        availableBalance: availableInReference(false),
        balanceCurrency,
        balanceAmount,
      };
    }
    case 'usd': {
      const snapshot = isShort ? baseSnapshot : quoteSnapshot;

      let available = safeNumber(snapshot.usd);
      if (available <= 0) {
        const freeAmount = safeNumber(snapshot.free);
        if (isShort) {
          available = latestPrice ? freeAmount * latestPrice : freeAmount;
        } else {
          available = freeAmount;
        }
      }

      return {
        currencyLabel: 'USD',
        availableBalance: safeNumber(available),
        balanceCurrency,
        balanceAmount,
      };
    }
    case 'percFree':
    case 'percTotal': {
      return {
        currencyLabel: '%',
        availableBalance: 100,
        balanceCurrency,
        balanceAmount,
      };
    }
    default: {
      return {
        currencyLabel: quoteAsset ?? 'QUOTE',
        availableBalance: safeNumber(quoteSnapshot.free),
        balanceCurrency,
        balanceAmount,
      };
    }
  }
};
