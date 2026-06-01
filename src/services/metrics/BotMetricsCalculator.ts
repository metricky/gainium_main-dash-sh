/* import type { DcaBot } from '../../types/dcaBot'; */
import type { BotStats, BotStatsSeries } from '../../types';

// Define deal interface
/* interface Deal {
  profit: number;
  profitPercentage: number;
  initialBalance: number;
  cumulativeProfit?: number;
  lowestPoint?: number;
  duration?: number;
  timestamp?: number;
  dcaOrdersTriggered?: number;
  equity?: number;
} */

// Types for calculated metrics
export interface ProfitMetrics {
  grossProfit: number;
  grossProfitPerc: number;
  maxDealProfit: number;
  maxDealProfitPerc: number;
  avgDealProfit: number;
  avgDealProfitPerc: number;
  maxRunUp: number;
  maxRunUpPerc: number;
  maxConsecutiveWins: number;
  standardDeviationOfPositiveReturns: number;
  series: BotStatsSeries;
}

export interface LossMetrics {
  grossLoss: number;
  grossLossPerc: number;
  maxDealLoss: number;
  maxDealLossPerc: number;
  avgDealLoss: number;
  avgDealLossPerc: number;
  maxDrawdown: number;
  maxDrawdownPerc: number;
  maxEquityDrawdown: number;
  maxEquityDrawdownPerc: number;
  maxConsecutiveLosses: number;
  standardDeviationOfNegativeReturns: number;
  standardDeviationOfDownside: number;
  series: BotStatsSeries;
}

export interface GeneralMetrics {
  netProfitPerc: number;
  avgDaily: number;
  avgDailyPerc: number;
  annualizedReturn?: number;
  startBalance: number;
  maxDCAOrdersTriggered: number;
  avgDCAOrdersTriggered?: number | undefined;
  coveredPriceDeviation: number;
  actualPriceDeviation: number;
  confidenceGrade: string;
}

export interface Ratios {
  profitFactor: number;
  sharpeRatio?: number | undefined;
  sortinoRatio?: number | undefined;
  cwr?: number | undefined;
  buyAndHold: {
    result: number;
    perc: number;
    symbol: string;
    startPrice: number;
  };
}

export interface UsageMetrics {
  maxTheoreticalUsage: number;
  maxActualUsage: number;
  avgDealUsage?: number | undefined;
}

export interface DealMetrics {
  profit: number;
  loss: number;
}

export interface DurationMetrics {
  profit: {
    avgWinningTradeDuration: number;
    maxWinningTradeDuration: number;
  };
  loss: {
    avgLosingTradeDuration: number;
    maxLosingTradeDuration: number;
  };
  general: {
    maxDealDuration: number;
    avgDealDuration?: number;
    dealsPerDay: number;
    workingTime: number;
  };
}

export type CalculatedBotStats = BotStats;

/**
 * Service for calculating bot metrics from live data updates
 * Recalculates all statistics when live data changes
 */
export class BotMetricsCalculator {
  notEmpty = true;
  /**
   * Calculate comprehensive bot statistics from bot data
   */
  /* calculateBotStats(bot: DcaBot): CalculatedBotStats {
    const deals = this.extractDeals(bot);
    const profitMetrics = this.calculateProfitMetrics(deals);
    const lossMetrics = this.calculateLossMetrics(deals);
    const generalMetrics = this.calculateGeneralMetrics(bot, deals);
    const ratios = this.calculateRatios(bot, deals, profitMetrics, lossMetrics);
    const usageMetrics = this.calculateUsageMetrics(bot);
    const dealMetrics = this.calculateDealMetrics(deals);
    const durationMetrics = this.calculateDurationMetrics(deals);

    return {
      numerical: {
        profit: profitMetrics,
        loss: lossMetrics,
        general: generalMetrics,
        ratios,
        usage: usageMetrics,
        deals: dealMetrics,
      },
      duration: durationMetrics,
      chart: this.calculateChartData(bot, deals),
    };
  } */

