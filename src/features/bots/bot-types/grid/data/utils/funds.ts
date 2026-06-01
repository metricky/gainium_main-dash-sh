import type { GridBot } from '@/types/gridBot';
import { round } from '@/utils/bots/grid/math';
import type {
  GridCurrency,
  GridFundsSnapshot,
  GridFundsSnapshotEntry,
} from '@/types/bots/grid/data';

const combineBalances = (
  base: number,
  quote: number,
  lastPrice: number
): { base: number; quote: number } => {
  const quoteFromBase = lastPrice > 0 ? base * lastPrice : 0;
  return {
    base: base + (lastPrice > 0 ? quote / lastPrice : 0),
    quote: quote + quoteFromBase,
  };
};

const valueInCurrency = (
  baseAmount: number,
  quoteAmount: number,
  lastPrice: number,
  usdRate: number,
  currency: GridCurrency
): number => {
  switch (currency) {
    case 'base':
      return round(
        baseAmount + (lastPrice > 0 ? quoteAmount / lastPrice : 0),
        6
      );
    case 'quote':
      return round(quoteAmount + baseAmount * lastPrice, 6);
    case 'usd':
    default: {
      const totalQuote = quoteAmount + baseAmount * lastPrice;
      return round(totalQuote * usdRate, 2);
    }
  }
};

const buildEntry = (
  label: string,
  baseAmount: number,
  quoteAmount: number,
  lastPrice: number,
  usdRate: number,
  currency: GridCurrency,
  changeSource?: { base: number; quote: number }
): GridFundsSnapshotEntry => {
  const value = valueInCurrency(
    baseAmount,
    quoteAmount,
    lastPrice,
    usdRate,
    currency
  );
  let change: number | undefined;
  let changePercent: number | undefined;

  if (changeSource) {
    const initialValue = valueInCurrency(
      changeSource.base,
      changeSource.quote,
      lastPrice,
      usdRate,
      currency
    );
    change = round(value - initialValue, currency === 'usd' ? 2 : 6);
    changePercent =
      initialValue !== 0 ? round((change / initialValue) * 100, 2) : undefined;
  }

  const entry: GridFundsSnapshotEntry = { label, value };

  if (typeof change === 'number') {
    entry.change = change;
  }

  if (typeof changePercent === 'number') {
    entry.changePercent = changePercent;
  }

  return entry;
};

