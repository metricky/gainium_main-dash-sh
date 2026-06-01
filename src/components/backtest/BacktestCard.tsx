import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React from 'react';
import type { BacktestData } from '../../hooks/useBacktests';
import { formatDate } from '../../utils/formatters';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';

interface BacktestCardProps {
  backtest: BacktestData;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onView?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const BacktestCard: React.FC<BacktestCardProps> = ({
  backtest,
  isSelected = false,
  onSelect,
  onView,
  /* onDelete, */
  className = '',
}) => {
  // Extract display data
  let pair = 'Unknown';
  if (backtest.symbol) {
    pair = backtest.symbol;
  } else if (backtest.settings?.pair) {
    if (Array.isArray(backtest.settings.pair)) {
      pair = backtest.settings.pair[0] || 'Unknown';
    } else {
      pair = backtest.settings.pair;
    }
  } else if (backtest.baseAsset && backtest.quoteAsset) {
    pair = `${backtest.baseAsset}/${backtest.quoteAsset}`;
  }

  const name = backtest.settings?.name || backtest.note || `${pair} Backtest`;
  const strategy = backtest.settings?.strategy || 'DCA';
  const netProfit = backtest.financial?.netProfitTotal || 0;
  const annualReturn = backtest.financial?.annualizedReturn || 0;
  const maxDrawdown = backtest.financial?.maxDrawDown || 0;

  // Use time field for creation date if available
  const createdDate = formatDate(
    backtest.time
      ? new Date(backtest.time).toISOString()
      : backtest.created || new Date().toISOString()
  );

  // Calculate bot working time display
  const workingTime = backtest.duration?.botWorkingTime;
  const workingTimeDisplay = workingTime
    ? `${workingTime.d || 0}d ${workingTime.h || 0}h`
    : 'N/A';

  return (
    <Card
      className={`relative transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''} ${className}`}
    >
      <CardContent className="p-md">
        {/* Header with selection and actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-sm flex-1 min-w-0">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className="shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate" title={name}>
                {name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {pair} • {strategy}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {backtest.serverSide && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Server
              </Badge>
            )}
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0"
                onClick={onView}
              >
                <BarChart3 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-sm mb-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Net Profit</div>
            <div
              className="text-lg font-semibold flex items-center gap-1"
              style={{
                color:
                  netProfit >= 0
                    ? 'oklch(var(--profit))'
                    : 'oklch(var(--loss))',
              }}
            >
              <DollarSign className="w-3 h-3" />
              {netProfit >= 0 ? '+' : ''}
              {netProfit.toFixed(0)}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Annual Return
            </div>
            <div
              className="text-lg font-semibold flex items-center gap-1"
              style={{
                color:
                  annualReturn >= 0
                    ? 'oklch(var(--profit))'
                    : 'oklch(var(--loss))',
              }}
            >
              <Percent className="w-3 h-3" />
              {annualReturn >= 0 ? '+' : ''}
              {annualReturn.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Performance indicators */}
        <div className="grid grid-cols-2 gap-sm mb-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Max Drawdown
            </div>
            <div
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: 'oklch(var(--loss))' }}
            >
              <TrendingDown className="w-3 h-3" />
              {maxDrawdown.toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Working Time
            </div>
            <div className="text-sm font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {workingTimeDisplay}
            </div>
          </div>
        </div>

        {/* Footer with date and period */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-xs text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{createdDate}</span>
          </div>

          <div className="text-xs text-muted-foreground">
            {backtest.duration?.periodName || 'N/A'}
          </div>
        </div>

        {/* Performance trend indicator */}
        <div className="absolute top-2 right-2">
          {netProfit >= 0 ? (
            <TrendingUp
              className="w-4 h-4 opacity-20"
              style={{ color: 'oklch(var(--profit))' }}
            />
          ) : (
            <TrendingDown
              className="w-4 h-4 opacity-20"
              style={{ color: 'oklch(var(--loss))' }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BacktestCard;
