import { clsx } from 'clsx';
import React from 'react';

export interface ProfitLossPercChipProps {
  value: number;
  showSign?: boolean;
  showPercent?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
  textValue?: string | undefined; // Optional text override for privacy mode
}

/**
 * ProfitLossPercChip component for displaying percentage changes
 * Uses profit/loss colors from CSS variables
 * - Positive values: profit color (green)
 * - Negative values: loss color (red)
 */
const ProfitLossPercChip: React.FC<ProfitLossPercChipProps> = ({
  value,
  showSign = true,
  showPercent = true,
  size = 'xs',
  compact = false,
  className = '',
  textValue,
}) => {
  // If textValue is provided and not empty (e.g., for privacy mode), use it
  if (textValue) {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center rounded-md font-medium',
          compact
            ? 'text-xs px-1 py-0.5'
            : size === 'xs'
              ? 'text-xs px-1 py-0.5'
              : size === 'sm'
                ? 'text-xs px-2 py-1'
                : size === 'md'
                  ? 'text-sm px-3 py-1.5'
                  : 'text-base px-4 py-2',
          'bg-muted/50 text-muted-foreground border border-muted/30',
          className
        )}
      >
        {textValue}
      </span>
    );
  }

  // Treat values very close to zero as zero to avoid displaying "-0.00%"
  // Use a very small epsilon to only catch actual rounding errors, not real small values
  const EPSILON = 0.001;
  const isZeroRounded = Math.abs(value) < EPSILON;
  const isProfit = value > 0 && !isZeroRounded;

  // Size classes
  const sizeClasses = {
    xs: 'text-xs px-1 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  // Determine the effective size based on compact prop
  const effectiveSize = compact ? 'xs' : size;

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-medium',
        sizeClasses[effectiveSize],
        {
          // Profit styling
          'bg-profit/10 text-profit border border-profit/20': isProfit,
          // Loss styling
          'bg-loss/10 text-loss border border-loss/20':
            !isProfit && !isZeroRounded,
          // Neutral styling for zero
          'bg-muted/50 text-muted-foreground border border-muted/30':
            isZeroRounded,
        },
        className
      )}
    >
      {showSign && !isZeroRounded && (isProfit ? '+' : '-')}
      {(isZeroRounded ? 0 : Math.abs(value)).toFixed(2)}
      {showPercent && '%'}
    </span>
  );
};

export { ProfitLossPercChip };
export default ProfitLossPercChip;
