// Types for real Hedge Combo Bot data from GraphQL API
import { logger } from '@/lib/loggerInstance';
import type { HedgeBot } from './index';

// Helper function to transform HedgeBot to the format expected by the UI for Combo Bots
export function transformHedgeComboBotToBot(hedgeBot: HedgeBot): {
  id: string;
  name: string;
  type: 'signal' | 'grid' | 'dca' | 'combo';
  exchange: string;
  symbol: string;
  symbols: string[]; // Add support for multiple symbols
  profit: number;
  profitUsd: number;
  pnlPercent: number;
  invested: number;
  investedUsd: number;
  runtime: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
  scanner: string;
  color: string;
  // Additional properties for BotCard compatibility
  exchangeUUID?: string;
  pair?: string;
  coinPair?: string;
  strategy?: string;
  dailyProfit?: number;
  usage?: number;
  unrealizedPnl?: number;
  unrealizedPnlUsd?: number;
  unrealizedPnlPercent?: number;
  uPnL?: number;
  openTrades?: number;
  closedTrades?: number;
  value?: number;
  currentCost?: number;
  maxCost?: number;
  currentBaseUsage?: number;
  maxBaseUsage?: number;
  outerGaugePercent?: number;
  innerGaugePercent?: number;
  isLongStrategy?: boolean;
  showInnerGauge?: boolean;
  rawData?: unknown;
} {
  if (import.meta.env.DEV) {
    logger.debug('[transformHedgeComboBotToBot] Processing hedge combo bot', {
      botId: hedgeBot._id,
      symbol: hedgeBot.symbol,
      profit: hedgeBot.profit,
      type: hedgeBot.type,
    });
  }

  // Calculate runtime from working shifts (start to end, not to current time)
  const runtime = (() => {
    const workingShifts = hedgeBot.workingShift || [];
    if (workingShifts.length === 0) return '0h';

    const currentTime = Date.now() / 1000; // Unix timestamp
    const startTime = workingShifts[0]?.start || currentTime;
    const diffInSeconds = currentTime - startTime;
    const hours = Math.floor(diffInSeconds / 3600);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  })();

  // Extract symbols from hedge bot bots or symbol array
  const symbols = new Set<string>();

  // Extract from bots if available
  if (hedgeBot.bots) {
    hedgeBot.bots.forEach((bot) => {
      if ('symbol' in bot && Array.isArray(bot.symbol)) {
        bot.symbol.forEach((s) => {
          if (s.value?.symbol) {
            symbols.add(s.value.symbol);
          }
        });
      }
    });
  }

  // Extract from hedge bot symbol array
  if (hedgeBot.symbol) {
    hedgeBot.symbol.forEach((s) => {
      if (s.value?.symbol) {
        symbols.add(s.value.symbol);
      }
    });
  }

  const uniqueSymbols = Array.from(symbols);
  const symbolData = uniqueSymbols[0] || 'Unknown';

  // Calculate profit metrics
  const totalUsd = hedgeBot.profit?.totalUsd || 0;
  const profit = hedgeBot.profit?.total || totalUsd;

  // Calculate invested amount - sum from long and short balances
  let invested = 0;
  let investedUsd = 0;

  if (hedgeBot.initialBalances?.long?.base) {
    invested += hedgeBot.initialBalances.long.base.reduce(
      (sum, item) => sum + (item.value || 0),
      0
    );
  }
  if (hedgeBot.initialBalances?.short?.base) {
    invested += hedgeBot.initialBalances.short.base.reduce(
      (sum, item) => sum + (item.value || 0),
      0
    );
  }

  // Use quote balances for USD invested (simplified)
  if (hedgeBot.initialBalances?.long?.quote) {
    investedUsd += hedgeBot.initialBalances.long.quote.reduce(
      (sum, item) => sum + (item.value || 0),
      0
    );
  }
  if (hedgeBot.initialBalances?.short?.quote) {
    investedUsd += hedgeBot.initialBalances.short.quote.reduce(
      (sum, item) => sum + (item.value || 0),
      0
    );
  }

  // Calculate P&L percentage
  const pnlPercent = investedUsd > 0 ? (totalUsd / investedUsd) * 100 : 0;

  // Runtime string formatting
  const runtimeString = runtime;

  // Status color mapping
  const statusColors: Record<string, string> = {
    open: '#10b981', // green
    range: '#3b82f6', // blue
    monitoring: '#f59e0b', // amber
    error: '#ef4444', // red
    closed: '#6b7280', // gray
  };

  // Map bot type for combo bots
  const mapBotType = (_type?: string): 'combo' | 'signal' | 'grid' | 'dca' => {
    return 'combo'; // Always combo for hedge combo bots
  };

  // Map status
  const mapStatus = (
    status: string
  ): 'active' | 'paused' | 'stopped' | 'error' => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'range':
      case 'monitoring':
        return 'active';
      case 'closed':
        return 'stopped';
      case 'error':
        return 'error';
      default:
        return 'stopped';
    }
  };

  // Generate a name based on the hedge combo bot data
  const generateName = (): string => {
    if (hedgeBot.bots && hedgeBot.bots.length > 0) {
      // If we have child bots, use the first one's name as reference
      const firstBot = hedgeBot.bots[0];
      if ('settings' in firstBot && firstBot.settings?.name) {
        return `Hedge Combo ${firstBot.settings.name}`;
      }
    }
    return `Hedge Combo Bot ${hedgeBot._id.slice(-6)}`;
  };

  // Calculate daily profit (simplified)
  const daysRunning = (() => {
    const workingShifts = hedgeBot.workingShift || [];
    if (workingShifts.length === 0) return 1;
    const currentTime = Date.now() / 1000;
    const startTime = workingShifts[0]?.start || currentTime;
    const diffInSeconds = currentTime - startTime;
    const days = Math.floor(diffInSeconds / (24 * 3600));
    return Math.max(1, days);
  })();
  const dailyProfit = totalUsd / daysRunning;

  // Calculate open and closed trades from symbols
  const openTrades = uniqueSymbols.length;
  const closedTrades = 0; // Hedge combo bots don't have specific closed trade data

  // Calculate current cost (invested - profit)
  const currentCost = Math.max(0, investedUsd - totalUsd);
  const maxCost = investedUsd;

  // Calculate usage percentage
  const usagePercent = maxCost > 0 ? (currentCost / maxCost) * 100 : 0;

  // Calculate gauge percentages
  const outerGaugePercent = Math.min(100, Math.max(0, usagePercent));

  // Calculate current value
  const currentValue = investedUsd + totalUsd;

  return {
    id: hedgeBot._id,
    name: generateName(),
    type: mapBotType(hedgeBot.type || 'hedgeCombo'),
    exchange: hedgeBot.bots?.[0]?.exchange || 'Unknown',
    symbol: symbolData, // Use full symbol like "BTCUSDT"
    symbols: uniqueSymbols, // All symbols for the hedge combo bot
    profit: profit,
    profitUsd: totalUsd,
    pnlPercent: pnlPercent,
    invested: invested,
    investedUsd: investedUsd,
    runtime: runtimeString,
    status: mapStatus(hedgeBot.status),
    scanner: 'Hedge Combo Strategy',
    color: statusColors[hedgeBot.status] || 'gray',
    // Additional properties for BotCard compatibility
    exchangeUUID: hedgeBot.bots?.[0]?.exchangeUUID,
    pair:
      uniqueSymbols.length > 1 ? `${uniqueSymbols.length} pairs` : symbolData,
    coinPair: symbolData
      ? symbolData.replace(/(USDT|BUSD|BTC|ETH)$/, (match) => `/${match}`)
      : 'N/A',
    strategy: 'Hedge Combo Strategy',
    dailyProfit: dailyProfit,
    usage: usagePercent,
    unrealizedPnl: totalUsd,
    unrealizedPnlUsd: totalUsd,
    unrealizedPnlPercent: pnlPercent,
    uPnL: totalUsd,
    openTrades: openTrades,
    closedTrades: closedTrades,
    value: currentValue,
    currentCost: currentCost,
    maxCost: maxCost,
    currentBaseUsage: 0, // Not available for hedge combo bots
    maxBaseUsage: 0, // Not available for hedge combo bots
    outerGaugePercent: outerGaugePercent,
    innerGaugePercent: 0, // Not used for hedge combo bots
    isLongStrategy: true,
    showInnerGauge: false,
    rawData: hedgeBot, // Keep reference to original data
  };
}

export interface HedgeComboBotListResponse {
  status: string;
  data: HedgeBot[];
  total?: number;
}

export interface HedgeComboBotListData {
  hedgeComboBotList: HedgeComboBotListResponse;
}
