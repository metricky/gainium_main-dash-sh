import { cn } from '@/lib/utils';
import { getStrategyVariant } from '@/utils/botUtils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';
import { Chip } from './chip';

interface StrategyChipProps {
  strategy: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  chipStyle?: 'solid' | 'outline' | 'ghost' | 'soft';
  iconOnly?: boolean;
  className?: string;
}

export const StrategyChip: React.FC<StrategyChipProps> = ({
  strategy,
  size = 'sm',
  chipStyle = 'solid',
  iconOnly = false,
  className,
}) => {
  const variant = getStrategyVariant(strategy);
  const strategyLower = strategy.toLowerCase();

  // Determine if we should show trending icon
  const showTrendIcon = ['long', 'short'].includes(strategyLower);
  const isLong = strategyLower === 'long';

  if (iconOnly) {
    const boxSizeMap = {
      xs: 'w-6 h-6',
      sm: 'w-7 h-7',
      md: 'w-8 h-8',
      lg: 'w-9 h-9',
      xl: 'w-10 h-10',
    };

    const iconSizeMap: Record<string, number> = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    };

    const bgColor =
      variant === 'success'
        ? '#22c55e'
        : variant === 'error'
          ? '#ef4444'
          : '#6b7280';

    return (
      <div
        className={cn(
          'rounded-md flex items-center justify-center',
          boxSizeMap[size],
          className
        )}
        style={{ backgroundColor: bgColor }}
        title={strategy}
        aria-label={strategy}
      >
        {isLong ? (
          <TrendingUp className="text-white" size={iconSizeMap[size]} />
        ) : (
          <TrendingDown className="text-white" size={iconSizeMap[size]} />
        )}
      </div>
    );
  }

  return (
    <Chip
      variant={variant}
      size={size}
      chipStyle={chipStyle}
      className={cn(
        'font-semibold',
        chipStyle === 'solid' && strategyLower !== 'neutral' && 'text-white',
        chipStyle === 'solid' &&
          strategyLower === 'neutral' &&
          'text-foreground dark:text-muted-foreground',
        className
      )}
    >
      {showTrendIcon && (
        <span
          className={cn(
            'shrink-0',
            size === 'xs' && 'text-xs',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg'
          )}
        >
          {isLong ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
        </span>
      )}
      {strategy.toUpperCase()}
    </Chip>
  );
};