  /**
   * Calculate profit-related metrics
   */
  /* private calculateProfitMetrics(deals: Deal[]): BotStats['numerical']['profit'] {
    const profitableDeals = deals.filter((deal) => deal.profit > 0);

    if (profitableDeals.length === 0) {
      return {
        grossProfit: { usd: 0, asset: 0 },
        grossProfitPerc: 0,
        maxDealProfit: { usd: 0, asset: 0 },
        maxDealProfitPerc: 0,
        avgDealProfit: { usd: 0, asset: 0 },
        avgDealProfitPerc: 0,
        maxRunUp: { usd: 0, asset: 0 },
        maxRunUpPerc: 0,
        maxConsecutiveWins: 0,
        standardDeviationOfPositiveReturns: 0,
        series: this.createEmptySeries(),
      };
    }

    const grossProfit = profitableDeals.reduce(
      (sum, deal) => sum + deal.profit,
      0
    );
    const profits = profitableDeals.map((deal) => deal.profit);
    const profitPercents = profitableDeals.map((deal) => deal.profitPercentage);
const maxProfit = Math.max(...profits);
const avg= profits.reduce((a, b) => a + b, 0) / profits.length
    return {
      grossProfit: {asset: grossProfit, usd: grossProfit},
      grossProfitPerc:
        (grossProfit / (profitableDeals[0]?.initialBalance || 1)) * 100,
      maxDealProfit: {asset: maxProfit, usd: maxProfit},
      maxDealProfitPerc: Math.max(...profitPercents),
      avgDealProfit: {asset: avg, usd: avg},
      avgDealProfitPerc:
        profitPercents.reduce((a, b) => a + b, 0) / profitPercents.length,
      maxRunUp: this.calculateMaxRunUp(profitableDeals),
      maxRunUpPerc: 0, // Calculate based on initial balance
      maxConsecutiveWins: this.calculateMaxConsecutiveWins(deals),
      standardDeviationOfPositiveReturns:
        this.calculateStandardDeviation(profits),
      series: this.createProfitSeries(profitableDeals),
    };
  } */

  /**
   * Calculate loss-related metrics
   */
  /* private calculateLossMetrics(deals: Deal[]): LossMetrics {
    const losingDeals = deals.filter((deal) => deal.profit < 0);

    if (losingDeals.length === 0) {
      return {
        grossLoss: 0,
        grossLossPerc: 0,
        maxDealLoss: 0,
        maxDealLossPerc: 0,
        avgDealLoss: 0,
        avgDealLossPerc: 0,
        maxDrawdown: 0,
        maxDrawdownPerc: 0,
        maxEquityDrawdown: 0,
        maxEquityDrawdownPerc: 0,
        maxConsecutiveLosses: 0,
        standardDeviationOfNegativeReturns: 0,
        standardDeviationOfDownside: 0,
        series: this.createEmptySeries(),
      };
    }

    const grossLoss = Math.abs(
      losingDeals.reduce((sum, deal) => sum + deal.profit, 0)
    );
    const losses = losingDeals.map((deal) => Math.abs(deal.profit));
    const lossPercents = losingDeals.map((deal) =>
      Math.abs(deal.profitPercentage)
    );

    return {
      grossLoss,
      grossLossPerc: (grossLoss / (losingDeals[0]?.initialBalance || 1)) * 100,
      maxDealLoss: Math.max(...losses),
      maxDealLossPerc: Math.max(...lossPercents),
      avgDealLoss: losses.reduce((a, b) => a + b, 0) / losses.length,
      avgDealLossPerc:
        lossPercents.reduce((a, b) => a + b, 0) / lossPercents.length,
      maxDrawdown: this.calculateMaxDrawdown(deals),
      maxDrawdownPerc: 0, // Calculate as percentage
      maxEquityDrawdown: this.calculateMaxEquityDrawdown(deals),
      maxEquityDrawdownPerc: 0, // Calculate as percentage
      maxConsecutiveLosses: this.calculateMaxConsecutiveLosses(deals),
      standardDeviationOfNegativeReturns:
        this.calculateStandardDeviation(losses),
      standardDeviationOfDownside: this.calculateDownsideDeviation(losses),
      series: this.createLossSeries(losingDeals),
    };
  } */

  /**
   * Calculate general metrics
   */
  /* private calculateGeneralMetrics(bot: DcaBot, deals: Deal[]): GeneralMetrics {
    const totalDeals = deals.length;
    const profitableDeals = deals.filter((deal) => deal.profit > 0).length;
    const winRate = totalDeals > 0 ? (profitableDeals / totalDeals) * 100 : 0;

    const totalProfit = deals.reduce((sum, deal) => sum + deal.profit, 0);
    const startBalance =
      (bot.profit as { startBalance?: number })?.startBalance || 0;
    const netProfitPerc =
      startBalance > 0 ? (totalProfit / startBalance) * 100 : 0;

    // Calculate daily metrics
    const daysActive = this.calculateDaysActive(bot);
    const avgDaily = daysActive > 0 ? totalProfit / daysActive : 0;
    const avgDailyPerc = daysActive > 0 ? (avgDaily / startBalance) * 100 : 0;

    return {
      netProfitPerc,
      avgDaily,
      avgDailyPerc,
      startBalance,
      maxDCAOrdersTriggered: this.calculateMaxDCAOrdersTriggered(deals),
      avgDCAOrdersTriggered: this.calculateAvgDCAOrdersTriggered(deals),
      coveredPriceDeviation: this.calculateCoveredPriceDeviation(deals),
      actualPriceDeviation: this.calculateActualPriceDeviation(deals),
      confidenceGrade: this.calculateConfidenceGrade(winRate, totalDeals),
    };
  } */

