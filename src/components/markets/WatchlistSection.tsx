import { usePriceStream } from '@/hooks/usePriceStream';
import { type TradingPair } from '@/hooks/useTradingPairs';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { Plus, Settings, TrendingDown, TrendingUp, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import CoinIcon from '../widgets/shared/CoinIcon';
import PairSelector from '../widgets/trading/PairSelector';
import { useTradingPairsFromContext } from '@/contexts/ExchangeDataContext';

interface WatchlistSectionSettings {
  selectedPairs: { pair: string; exchange: string }[];
}

const WATCHLIST_SECTION_ID = 'markets-watchlist-section';

const WatchlistSection: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Use widget-specific settings for the watchlist section
  const { usePersistedState } =
    useWidgetSettings<WatchlistSectionSettings>(WATCHLIST_SECTION_ID);
  const [storedPairs, setStoredPairs] = usePersistedState('selectedPairs', [
    { pair: 'BTCUSDT', exchange: 'binance' },
    { pair: 'ETHUSDT', exchange: 'binance' },
    { pair: 'BNBUSDT', exchange: 'binance' },
    { pair: 'ADAUSDT', exchange: 'binance' },
    { pair: 'SOLUSDT', exchange: 'binance' },
    { pair: 'DOTUSDT', exchange: 'binance' },
  ]);

  // Load trading pairs data
  const { pairsByExchange } = useTradingPairsFromContext();

  // Convert stored pairs to full pair objects
  const selectedPairs = useMemo(() => {
    if (!pairsByExchange) {
      // Fallback using stored pairs directly for testing if no API data
      return storedPairs.map((storedPair) => ({
        pair: storedPair.pair,
        exchange: storedPair.exchange,
        baseAsset: {
          name: storedPair.pair.replace('USDT', ''),
          minAmount: 0,
          maxAmount: 100000,
          step: 0.01,
        },
        quoteAsset: { name: 'USDT', minAmount: 0 },
        priceAssetPrecision: 2,
        crossAvailable: true,
      }));
    }

    const allPairs: TradingPair[] = [];
    Object.values(pairsByExchange).forEach((pairs) => {
      allPairs.push(...pairs);
    });

    return storedPairs
      .map((storedPair) =>
        allPairs.find(
          (pair) =>
            pair.pair === storedPair.pair &&
            pair.exchange === storedPair.exchange
        )
      )
      .filter((pair): pair is TradingPair => pair !== undefined);
  }, [pairsByExchange, storedPairs]);

  // Setup price streaming
  const { prices } = usePriceStream(selectedPairs, {
    enableStream: true,
  });

  // Handle adding a new pair
  const handlePairAdd = useCallback(
    (pair: TradingPair) => {
      const newPair = { pair: pair.pair, exchange: pair.exchange };
      if (
        !storedPairs.some(
          (p) => p.pair === newPair.pair && p.exchange === newPair.exchange
        )
      ) {
        setStoredPairs([...storedPairs, newPair]);
      }
    },
    [storedPairs, setStoredPairs]
  );

  // Handle removing a pair
  const handlePairRemove = useCallback(
    (pairSymbol: string) => {
      setStoredPairs(storedPairs.filter((p) => p.pair !== pairSymbol));
    },
    [storedPairs, setStoredPairs]
  );

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Watchlist</h2>
        <div className="flex items-center gap-sm">
          <Badge variant="secondary" className="text-xs">
            {selectedPairs.length} pairs
          </Badge>
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-md">
                <h4 className="text-sm font-medium mb-3">Watchlist Settings</h4>

                {/* Current pairs */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">
                    Selected Pairs
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedPairs.map((pair) => (
                      <Badge
                        key={`${pair.exchange}-${pair.pair}`}
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        {pair.pair}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handlePairRemove(pair.pair)}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Add pairs section */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">
                    Add Pairs
                  </h5>
                  <PairSelector
                    onPairSelect={handlePairAdd}
                    selectedPairs={storedPairs}
                    widgetId={`${WATCHLIST_SECTION_ID}-settings`}
                  >
                    <Button size="sm" variant="outline" className="w-full">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Trading Pair
                    </Button>
                  </PairSelector>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedPairs.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-xs">
          {selectedPairs.map((pair) => {
            const price = prices[`${pair.exchange}:${pair.pair}`];
            const change24h = price?.change24h || 0;
            const isPositive = change24h > 0;
            const baseSymbol = pair.pair.replace('USDT', '');

            return (
              <Card
                key={`${pair.exchange}-${pair.pair}`}
                className="relative group hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 w-3 h-3 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePairRemove(pair.pair);
                    }}
                  >
                    <X className="h-2 w-2" />
                  </Button>

                  <div className="flex items-center gap-1.5 mb-1">
                    <CoinIcon symbol={baseSymbol} size="w-4 h-4" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs truncate">
                        {pair.pair}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold">
                      {price ? (
                        `$${price.price.toLocaleString('en-US', {
                          minimumFractionDigits: price.price < 1 ? 4 : 2,
                          maximumFractionDigits: price.price < 1 ? 4 : 2,
                        })}`
                      ) : (
                        <span className="text-muted-foreground">
                          Loading...
                        </span>
                      )}
                    </div>
                    <div className="w-12 h-4 flex items-center justify-end">
                      {/* Placeholder for sparkline - could be added later */}
                      <div className="text-xs text-muted-foreground">
                        {pair.exchange}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <Badge
                      variant={isPositive ? 'default' : 'destructive'}
                      className={`text-xs px-1 py-0 h-auto ${
                        isPositive
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-2 h-2 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-2 h-2 mr-0.5" />
                      )}
                      {isPositive ? '+' : ''}
                      {Math.abs(change24h).toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-xl text-center">
            <div className="text-muted-foreground">
              <p className="mb-2">No trading pairs in watchlist</p>
              <p className="text-sm">
                Add pairs to your watchlist to track their prices
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WatchlistSection;
