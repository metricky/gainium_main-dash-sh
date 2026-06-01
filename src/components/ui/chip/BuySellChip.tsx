import { clsx } from 'clsx';
import React from 'react';

export interface BuySellChipProps {
  side: 'BUY' | 'SELL';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * BuySellChip component for displaying buy/sell indicators
 * Uses profit/loss colors from CSS variables
 * - BUY: profit color (green)
 * - SELL: loss color (red)
 */
const BuySellChip: React.FC<BuySellChipProps> = ({
  side,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const isBuy = side === 'BUY';

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-medium',
        sizeClasses[size],
        {
          // Buy styling (using profit colors)
          'bg-profit/10 text-profit border border-profit/20': isBuy,
          // Sell styling (using loss colors)
          'bg-loss/10 text-loss border border-loss/20': !isBuy,
        },
        className
      )}
    >
      {showIcon && (isBuy ? '▲' : '▼')} {side}
    </span>
  );
};

export { BuySellChip };
export default BuySellChip;