export const buildFundsSnapshot = (
  bot: GridBot,
  currency: GridCurrency
): GridFundsSnapshot => {
  const baseAsset =
    bot.symbol?.baseAsset ?? bot.settings?.pair?.split('/')[0] ?? 'BASE';
  const quoteAsset =
    bot.symbol?.quoteAsset ?? bot.settings?.pair?.split('/')[1] ?? 'QUOTE';
  const usdRate = bot.usdRate ?? 1;
  const lastPrice = bot.lastPrice ?? bot.initialPrice ?? 0;

  const usedBase = bot.assets?.used?.base ?? 0;
  const usedQuote = bot.assets?.used?.quote ?? 0;
  const currentBase = bot.currentBalances?.base ?? 0;
  const currentQuote = bot.currentBalances?.quote ?? 0;
  const initialBase = bot.initialBalances?.base ?? 0;
  const initialQuote = bot.initialBalances?.quote ?? 0;

  const currentTotals = combineBalances(currentBase, currentQuote, lastPrice);
  const initialTotals = combineBalances(initialBase, initialQuote, lastPrice);

  const investedTotals = combineBalances(usedBase, usedQuote, lastPrice);
  const investedEntry = buildEntry(
    'Invested',
    usedBase,
    usedQuote,
    lastPrice,
    usdRate,
    currency,
    initialTotals
  );

  const freeBase = Math.max(currentBase - usedBase, 0);
  const freeQuote = Math.max(currentQuote - usedQuote, 0);
  const freeEntry = buildEntry(
    'Free',
    freeBase,
    freeQuote,
    lastPrice,
    usdRate,
    currency
  );
  const totalEntry = buildEntry(
    'Total',
    currentTotals.base,
    currentTotals.quote,
    lastPrice,
    usdRate,
    currency,
    initialTotals
  );

  const botProfitTotal = bot.profit?.total ?? 0;
  const botProfitUsd = bot.profit?.totalUsd ?? botProfitTotal * usdRate;
  const botProfitEntry = buildEntry(
    'Bot Profit',
    currency === 'base' ? botProfitTotal : 0,
    currency === 'quote' ? botProfitTotal : botProfitUsd,
    lastPrice,
    usdRate,
    currency
  );

  const breakEvenPrice =
    investedTotals.base > 0
      ? round(investedTotals.quote / investedTotals.base, 6)
      : undefined;

  const initialInvestedEntry = buildEntry(
    'Initial Invested',
    initialTotals.base,
    initialTotals.quote,
    lastPrice,
    usdRate,
    currency
  );

  const initialBaseEntry: GridFundsSnapshotEntry = {
    label: baseAsset,
    value: round(initialBase, 6),
  };

  const initialQuoteEntry: GridFundsSnapshotEntry = {
    label: quoteAsset,
    value: round(initialQuote, 6),
  };

  const initialUsdEntry: GridFundsSnapshotEntry = {
    label: 'USD',
    value: round(initialTotals.quote * usdRate, 2),
  };

  let futures: GridFundsSnapshot['futures'];
  if (bot.settings?.futures) {
    futures = {
      notionalValue: round(currentTotals.quote * usdRate, 2),
      pnl: botProfitEntry,
    };

    const leverage = (bot.settings as { leverage?: number }).leverage;
    if (typeof leverage === 'number') {
      futures.leverage = leverage;
    }
  }

  const current: GridFundsSnapshot['current'] = {
    invested: investedEntry,
    free: freeEntry,
    total: totalEntry,
    botProfit: botProfitEntry,
  };

  if (typeof breakEvenPrice === 'number') {
    current.breakEvenPrice = breakEvenPrice;
  }

  return {
    activeCurrency: currency,
    baseAsset,
    quoteAsset,
    usdRate,
    lastPrice,
    current,
    initial: {
      invested: initialInvestedEntry,
      base: initialBaseEntry,
      quote: initialQuoteEntry,
      usd: initialUsdEntry,
    },
    ...(futures ? { futures } : {}),
  };
};

export const changeCurrency = (
  snapshot: GridFundsSnapshot,
  currency: GridCurrency
): GridFundsSnapshot => {
  if (snapshot.activeCurrency === currency) {
    return snapshot;
  }

  const { usdRate, lastPrice } = snapshot;

  const rebuild = (entry: GridFundsSnapshotEntry): GridFundsSnapshotEntry => {
    // entries store value already in original currency, so we need to recompute from base/quote data
    // We cannot recover original base/quote from entry; rely on change data preserved earlier is not possible.
    // For now, return same entry with value converted using ratios where possible.
    const value = entry.value;
    if (snapshot.activeCurrency === 'usd') {
      if (currency === 'quote') {
        return { ...entry, value: round(value / usdRate, 6) };
      }
      if (currency === 'base') {
        return {
          ...entry,
          value: lastPrice > 0 ? round(value / usdRate / lastPrice, 6) : 0,
        };
      }
    }
    if (snapshot.activeCurrency === 'quote' && currency === 'usd') {
      return { ...entry, value: round(value * usdRate, 2) };
    }
    if (snapshot.activeCurrency === 'quote' && currency === 'base') {
      return {
        ...entry,
        value: lastPrice > 0 ? round(value / lastPrice, 6) : 0,
      };
    }
    if (snapshot.activeCurrency === 'base' && currency === 'quote') {
      return { ...entry, value: round(value * lastPrice, 6) };
    }
    if (snapshot.activeCurrency === 'base' && currency === 'usd') {
      return { ...entry, value: round(value * lastPrice * usdRate, 2) };
    }
    return entry;
  };

  return {
    ...snapshot,
    activeCurrency: currency,
    current: {
      invested: rebuild(snapshot.current.invested),
      free: rebuild(snapshot.current.free),
      total: rebuild(snapshot.current.total),
      botProfit: rebuild(snapshot.current.botProfit),
      ...(typeof snapshot.current.breakEvenPrice === 'number'
        ? { breakEvenPrice: snapshot.current.breakEvenPrice }
        : {}),
    },
    initial: {
      invested: rebuild(snapshot.initial.invested),
      base: snapshot.initial.base,
      quote: snapshot.initial.quote,
      usd: snapshot.initial.usd,
    },
  };
};
