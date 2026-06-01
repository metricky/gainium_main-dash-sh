import { isBotActive } from '@/utils/botStatusUtils';

/**
 * Minimal per-bot data shape consumed by the unified stats computation.
 * Each bot type (DCA, Combo, Grid, HedgeDca, HedgeCombo) maps its records
 * into this shape via a small adapter — keeps the stats math single-source.
 */
export interface BotForStats {
  status: string;
  totalProfitUsd: number;
  todayProfitUsd: number;
  usedQuote: number;
  requiredQuote: number;
  activeDeals: number;
}

export interface BotListStats {
  /** Bots currently running per ACTIVE_STATUSES (open/error/range/monitoring). */
  activeBots: number;
  /** Bots not closed and not archived — denominator for the "X/Y" box. */
  runningBots: number;
  /** Sum of `dealsInBot.active` over running bots (or per-type equivalent). */
  activeDeals: number;
  /** Sum of `profit.totalUsd` over non-archived bots (closed bots count). */
  totalProfit: number;
  /** Sum of `profitToday.totalTodayUsd` over non-archived bots. */
  todayProfit: number;
  /** Sum of `assets.used.quote` over running bots. */
  capitalDeployed: number;
  /** Sum of `assets.required.quote` over running bots — needed to combine. */
  capitalRequired: number;
  /** capitalDeployed / capitalRequired * 100. */
  utilization: number;
}

export const emptyBotListStats: BotListStats = {
  activeBots: 0,
  runningBots: 0,
  activeDeals: 0,
  totalProfit: 0,
  todayProfit: 0,
  capitalDeployed: 0,
  capitalRequired: 0,
  utilization: 0,
};

function isArchived(status: string): boolean {
  const s = String(status || '').toLowerCase();
  return s === 'archive' || s === 'archived';
}

function isClosed(status: string): boolean {
  return String(status || '').toLowerCase() === 'closed';
}

export function computeBotListStats(bots: BotForStats[]): BotListStats {
  if (!bots.length) return { ...emptyBotListStats };

  // Archived bots are excluded from every metric — they're effectively
  // deleted from the user's view. Closed bots count toward historical
  // profit but not toward "running" count or "deployed capital".
  const nonArchived = bots.filter((b) => !isArchived(b.status));
  const running = nonArchived.filter((b) => !isClosed(b.status));

  const activeBots = running.filter((b) => isBotActive(b.status)).length;
  const runningBots = running.length;

  const activeDeals = running.reduce((sum, b) => sum + (b.activeDeals || 0), 0);

  const totalProfit = nonArchived.reduce(
    (sum, b) => sum + (b.totalProfitUsd || 0),
    0
  );
  const todayProfit = nonArchived.reduce(
    (sum, b) => sum + (b.todayProfitUsd || 0),
    0
  );

  const capitalDeployed = running.reduce(
    (sum, b) => sum + (b.usedQuote || 0),
    0
  );
  const capitalRequired = running.reduce(
    (sum, b) => sum + (b.requiredQuote || 0),
    0
  );

  const utilization =
    capitalRequired > 0 ? (capitalDeployed / capitalRequired) * 100 : 0;

  return {
    activeBots,
    runningBots,
    activeDeals,
    totalProfit,
    todayProfit,
    capitalDeployed,
    capitalRequired,
    utilization,
  };
}

/**
 * Sum N pre-computed BotListStats into one. Used by Trading.tsx to
 * aggregate DCA + Combo + Grid (+ Hedge) without re-running the math.
 * Utilization is recomputed from the summed capital values, never averaged.
 */
export function combineBotListStats(parts: BotListStats[]): BotListStats {
  if (!parts.length) return { ...emptyBotListStats };
  const sum = parts.reduce(
    (acc, p) => ({
      activeBots: acc.activeBots + p.activeBots,
      runningBots: acc.runningBots + p.runningBots,
      activeDeals: acc.activeDeals + p.activeDeals,
      totalProfit: acc.totalProfit + p.totalProfit,
      todayProfit: acc.todayProfit + p.todayProfit,
      capitalDeployed: acc.capitalDeployed + p.capitalDeployed,
      capitalRequired: acc.capitalRequired + p.capitalRequired,
      utilization: 0,
    }),
    { ...emptyBotListStats }
  );
  sum.utilization =
    sum.capitalRequired > 0
      ? (sum.capitalDeployed / sum.capitalRequired) * 100
      : 0;
  return sum;
}

/**
 * Sum a `{key, value}[]` quote array — the shape used by DCA/Combo
 * `assets.used.quote` and `assets.required.quote`.
 */
export function sumQuoteValues(
  arr: ReadonlyArray<{ value?: number | null }> | null | undefined
): number {
  if (!arr || !arr.length) return 0;
  return arr.reduce((sum, a) => sum + (a?.value || 0), 0);
}