  /**
   * Calculate performance ratios
   */

  /**
   * Calculate usage metrics
   */
  /* private calculateUsageMetrics(bot: DcaBot): UsageMetrics {
    const usage = bot.usage || {};
    const current = usage.current || {};
    const max = usage.max || {};

    return {
      maxTheoreticalUsage: Math.max(max.base || 0, max.quote || 0),
      maxActualUsage: Math.max(current.base || 0, current.quote || 0),
      avgDealUsage: this.calculateAvgDealUsage(bot),
    };
  } */

  /**
   * Calculate deal metrics
   */
  /* private calculateDealMetrics(deals: Deal[]): DealMetrics {
    return {
      profit: deals.filter((deal) => deal.profit > 0).length,
      loss: deals.filter((deal) => deal.profit < 0).length,
    };
  } */

  /**
   * Calculate duration metrics
   */
  /* private calculateDurationMetrics(deals: Deal[]): DurationMetrics {
    const profitableDeals = deals.filter((deal) => deal.profit > 0);
    const losingDeals = deals.filter((deal) => deal.profit < 0);

    const profitableDurations = profitableDeals.map(
      (deal) => deal.duration || 0
    );
    const losingDurations = losingDeals.map((deal) => deal.duration || 0);
    const allDurations = deals.map((deal) => deal.duration || 0);

    return {
      profit: {
        avgWinningTradeDuration:
          profitableDurations.length > 0
            ? profitableDurations.reduce((a, b) => a + b, 0) /
              profitableDurations.length
            : 0,
        maxWinningTradeDuration:
          profitableDurations.length > 0 ? Math.max(...profitableDurations) : 0,
      },
      loss: {
        avgLosingTradeDuration:
          losingDurations.length > 0
            ? losingDurations.reduce((a, b) => a + b, 0) /
              losingDurations.length
            : 0,
        maxLosingTradeDuration:
          losingDurations.length > 0 ? Math.max(...losingDurations) : 0,
      },
      general: {
        maxDealDuration:
          allDurations.length > 0 ? Math.max(...allDurations) : 0,
        avgDealDuration:
          allDurations.length > 0
            ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length
            : 0,
        dealsPerDay: this.calculateDealsPerDay(deals),
        workingTime: this.calculateWorkingTime(deals),
      },
    };
  } */

  // Helper methods for calculations
  /* private extractDeals(_bot: DcaBot): Deal[] {
    // Extract deals from bot data - this would need to be adapted based on actual bot structure
    // For now, return empty array as placeholder
    return [];
  } */

  /* private calculateMaxRunUp(deals: Deal[]): number {
    let maxRunUp = 0;
    let peak = 0;

    for (const deal of deals) {
      peak = Math.max(peak, deal.cumulativeProfit || 0);
      maxRunUp = Math.max(maxRunUp, peak - (deal.lowestPoint || 0));
    }

    return maxRunUp;
  } */

  /* private calculateMaxDrawdown(deals: Deal[]): number {
    let maxDrawdown = 0;
    let peak = 0;

    for (const deal of deals) {
      peak = Math.max(peak, deal.cumulativeProfit || 0);
      const drawdown = peak - (deal.cumulativeProfit || 0);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  } */

  /* private calculateMaxEquityDrawdown(deals: Deal[]): number {
    // Calculate based on equity curve
    return this.calculateMaxDrawdown(deals); // Simplified
  } */

