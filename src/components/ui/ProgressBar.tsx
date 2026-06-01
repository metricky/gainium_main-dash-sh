import { cn } from '@/lib/utils';
import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  size = 'md',
  showPercentage = false,
  variant = 'default',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: showPercentage ? 'h-4' : 'h-1',
    md: showPercentage ? 'h-5' : 'h-2',
    lg: showPercentage ? 'h-6' : 'h-3',
  };

  // Dynamic color based on variant or percentage
  const getBarColor = () => {
    if (variant !== 'default') {
      const variantClasses = {
        primary: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
      };
      return variantClasses[variant];
    }

    // Auto color based on percentage for default variant
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-card rounded-full overflow-hidden relative',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            getBarColor()
          )}
          style={{ width: `${percentage}%` }}
        />
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground/80">
            {percentage.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};
