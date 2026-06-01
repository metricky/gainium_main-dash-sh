import { usePriceStream } from '@/hooks/usePriceStream';
import { type TradingPair } from '@/hooks/useTradingPairs';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { Plus, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { ProfitLossPercChip } from '../../ui/chip/ProfitLossPercChip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import CoinIcon from '../shared/CoinIcon';
import PairSelector from '../trading/PairSelector';
import { useTradingPairsFromContext } from '@/contexts/ExchangeDataContext';

interface WatchlistNavigationSettings {
  selectedPairs: { pair: string; exchange: string }[];
}

interface WatchlistNavigationViewProps {
  widgetId: string;
  compact?: boolean;
}

const WatchlistNavigationView: React.FC<WatchlistNavigationViewProps> = ({
  widgetId,
  compact: _compact = false,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Listen for widget options event from the WidgetsManager
  useEffect(() => {
    const handleWidgetOptions = (event: CustomEvent) => {
      if (event.detail?.widgetId === widgetId && event.detail?.isNavigation) {
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener(
      'openWidgetOptions',
      handleWidgetOptions as EventListener
    );
    return () => {
      window.removeEventListener(
        'openWidgetOptions',
        handleWidgetOptions as EventListener
      );
    };
  }, [widgetId]);

  // Use widget-specific settings
  const { usePersistedState } =
    useWidgetSettings<WatchlistNavigationSettings>(widgetId);
  const [storedPairs, _setStoredPairs] = usePersistedState('selectedPairs', [
    { pair: 'BTCUSDT', exchange: 'binance' },
    { pair: 'ETHUSDT', exchange: 'binance' },
    { pair: 'BNBUSDT', exchange: 'binance' },
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
        _setStoredPairs([...storedPairs, newPair]);
      }
    },
    [storedPairs, _setStoredPairs]
  );

  // Handle removing a pair
  const handlePairRemove = useCallback(
    (pairSymbol: string) => {
      _setStoredPairs(storedPairs.filter((p) => p.pair !== pairSymbol));
    },
    [storedPairs, _setStoredPairs]
  );

  // Display up to 6 pairs in navigation
  const displayPairs = selectedPairs.slice(0, 6);

  return (
    <>
      <div className="flex items-center gap-xs overflow-x-auto scrollbar-hide">
        {displayPairs.length > 0 ? (
          <>
            {displayPairs.map((pair) => {
              const price = prices[`${pair.pair}_${pair.exchange}`];
              const change24h = price?.change24h || 0;
              const currentPrice = price?.price || 0;
              const previousPrice = currentPrice - change24h;
              const changePercent =
                previousPrice > 0 ? (change24h / previousPrice) * 100 : 0;
              const baseSymbol = pair.pair.replace('USDT', '');

              return (
                <div
                  key={`${pair.exchange}-${pair.pair}`}
                  className="flex flex-col gap-0.5 shrink-0 cursor-pointer hover:bg-accent/50 px-1.5 py-1 rounded transition-all duration-200 hover:scale-105 min-w-[60px]"
                >
                  <div className="flex items-center gap-1 justify-center">
                    <CoinIcon symbol={baseSymbol} size="w-3 h-3" />
                    <span className="font-medium text-xs">{baseSymbol}</span>
                  </div>

                  <div className="text-xs font-medium text-center">
                    {price ? (
                      `$${price.price.toLocaleString('en-US', {
                        minimumFractionDigits: price.price < 1 ? 4 : 2,
                        maximumFractionDigits: price.price < 1 ? 4 : 2,
                      })}`
                    ) : (
                      <span className="text-muted-foreground">Loading...</span>
                    )}
                  </div>

                  {price && (
                    <div className="flex justify-center">
                      <ProfitLossPercChip
                        value={changePercent}
                        size="xs"
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {selectedPairs.length > 6 && (
              <div className="text-xs text-muted-foreground shrink-0 px-2 whitespace-nowrap">
                +{selectedPairs.length - 6} more
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-xs">
            <span className="text-sm text-muted-foreground">
              No pairs selected
            </span>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Watchlist Settings</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-md">
            {/* Current pairs */}
            <div>
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
                widgetId={`${widgetId}-navigation-settings`}
              >
                <Button size="sm" variant="outline" className="w-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Trading Pair
                </Button>
              </PairSelector>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WatchlistNavigationView;
