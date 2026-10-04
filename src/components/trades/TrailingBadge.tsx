import { cn } from '@/lib/utils';
import { TrailingModeEnum } from '@/types';
import { formatNumber } from '@/utils/numberFormatter';
import React from 'react';
import { Tooltip } from '../ui/tooltip';

export interface TrailingBadgeProps {
  /** `deal.trailingMode` — the engine's armed-trailing latch. */
  mode?: string | undefined;
  /** `deal.trailingLevel` — a price, or Combo TTP's deal-profit percentage. */
  level?: number | undefined;
  levelUnit?: 'price' | 'percent';
  /** Quote asset, appended to the price in the tooltip. */
  quoteAsset?: string | undefined;
  className?: string;
}

/**
 * "Trailing" marker for a deal, shown under the status dot in the deals table
 * and on the deal card.
 *
 * Reads the persisted armed state rather than inferring it from configuration.
 * DCA levels are positive prices; our Combo TTP levels are signed percentages
 * of deal usage, so zero and negative levels are valid there.
 */
export const TrailingBadge: React.FC<TrailingBadgeProps> = ({
  mode,
  level,
  levelUnit = 'price',
  quoteAsset,
  className,
}) => {
  if (!mode || typeof level !== 'number' || !Number.isFinite(level)) return null;
  if (levelUnit === 'price' && level <= 0) return null;

  const isSl = mode === TrailingModeEnum.tsl;
  const label = isSl ? 'Trailing SL' : 'Trailing TP';
  const price = `${formatNumber(level)}${quoteAsset ? ` ${quoteAsset}` : ''}`;
  const tooltip = levelUnit === 'percent'
    ? `Trailing take profit is active — the deal closes when its profit falls back to ${formatNumber(level)}%. The level follows the highest deal-profit percentage reached.`
    : isSl
      ? `Trailing stop loss is active — the deal closes if price falls to ${price}. The level follows the best price reached.`
      : `Trailing take profit is active — the deal closes if price falls to ${price}. The level follows the best price reached.`;

  return (
    <Tooltip tooltip={tooltip}>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-medium leading-none whitespace-nowrap',
          isSl ? 'text-loss' : 'text-profit',
          className
        )}
        aria-label={tooltip}
      >
        <span
          className="inline-block size-1 rounded-full bg-current"
          aria-hidden
        />
        {label}
      </span>
    </Tooltip>
  );
};
