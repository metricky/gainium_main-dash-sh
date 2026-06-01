import { cn } from '@/lib/utils';
import React from 'react';

interface ProfitValueProps {
  value: number;
  className?: string;
  showSign?: boolean;
  formatAsCurrency?: boolean;
  isPercentage?: boolean;
  size?: 'sm' | 'base' | 'lg';
}

export const ProfitValue: React.FC<ProfitValueProps> = ({
  value,
  className = '',
  showSign = true,
  formatAsCurrency = true,
  isPercentage = false,
  size = 'base',
}) => {
  const formatValue = (val: number) => {
    if (isPercentage) {
      return `${val.toFixed(1)}%`;
    }

    if (formatAsCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    }

    return val.toString();
  };

  const getColorClass = () => {
    if (value > 0) return 'text-profit';
    if (value < 0) return 'text-loss';
    return 'text-foreground';
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const displayValue = formatValue(Math.abs(value));
  const sign = showSign && value !== 0 ? (value > 0 ? '+' : '-') : '';

  return (
    <span
      className={cn('font-bold', getColorClass(), getSizeClass(), className)}
    >
      {sign}
      {displayValue}
    </span>
  );
};

interface ProfitBadgeProps {
  value: number;
  className?: string;
  showSign?: boolean;
}

export const ProfitBadge: React.FC<ProfitBadgeProps> = ({
  value,
  className = '',
  showSign = true,
}) => {
  const getBadgeClass = () => {
    if (value > 0) return 'bg-profit text-white';
    if (value < 0) return 'bg-loss text-white';
    return 'bg-muted text-muted-foreground';
  };

  const sign = showSign && value !== 0 ? (value > 0 ? '+' : '') : '';
  const displayValue = `${Math.abs(value).toFixed(1)}%`;

  return (
    <div
      className={cn(
        'text-xs px-1.5 py-0.5 rounded self-start',
        getBadgeClass(),
        className
      )}
    >
      {sign}
      {displayValue}
    </div>
  );
};

export default ProfitValue;
