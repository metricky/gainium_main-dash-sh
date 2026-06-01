// Dual Timeframe Manager for Manual Backtesting
// This module handles the logic for displaying one timeframe while advancing at another

import {
  ExchangeEnum,
  ExchangeIntervals,
  timeIntervalMap,
  tvToExchangeIntervalMap,
} from '@/types';
import Candles from '@/utils/candles';
import logger from '../../../lib/loggerInstance';
import type { Bar } from '../types';

export interface DualTimeframeState {
  chartPeriod: string; // TradingView resolution (e.g., '60' for 1h)
  playbackPeriod: string; // Playback resolution (e.g., '15' for 15m)
  chartBars: Bar[]; // Bars for chart display
  playbackBars: Bar[]; // Bars for playback control
  currentChartBarIndex: number; // Current chart bar being built/displayed
  currentPlaybackIndex: number; // Current playback position
  aggregatedOHLC: Bar | null; // Current aggregated OHLC for the chart bar
}

export class DualTimeframeManager {
  private candlesProvider: Candles;
  private state: DualTimeframeState;

  constructor() {
    this.candlesProvider = new Candles(ExchangeEnum.binance);
    this.state = {
      chartPeriod: '60',
      playbackPeriod: '15',
      chartBars: [],
      playbackBars: [],
      currentChartBarIndex: -1,
      currentPlaybackIndex: -1,
      aggregatedOHLC: null,
    };
  }

  /**
   * Initialize with new periods and session data
   */
  async initialize(
    chartPeriod: string,
    playbackPeriod: string,
    symbol: string,
    periodStartMs: number,
    periodEndMs: number,
    lookbackCandles: number = 300
  ): Promise<void> {
    this.state.chartPeriod = chartPeriod;
    this.state.playbackPeriod = playbackPeriod;

    // Convert TradingView resolution strings to ExchangeIntervals
    const chartInterval: ExchangeIntervals =
      (tvToExchangeIntervalMap as Record<string, ExchangeIntervals>)[
        chartPeriod
      ] || ExchangeIntervals.oneH;
    const playbackInterval: ExchangeIntervals =
      (tvToExchangeIntervalMap as Record<string, ExchangeIntervals>)[
        playbackPeriod
      ] || ExchangeIntervals.fifteenM;

    // Calculate lookback start
    const chartIntervalMs =
      (timeIntervalMap as Record<ExchangeIntervals, number>)[chartInterval] ||
      60 * 60 * 1000;
    const lookbackStart = Math.max(
      periodStartMs - lookbackCandles * chartIntervalMs,
      0
    );

    // Load chart bars (for display context)
    logger.info(
      `[DualTimeframe] Loading chart bars (${chartPeriod}) from ${new Date(lookbackStart).toISOString()} to ${new Date(periodEndMs).toISOString()}`
    );
    this.state.chartBars = await this.candlesProvider.getCandles({
      symbol,
      interval: chartInterval,
      period: {
        from: Math.floor(lookbackStart / 1000),
        to: Math.floor(periodEndMs / 1000),
        countBack: Infinity,
        firstDataRequest: false,
      },
      baseAsset: symbol.replace(/USDT$/, ''),
      quoteAsset: 'USDT',
      updateProgress: (progress, message) => {
        logger.info(
          `[DualTimeframe] Chart bars loading: ${Math.round(progress * 100)}% - ${message}`
        );
      },
    });

    // Load playback bars (for time advancement)
    logger.info(
      `[DualTimeframe] Loading playback bars (${playbackPeriod}) from ${new Date(lookbackStart).toISOString()} to ${new Date(periodEndMs).toISOString()}`
    );
    this.state.playbackBars = await this.candlesProvider.getCandles({
      symbol,
      interval: playbackInterval,
      period: {
        from: Math.floor(lookbackStart / 1000),
        to: Math.floor(periodEndMs / 1000),
        countBack: Infinity,
        firstDataRequest: false,
      },
      baseAsset: symbol.replace(/USDT$/, ''),
      quoteAsset: 'USDT',
      updateProgress: (progress, message) => {
        logger.info(
          `[DualTimeframe] Playback bars loading: ${Math.round(progress * 100)}% - ${message}`
        );
      },
    });

    // Sort both arrays to ensure ascending order
    this.state.chartBars.sort((a, b) => a.time - b.time);
    this.state.playbackBars.sort((a, b) => a.time - b.time);

    // Normalize time to milliseconds if needed
    this.state.chartBars = this.state.chartBars.map(this.normalizeBarTime);
    this.state.playbackBars = this.state.playbackBars.map(
      this.normalizeBarTime
    );

    // Find the session start positions
    this.state.currentChartBarIndex = this.findBarIndexAtTime(
      this.state.chartBars,
      periodStartMs
    );
    this.state.currentPlaybackIndex = this.findBarIndexAtTime(
      this.state.playbackBars,
      periodStartMs
    );

    logger.info(
      `[DualTimeframe] Initialized: chart bars=${this.state.chartBars.length}, playback bars=${this.state.playbackBars.length}, chart start=${this.state.currentChartBarIndex}, playback start=${this.state.currentPlaybackIndex}`
    );
  }

