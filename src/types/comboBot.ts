// Types for real Combo Bot data from GraphQL API
import { logger } from '@/lib/loggerInstance';
import {
  calculateDealOuterGaugePercentage,
  calculatePnlPercentage,
} from '@/lib/utils/tradingMetrics';
import { extractPairAssets } from '@/utils/pairs';

export interface ComboBotSymbol {
  key: string;
  value: {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
  };
}

export interface ComboBotSettings {
  name: string;
  pair: string[];
  strategy: string;
  type: string;
  futures: boolean;
  coinm: boolean;
}

export interface ComboBotProfit {
  totalUsd: number;
}

export interface ComboBotDeals {
  active: number;
  all: number;
}

export interface ComboBotWorkingShift {
  start: number;
  end?: number;
}

export interface ComboBotAssets {
  used: {
    base: Array<{ key: string; value: number }>;
    quote: Array<{ key: string; value: number }>;
  };
  required: {
    base: Array<{ key: string; value: number }>;
    quote: Array<{ key: string; value: number }>;
  };
}

export interface ComboBotUsage {
  current: {
    base: number;
    quote: number;
  };
  currentUsd?: number; // Add this field for the USD value
  max: {
    base: number;
    quote: number;
  };
}

export interface ComboBotBalances {
  base: Array<{ key: string; value: number }>;
  quote: Array<{ key: string; value: number }>;
}

export interface ComboBotChartData {
  equity: number;
  time: number;
}

export interface ComboBotStats {
  chart: ComboBotChartData[];
}

export interface ComboBot {
  _id: string;
  cost?: number;
  status: string;
  statusReason?: unknown;
  settings: ComboBotSettings;
  symbol: ComboBotSymbol[];
  exchange: string;
  exchangeUUID: string;
  profit: ComboBotProfit;
  unrealizedProfit?: number;
  dealsInBot: ComboBotDeals;
  workingShift: ComboBotWorkingShift[];
  assets: ComboBotAssets;
  usage: ComboBotUsage;
  public?: unknown;
  currentBalances: ComboBotBalances;
  initialBalances: ComboBotBalances;
  created: string;
  stats: ComboBotStats;
}

export interface ComboBotListResponse {
  status: string;
  reason?: unknown;
  total: number;
  data: ComboBot[];
}

