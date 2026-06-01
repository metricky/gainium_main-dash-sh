import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Info,
  Loader2,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useMarketData } from '../../hooks/useMarketData';
import TradingChart from '../widgets/trading/TradingChart';
import { cn } from '@/lib/utils';

interface MarketOverviewProps {
  pair: string;
  exchange: string;
  className?: string;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  pair,
  exchange,
  className,
}) => {
  const { marketData, pairInfo, isLoading, error } = useMarketData(
    pair,
    exchange
  );

  if (!pair || !exchange) {
    return (
      <Card className={cn('p-md bg-muted/30', className)}>
        <div className="flex items-center gap-xs text-muted-foreground">
          <Info className="w-4 h-4" />
          <span className="text-sm">
            Select a trading pair to view market overview
          </span>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={cn('p-md', className)}>
        <div className="flex items-center gap-xs">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Market Overview</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading market data...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-md border-destructive/20', className)}>
        <div className="flex items-center gap-xs mb-2">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Market Overview</h3>
        </div>
        <div className="text-sm text-destructive">
          Unable to load market data for {pair}
        </div>
      </Card>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const isPositive = (marketData?.priceChangePercentage24h ?? 0) >= 0;

  return (
    <Card className={cn('p-md', className)}>
      <div className="flex items-center gap-xs mb-4">
        <BarChart3 className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">Market Overview</h3>
        <Badge variant="outline" className="ml-auto text-xs">
          {exchange.toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-md">
        {/* Trading Pair Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold">{pair}</span>
            {marketData?.marketCapRank && (
              <Badge variant="secondary" className="text-xs">
                Rank #{marketData.marketCapRank}
              </Badge>
            )}
          </div>

          {marketData && (
            <div className="grid grid-cols-2 gap-md">
              <div>
                <div className="text-sm text-muted-foreground">
                  Current Price
                </div>
                <div className="text-xl font-bold">
                  {formatPrice(marketData.currentPrice)}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">24h Change</div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-xl font-bold',
                    isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatPercentage(marketData.priceChangePercentage24h)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        {marketData?.categories && marketData.categories.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Categories
              </div>
              <div className="flex flex-wrap gap-1">
                {marketData.categories.slice(0, 3).map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category}
                  </Badge>
                ))}
                {marketData.categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{marketData.categories.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        {/* Trading Chart Widget */}
        <Separator />
        <div>
          <div className="text-sm text-muted-foreground mb-3">Price Chart</div>
          <div className="h-64 rounded-lg overflow-hidden">
            <TradingChart
              widgetId={`market-chart-${pair}`}
              symbol={pair}
              interval="1h"
              isEditable={false}
            />
          </div>
        </div>

        {/* Pair Technical Info */}
        {pairInfo && (
          <>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Trading Limits
              </div>
              <div className="grid grid-cols-2 gap-md text-sm">
                <div>
                  <span className="text-muted-foreground">Min Order:</span>
                  <span className="ml-1 font-medium">
                    {pairInfo.baseAsset.minAmount} {pairInfo.baseAsset.name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Orders:</span>
                  <span className="ml-1 font-medium">{pairInfo.maxOrders}</span>
                </div>
              </div>

              {pairInfo.crossAvailable && (
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 border-green-600"
                  >
                    Cross Margin Available
                  </Badge>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