  /**
   * Get bars for chart display (up to current position)
   */
  getChartBars(upToIndex?: number): Bar[] {
    const endIndex = upToIndex ?? this.state.currentChartBarIndex + 1;
    const chartBars = this.state.chartBars.slice(0, endIndex);

    // If we have an aggregated OHLC for the current bar, update the last chart bar
    if (this.state.aggregatedOHLC && chartBars.length > 0) {
      const lastBarIndex = chartBars.length - 1;
      const currentTime =
        this.state.chartBars[this.state.currentChartBarIndex]?.time;

      // Only update if the aggregated OHLC belongs to the current chart bar
      if (
        currentTime &&
        this.isTimeInBar(
          this.state.aggregatedOHLC.time,
          currentTime,
          this.state.chartPeriod
        )
      ) {
        chartBars[lastBarIndex] = { ...this.state.aggregatedOHLC };
      }
    }

    return chartBars;
  }

  /**
   * Advance to the next playback bar and update aggregated OHLC
   */
  advancePlayback(): {
    success: boolean;
    currentBar: Bar | null;
    chartUpdated: boolean;
  } {
    if (this.state.currentPlaybackIndex >= this.state.playbackBars.length - 1) {
      return { success: false, currentBar: null, chartUpdated: false };
    }

    this.state.currentPlaybackIndex++;
    const currentPlaybackBar =
      this.state.playbackBars[this.state.currentPlaybackIndex];

    if (!currentPlaybackBar) {
      return { success: false, currentBar: null, chartUpdated: false };
    }

    // Check if this playback bar belongs to a new chart bar
    let chartUpdated = false;
    const currentChartBar =
      this.state.chartBars[this.state.currentChartBarIndex];

    if (
      currentChartBar &&
      !this.isTimeInBar(
        currentPlaybackBar.time,
        currentChartBar.time,
        this.state.chartPeriod
      )
    ) {
      // We've moved to a new chart bar
      if (this.state.aggregatedOHLC) {
        // Finalize the previous chart bar with the aggregated OHLC
        this.state.chartBars[this.state.currentChartBarIndex] = {
          ...this.state.aggregatedOHLC,
        };
      }

      this.state.currentChartBarIndex++;
      this.state.aggregatedOHLC = null;
      chartUpdated = true;
    }

    // Update or create the aggregated OHLC
    if (!this.state.aggregatedOHLC) {
      // Start new aggregation
      this.state.aggregatedOHLC = {
        time: currentChartBar?.time || currentPlaybackBar.time,
        open: currentPlaybackBar.open,
        high: currentPlaybackBar.high,
        low: currentPlaybackBar.low,
        close: currentPlaybackBar.close,
        volume: currentPlaybackBar.volume,
      };
    } else {
      // Update aggregation
      this.state.aggregatedOHLC.high = Math.max(
        this.state.aggregatedOHLC.high,
        currentPlaybackBar.high
      );
      this.state.aggregatedOHLC.low = Math.min(
        this.state.aggregatedOHLC.low,
        currentPlaybackBar.low
      );
      this.state.aggregatedOHLC.close = currentPlaybackBar.close;
      this.state.aggregatedOHLC.volume += currentPlaybackBar.volume;
    }

    return {
      success: true,
      currentBar: currentPlaybackBar,
      chartUpdated,
    };
  }

  /**
   * Get the current playback bar
   */
  getCurrentPlaybackBar(): Bar | null {
    if (
      this.state.currentPlaybackIndex < 0 ||
      this.state.currentPlaybackIndex >= this.state.playbackBars.length
    ) {
      return null;
    }
    return this.state.playbackBars[this.state.currentPlaybackIndex];
  }

  /**
   * Get current progress information
   */
  getProgress(): {
    playbackIndex: number;
    totalPlaybackBars: number;
    chartIndex: number;
    totalChartBars: number;
  } {
    return {
      playbackIndex: this.state.currentPlaybackIndex,
      totalPlaybackBars: this.state.playbackBars.length,
      chartIndex: this.state.currentChartBarIndex,
      totalChartBars: this.state.chartBars.length,
    };
  }

  /**
   * Reset to beginning
   */
  reset(): void {
    this.state.currentChartBarIndex = -1;
    this.state.currentPlaybackIndex = -1;
    this.state.aggregatedOHLC = null;
  }

  /**
   * Check if we can advance further
   */
  canAdvance(): boolean {
    return this.state.currentPlaybackIndex < this.state.playbackBars.length - 1;
  }

  /**
   * Helper: Normalize bar time to milliseconds
   */
  private normalizeBarTime(bar: Bar): Bar {
    if (bar.time < 10_000_000_000) {
      return { ...bar, time: bar.time * 1000 };
    }
    return bar;
  }

  /**
   * Helper: Find bar index at or before the given time
   */
  private findBarIndexAtTime(bars: Bar[], timeMs: number): number {
    for (let i = 0; i < bars.length; i++) {
      if (bars[i].time >= timeMs) {
        return Math.max(0, i - 1);
      }
    }
    return bars.length - 1;
  }

  /**
   * Helper: Check if a time falls within a chart bar period
   */
  private isTimeInBar(
    timeMs: number,
    barTimeMs: number,
    chartPeriod: string
  ): boolean {
    const chartInterval: ExchangeIntervals =
      (tvToExchangeIntervalMap as Record<string, ExchangeIntervals>)[
        chartPeriod
      ] || ExchangeIntervals.oneH;
    const intervalMs =
      (timeIntervalMap as Record<ExchangeIntervals, number>)[chartInterval] ||
      60 * 60 * 1000;

    return timeMs >= barTimeMs && timeMs < barTimeMs + intervalMs;
  }
}