  /* private calculateMaxConsecutiveWins(deals: Deal[]): number {
    let maxStreak = 0;
    let currentStreak = 0;

    for (const deal of deals) {
      if (deal.profit > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  private calculateMaxConsecutiveLosses(deals: Deal[]): number {
    let maxStreak = 0;
    let currentStreak = 0;

    for (const deal of deals) {
      if (deal.profit < 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateDownsideDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const downsideValues = values.filter((value) => value < mean);
    if (downsideValues.length === 0) return 0;

    const squaredDiffs = downsideValues.map((value) =>
      Math.pow(value - mean, 2)
    );
    const variance =
      squaredDiffs.reduce((a, b) => a + b, 0) / downsideValues.length;
    return Math.sqrt(variance);
  }

  private calculateSortinoRatio(returns: number[]): number | undefined {
    const downsideDev = this.calculateDownsideDeviation(returns);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    return downsideDev > 0 ? avgReturn / downsideDev : undefined;
  }

  private calculateCWR(deals: Deal[]): number | undefined {
    // Calmar Ratio or similar - simplified calculation
    const totalReturn = deals.reduce((sum, deal) => sum + deal.profit, 0);
    const maxDrawdown = this.calculateMaxDrawdown(deals);
    return maxDrawdown > 0 ? totalReturn / maxDrawdown : undefined;
  }

  private calculateBuyAndHold(bot: DcaBot): {
    result: number;
    perc: number;
    symbol: string;
    startPrice: number;
  } {
    // Simplified buy and hold calculation
    return {
      result: 0,
      perc: 0,
      symbol:
        bot.symbol?.[0]?.value?.baseAsset +
          '/' +
          bot.symbol?.[0]?.value?.quoteAsset || '',
      startPrice: (bot as { initialPrice?: number }).initialPrice || 0,
    };
  }

  private calculateDaysActive(bot: DcaBot): number {
    const created = new Date(bot.created).getTime();
    const now = Date.now();
    return Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));
  }

  private calculateMaxDCAOrdersTriggered(deals: Deal[]): number {
    return Math.max(...deals.map((deal) => deal.dcaOrdersTriggered || 0), 0);
  }

  private calculateAvgDCAOrdersTriggered(deals: Deal[]): number | undefined {
    const dcaOrders = deals
      .map((deal) => deal.dcaOrdersTriggered || 0)
      .filter((count) => count > 0);
    return dcaOrders.length > 0
      ? dcaOrders.reduce((a, b) => a + b, 0) / dcaOrders.length
      : undefined;
  }

  private calculateCoveredPriceDeviation(_deals: Deal[]): number {
    // Simplified calculation
    return 0;
  }

  private calculateActualPriceDeviation(_deals: Deal[]): number {
    // Simplified calculation
    return 0;
  }

  private calculateConfidenceGrade(
    winRate: number,
    totalDeals: number
  ): string {
    if (totalDeals < 10) return 'Low';
    if (winRate >= 70) return 'High';
    if (winRate >= 60) return 'Medium';
    return 'Low';
  }

  private calculateAvgDealUsage(_bot: DcaBot): number | undefined {
    // Simplified calculation
    return undefined;
  }

  private calculateDealsPerDay(deals: Deal[]): number {
    if (deals.length === 0) return 0;
    const firstDeal = Math.min(
      ...deals.map((deal) => deal.timestamp || Date.now())
    );
    const lastDeal = Math.max(
      ...deals.map((deal) => deal.timestamp || Date.now())
    );
    const daysDiff = Math.max(
      1,
      (lastDeal - firstDeal) / (1000 * 60 * 60 * 24)
    );
    return deals.length / daysDiff;
  }

  private calculateWorkingTime(_deals: Deal[]): number {
    // Calculate total time bot was active
    return 0; // Simplified
  }

  private calculateChartData(
    _bot: DcaBot,
    deals: Deal[]
  ): Array<{
    realizedProfit: number;
    buyAndHold: number;
    equity: number;
    time: number;
  }> {
    // Generate chart data points from deals
    return deals.map((deal) => ({
      realizedProfit: deal.cumulativeProfit || 0,
      buyAndHold: 0, // Calculate buy and hold performance
      equity: deal.equity || 0,
      time: deal.timestamp || Date.now(),
    }));
  }

  private createEmptySeries(): BotStatsSeries {
    return {
      count: 0,
      value: { usd: 0, asset: 0 },
      minValue: { usd: 0, asset: 0 },
      maxValue: { usd: 0, asset: 0 },
      perc: 0,
    };
  }

  private createProfitSeries(deals: Deal[]): BotStatsSeries {
    const profits = deals.map((deal) => deal.profit);
    const totalProfit = profits.reduce((a, b) => a + b, 0);
    return {
      count: deals.length,
      value: { usd: totalProfit, asset: totalProfit },
      minValue:
        profits.length > 0
          ? { usd: Math.min(...profits), asset: Math.min(...profits) }
          : { usd: 0, asset: 0 },
      maxValue:
        profits.length > 0
          ? { usd: Math.max(...profits), asset: Math.max(...profits) }
          : { usd: 0, asset: 0 },
      perc: 0, // Calculate percentage
    };
  }

  private createLossSeries(deals: Deal[]): BotStatsSeries {
    const losses = deals.map((deal) => Math.abs(deal.profit));
    const totalLoss = losses.reduce((a, b) => a + b, 0);
    return {
      count: deals.length,
      value: { usd: totalLoss, asset: totalLoss },
      minValue:
        losses.length > 0
          ? { usd: Math.min(...losses), asset: Math.min(...losses) }
          : { usd: 0, asset: 0 },
      maxValue:
        losses.length > 0
          ? { usd: Math.max(...losses), asset: Math.max(...losses) }
          : { usd: 0, asset: 0 },
      perc: 0, // Calculate percentage
    };
  } */
}

// Singleton instance
export const botMetricsCalculator = new BotMetricsCalculator();