// Transform function from ComboBot to Bot (UI format)
export function transformComboBotToBot(comboBot: ComboBot) {
  try {
    const symbol = comboBot.symbol?.[0]?.value?.symbol || 'N/A';

    // Calculate runtime (similar to DCA bots)
    const createdDate = new Date(comboBot.created);
    const now = new Date();
    const diffInMs = now.getTime() - createdDate.getTime();
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const runtime = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

    // Calculate profit and investment metrics
    const profitUsd = comboBot.profit?.totalUsd || 0;

    // Calculate current and max costs from usage - this represents actively used capital
    // usage.current.quote represents the quote currency currently being used in trades
    const currentCost = comboBot.usage?.current?.quote || 0;
    const maxCost = comboBot.usage?.max?.quote || 0;

    const outerGaugePercent = calculateDealOuterGaugePercentage({
      strategy: comboBot.settings?.strategy,
      initialBalances: {
        base: comboBot.initialBalances?.base?.[0]?.value || 0,
        quote: comboBot.initialBalances?.quote?.[0]?.value || 0,
      },
      currentBalances: {
        base: comboBot.currentBalances?.base?.[0]?.value || 0,
        quote: comboBot.currentBalances?.quote?.[0]?.value || 0,
      },
      usage: {
        currentUsd: comboBot.usage?.currentUsd,
        maxUsd: comboBot.usage?.max?.quote,
        current: { quote: comboBot.usage?.current?.quote },
        max: { quote: comboBot.usage?.max?.quote },
      },
      min: 0,
      max: 200,
    });

    // Calculate unrealized PnL percentage for center text display
    const unrealizedProfit = comboBot.unrealizedProfit || 0;
    const currentUsageUsd =
      comboBot.usage?.currentUsd || comboBot.usage?.current?.quote || 0;

    // Calculate unrealized PnL percentage (unrealizedProfit / currentUsageUsd)
    const unrealizedPnlPercent = calculatePnlPercentage(
      unrealizedProfit,
      currentUsageUsd
    );

    // If usage is 0, fall back to assets.used.quote as alternative
    const fallbackCurrentCost = comboBot.assets?.used?.quote?.[0]?.value || 0;
    const actualCurrentCost =
      currentCost > 0 ? currentCost : fallbackCurrentCost;

    // Calculate invested amount from initial balances
    const initialQuoteBalance =
      comboBot.initialBalances?.quote?.[0]?.value || 0;
    const currentQuoteBalance =
      comboBot.currentBalances?.quote?.[0]?.value || 0;
    const invested = initialQuoteBalance;
    const investedUsd = invested; // Assuming quote asset is USD/USDT

    // Calculate total profit in percentage
    const totalProfitPercent =
      investedUsd > 0 ? (profitUsd / investedUsd) * 100 : 0;

    // Get all symbols from the combo bot
    const allSymbols = comboBot.symbol?.map((s) => s.value.symbol) || [symbol];
    const uniqueSymbols = [...new Set(allSymbols)];

    // Format pair display for combo bots (multiple pairs)
    const pairs = comboBot.settings?.pair || uniqueSymbols;
    const pairDisplay =
      pairs.length > 1 ? `${pairs.length} pairs` : pairs[0] || symbol;

    // Prefer explicit base/quote fields if present on the symbol value
    const baseAssetField = comboBot.symbol?.[0]?.value?.baseAsset;
    const quoteAssetField = comboBot.symbol?.[0]?.value?.quoteAsset;

    // Derive base/quote from symbol when base/quote fields are missing
    let derivedBase: string | undefined = baseAssetField;
    let derivedQuote: string | undefined = quoteAssetField;
    if ((!derivedBase || !derivedQuote) && symbol) {
      // Split common separators first
      if (symbol.includes('/')) {
        const parts = symbol.split('/');
        if (!derivedBase) derivedBase = parts[0];
        if (!derivedQuote) derivedQuote = parts[1];
      } else if (symbol.includes('-')) {
        const parts = symbol.split('-');
        if (!derivedBase) derivedBase = parts[0];
        if (!derivedQuote) derivedQuote = parts[1];
      } else {
        // Attempt suffix matching for concatenated symbols like BTCUSDT
        const { baseAsset, quoteAsset } = extractPairAssets(symbol);
        if (quoteAsset) {
          if (!derivedBase) derivedBase = baseAsset;
          if (!derivedQuote) derivedQuote = quoteAsset;
        }
      }
    }
    const DASH_CHARS = /[\u002D\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g;
    const sanitizeAsset = (value?: string) =>
      value
        ? String(value)
            .replace(DASH_CHARS, '-')
            .trim()
            .replace(/^-+|-+$/g, '')
        : value;
    derivedBase = sanitizeAsset(derivedBase);
    derivedQuote = sanitizeAsset(derivedQuote);

    // Build coin pair using base/quote when possible, fall back to previous parsing
    const coinPair =
      derivedBase && derivedQuote
        ? `${derivedBase}/${derivedQuote}`
        : symbol
          ? symbol.includes('/')
            ? symbol
            : symbol.includes('-')
              ? symbol
                  .replace(/-+/g, '')
                  .replace(/(USDT|USDC|BUSD|BTC|ETH)$/, (match) => `/${match}`)
              : symbol.replace(
                  /(USDT|USDC|BUSD|BTC|ETH)$/,
                  (match) => `/${match}`
                )
          : 'N/A';

    // Calculate current portfolio value
    const currentValue = currentQuoteBalance + profitUsd;

    // Calculate average daily profit (simplified)
    const daysRunning = Math.max(1, days || 1);
    const avgDaily = profitUsd / daysRunning;
    const dailyProfit = avgDaily; // Daily profit in USD

    // Calculate current base and quote usage for open trade progress
    const currentBaseUsage = comboBot.usage?.current?.base || 0;
    const maxBaseUsage = comboBot.usage?.max?.base || 0;

    // Calculate open and closed trades
    const openTrades = comboBot.dealsInBot?.active || 0;
    const closedTrades = (comboBot.dealsInBot?.all || 0) - openTrades;

    // Calculate annualized return
    const annualizedReturn = avgDaily * 365;
    const annualizedReturnPercent =
      investedUsd > 0 ? (annualizedReturn / investedUsd) * 100 : 0;

    // Calculate trading time (total time bot has been active)
    const tradingTime = runtime;

    // Format created date
    const createdFormatted = new Date(comboBot.created).toLocaleDateString();

    // Calculate usage percentage
    const usagePercent = maxCost > 0 ? (currentCost / maxCost) * 100 : 0;

    const creditsCost =
      typeof comboBot.cost === 'number' && comboBot.cost > 0
        ? comboBot.cost
        : undefined;

    // Map status colors
    const statusColors: Record<string, string> = {
      open: '#10b981', // green
      range: '#3b82f6', // blue
      monitoring: '#f59e0b', // orange
      error: '#ef4444', // red
      closed: '#6b7280', // gray
    };

    // Map bot type
    const mapBotType = (
      _type?: string
    ): 'combo' | 'signal' | 'grid' | 'dca' => {
      return 'combo';
    };

    // Map status
    const mapStatus = (
      status: string
    ): 'error' | 'paused' | 'active' | 'stopped' => {
      const statusMap: Record<
        string,
        'error' | 'paused' | 'active' | 'stopped'
      > = {
        open: 'active',
        range: 'active',
        monitoring: 'active',
        error: 'error',
        closed: 'stopped',
        paused: 'paused',
      };
      return statusMap[status] || 'stopped';
    };

    // Final calculated values for return
    const finalResult = {
      id: comboBot._id,
      name: comboBot.settings?.name || `Combo Bot ${comboBot._id.slice(-6)}`,
      type: mapBotType(comboBot.settings?.type),
      exchange: comboBot.exchange || 'Unknown',
      symbol: symbol, // Primary symbol
      symbols: uniqueSymbols, // All symbols
      profit: profitUsd, // Same as profitUsd for combo bots
      profitUsd: profitUsd,
      pnlPercent: unrealizedPnlPercent, // Use unrealized PnL percentage for center text
      invested: invested,
      investedUsd: investedUsd,
      runtime: runtime,
      status: mapStatus(comboBot.status || 'unknown'),
      scanner: comboBot.settings?.strategy || 'Combo Strategy',
      color: statusColors[comboBot.status] || '#6b7280',
      baseAsset: derivedBase,
      quoteAsset: derivedQuote,

      // Gauge values for bot card double gauge
      outerGaugePercent: outerGaugePercent, // Use outer gauge percentage
      // innerGaugePercent not included to hide inner gauge
      showInnerGauge: false, // Flag to hide inner gauge
      isLongStrategy: true, // Keep gauge green

      // Additional combo-specific properties for the table columns
      pair: pairDisplay, // PAIR column
      coinPair: coinPair, // COIN PAIR column
      strategy: comboBot.settings?.strategy || 'Unknown', // STRATEGY column
      currentCost: actualCurrentCost, // CURRENT COST column
      maxCost: maxCost, // MAX COST column
      totalProfitUsd: profitUsd, // TOTAL PROFIT, $ column
      totalProfitPercent: totalProfitPercent, // TOTAL PROFIT column
      value: currentValue, // VALUE column
      avgDaily: avgDaily, // AVG DAILY column
      annualizedReturn: annualizedReturnPercent, // ANNUALIZED RETURN column
      tradingTime: tradingTime, // TRADING TIME column
      created: createdFormatted, // CREATED column
      // Numeric creation timestamp for reliable sorting (newest -> oldest)
      createdAt: new Date(comboBot.created).getTime(),
      usage: usagePercent, // USAGE column
      deals: comboBot.dealsInBot?.all || 0, // DEALS column
      cost: creditsCost, // CREDITS COST column

      // New fields for improved bot card
      dailyProfit: dailyProfit, // Daily profit in USD
      openTrades: openTrades, // Number of open trades
      closedTrades: closedTrades, // Number of closed trades
      currentBaseUsage: currentBaseUsage, // Current base asset usage
      maxBaseUsage: maxBaseUsage, // Max base asset usage
      exchangeUUID: comboBot.exchangeUUID, // Exchange UUID for looking up custom name

      // Existing properties for internal use
      dealsActive: comboBot.dealsInBot?.active || 0,
      dealsTotal: comboBot.dealsInBot?.all || 0,
      rawData: comboBot, // Keep reference to original data including stats.chart
    };

    return finalResult;
  } catch (error) {
    logger.error('[transformComboBotToBot] Error transforming combo bot:', {
      comboBotId: comboBot._id,
      error,
    });
    throw error;
  }
}
