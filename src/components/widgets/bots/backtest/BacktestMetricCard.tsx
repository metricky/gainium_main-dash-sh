import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

interface BacktestMetricCardProps {
  title: string;
  value: string | number;
  isProfit?: boolean;
  isLoss?: boolean;
  subtitle?: string;
  className?: string;
}

/**
 * Large metric display card for backtest results, styled similarly to the legacy BigLabelComponent
 */
export const BacktestMetricCard: React.FC<BacktestMetricCardProps> = ({
  title,
  value,
  isProfit,
  isLoss,
  subtitle,
  className,
}) => {
  return (
    <Card
      className={cn(
        'inline-flex flex-col items-center justify-center p-1 shadow-sm transition-all min-h-0 rounded-md min-w-[140px] max-w-[260px]',
        {
          'bg-profit/10 border-profit/30 shadow-profit/20': isProfit,
          'bg-loss/10 border-loss/30 shadow-loss/20': isLoss,
          'bg-card': !isProfit && !isLoss,
        },
        className
      )}
    >
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight text-center">
        {title}
      </div>
      <div
        className={cn(
          'mt-0.5 text-lg font-bold tabular-nums leading-none text-center',
          {
            'text-profit': isProfit,
            'text-loss': isLoss,
            'text-foreground': !isProfit && !isLoss,
          }
        )}
      >
        {value}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-xs text-muted-foreground leading-tight text-center">
          {subtitle}
        </div>
      )}
    </Card>
  );
};

interface BacktestGreyMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

/**
 * Grey metric card for neutral metrics like durations, styled like the legacy GreyLabelComponent
 */
export const BacktestGreyMetricCard: React.FC<BacktestGreyMetricCardProps> = ({
  title,
  value,
  subtitle,
  className,
}) => {
  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center p-1 bg-muted/50 shadow-sm min-h-0 rounded-md',
        className
      )}
    >
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight text-center">
        {title}
      </div>
      <div className="mt-0.5 text-base font-semibold tabular-nums text-foreground leading-none">
        {value}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-xs text-muted-foreground leading-tight">
          {subtitle}
        </div>
      )}
    </Card>
  );
};
