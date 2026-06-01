/* eslint-disable spacing/no-hardcoded-font-size */
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  getCompactRelativeTime,
  isGeneratedAtStale,
} from '@/utils/timeUtils';

interface PresetCardProps {
  label: string;
  explanation: string;
  /** Free-form metrics line shown under the explanation. */
  metricsLine: ReactNode;
  /** Optional chip (e.g. "Target dip 12.3%") shown next to the label. */
  targetChip?: ReactNode;
  /**
   * Optional backtested return (%) to display in a chip next to the label.
   * Color-coded by sign. Used when a curated preset exists for this
   * (coin, exchange, tier).
   */
  roi?: number | null;
  /**
   * Optional ms-epoch timestamp of when the curated row was produced.
   * Renders a faint "Generated Xm ago" caption; switches to
   * `text-warning` once >24h old so users see staleness at a glance.
   * Null/undefined hides the caption entirely.
   */
  generatedAt?: number | null;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Radio-button card used by Quick Setup preset pickers. Chrome only —
 * the consumer supplies a `metricsLine` so different bot types can
 * surface different metrics (DCA shows deviation/SOs/step/TP; grid
 * will show range/levels/step).
 */
export const PresetCard: React.FC<PresetCardProps> = ({
  label,
  explanation,
  metricsLine,
  targetChip,
  roi,
  generatedAt,
  isSelected,
  onClick,
}) => {
  const generatedCaption =
    typeof generatedAt === 'number' && Number.isFinite(generatedAt) ? (
      <span
        className={cn(
          'text-[10px] leading-snug',
          isGeneratedAtStale(generatedAt)
            ? 'text-warning'
            : 'text-muted-foreground/70'
        )}
        title={new Date(generatedAt).toLocaleString()}
      >
        Generated {getCompactRelativeTime(generatedAt)} ago
      </span>
    ) : null;
  const roiChip =
    typeof roi === 'number' && Number.isFinite(roi) ? (
      <span
        className={cn(
          'rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
          roi >= 0
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 text-red-600 dark:text-red-400'
        )}
        title="Backtested 30-day return from curated preset"
      >
        Return {roi >= 0 ? '+' : ''}
        {roi.toFixed(2)}%
      </span>
    ) : null;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1.5 rounded-md px-md py-sm text-left transition-all shadow-sm',
        isSelected
          ? 'bg-primary/10 ring-1 ring-primary/50 shadow-md'
          : 'bg-muted hover:bg-accent hover:shadow-md'
      )}
    >
      <div className="flex items-center justify-between gap-sm">
        <span
          className={cn('text-sm font-semibold', isSelected && 'text-primary')}
        >
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {roiChip}
          {targetChip}
        </div>
      </div>
      <span className="text-muted-foreground text-[11px] leading-snug">
        {explanation}
      </span>
      <div className="text-muted-foreground text-[11px] leading-snug tabular-nums">
        {metricsLine}
      </div>
      {generatedCaption}
    </button>
  );
};
