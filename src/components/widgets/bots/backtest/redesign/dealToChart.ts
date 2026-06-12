/**
 * dealToChart.ts — turn a resolved {@link DealVM} into the props the
 * `CandleChart` SVG component renders: a reconstructed price path, the
 * horizontal reference lines (entry / avg / tp|close), and the deal markers
 * (entry / DCA fills / close).
 *
 * Port of the prototype `dealHelpers.jsx`, with two structural differences:
 *
 *  1. The prototype slices a single global `CANDLES` array by the deal's
 *     `startIdx`/`endIdx` (plus padding) and maps global → local indices.
 *     The real `DealVM` already carries *only this deal's* price series in
 *     `deal.candles[]` (reconstructed from `PreparedDeal.transactions[]` in
 *     the adapter). So there is no global slice here — the deal's candles ARE
 *     the window.
 *
 *  2. There is no real OHLC data on a backtest result, so `deal.candles[]`
 *     may be a degenerate price path (each bar `o===h===l===c`) or even
 *     empty. This function degrades gracefully: markers carry their `t`
 *     (epoch ms) and `CandleChart` resolves the x-position to the nearest
 *     candle by time itself; the reference lines always render so the panel
 *     is never blank even for a one-transaction deal.
 *
 * Colors use the REAL design tokens (see contract §3 / §4): entry → profit,
 * avg → muted-foreground, tp/close → loss, dca → primary.
 */

import type { PriceLineVM, MarkerVM } from './charts';
import type { DealCandleVM, DealVM } from './viewModel';

/** Output shape consumed by `CandleChart` (charts.tsx). */
export interface DealChartData {
  candles: DealCandleVM[];
  lines: PriceLineVM[];
  markers: MarkerVM[];
}

/**
 * Build the `{ candles, lines, markers }` payload for one deal's chart.
 *
 * The horizontal reference lines (contract §3):
 *   - Start (entry)            → profit, solid
 *   - Avg (averaged entry)     → muted-foreground, dashed + faint
 *   - win  → "TP"    @ closePrice → loss, dashed
 *   - loss → "Close" @ closePrice → loss, dashed
 *   - open → "TP"    @ tp         → loss, dashed + faint (skipped if tp null)
 *
 * Markers (contract §3):
 *   - entry: at `entryIdx` / `startTime`, price `entry`
 *   - dca:   for each filled safety rung with a fill time at/before close
 *   - close: when the deal is closed, at `closeIdx` / `closeTime`,
 *            price `closePrice`, flagged `win`
 */
export function dealToChart(deal: DealVM): DealChartData {
  const candles = deal.candles ?? [];

  // --- reference lines ---------------------------------------------------
  const lines: PriceLineVM[] = [
    {
      price: deal.entry,
      color: 'var(--color-profit)',
      label: 'Start',
      dash: '0',
    },
    {
      price: deal.avg,
      color: 'var(--color-muted-foreground)',
      label: 'Avg',
      dash: '4 3',
      faint: true,
    },
  ];

  if (deal.out === 'win' && deal.closePrice != null) {
    lines.push({
      price: deal.closePrice,
      color: 'var(--color-loss)',
      label: 'TP',
      dash: '5 3',
    });
  } else if (deal.out === 'loss' && deal.closePrice != null) {
    lines.push({
      price: deal.closePrice,
      color: 'var(--color-loss)',
      label: 'Close',
      dash: '5 3',
    });
  } else if (deal.out === 'open' && deal.tp != null) {
    lines.push({
      price: deal.tp,
      color: 'var(--color-loss)',
      label: 'TP',
      dash: '5 3',
      faint: true,
    });
  }

  // --- markers -----------------------------------------------------------
  // Markers carry only their epoch-ms `t`; `CandleChart` maps each to the
  // nearest candle column itself, so no index is precomputed here.
  const markers: MarkerVM[] = [];

  // entry
  markers.push({
    t: deal.startTime,
    price: deal.entry,
    kind: 'entry',
  });

  // DCA fills — only rungs that actually filled, with a fill time at or
  // before the deal closed (open deals use +Infinity as the cutoff).
  const closeCutoff = deal.closeTime ?? Number.POSITIVE_INFINITY;
  deal.safety
    .filter((s) => s.filled && s.at != null && s.at <= closeCutoff)
    .forEach((s) => {
      markers.push({
        t: s.at as number,
        price: s.price,
        kind: 'dca',
      });
    });

  // close — only for closed deals with a resolved close price.
  if (deal.status !== 'open' && deal.closePrice != null) {
    markers.push({
      t: deal.closeTime ?? deal.startTime,
      price: deal.closePrice,
      kind: 'close',
      win: deal.out === 'win',
    });
  }

  return { candles, lines, markers };
}

/**
 * Legend rows for the marker key, rendered alongside the per-deal chart.
 * Colors are the real tokens; `diamond` flags the DCA glyph (rotated square)
 * vs the default circle.
 */
export interface MarkerLegendItem {
  color: string;
  label: string;
  diamond?: boolean;
}

export const MARKER_LEGEND: MarkerLegendItem[] = [
  { color: 'var(--color-profit)', label: 'Start order' },
  { color: 'var(--primary)', label: 'Safety order (DCA)', diamond: true },
  { color: 'var(--color-muted-foreground)', label: 'Avg price' },
  { color: 'var(--color-loss)', label: 'Take-profit / close' },
];
