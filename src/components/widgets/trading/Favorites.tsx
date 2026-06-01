import React, { useState } from 'react';
import WidgetWrapper, { type WidgetMenuActions } from '../WidgetWrapper';
import CoinPair from '../shared/CoinPair';

export interface FavoritesProps {
  widgetId?: string;
  isEditable?: boolean;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: WidgetMenuActions;
  _data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

const Favorites: React.FC<FavoritesProps> = ({
  widgetId = 'favorites',
  isEditable = false,
  onCollapse,
  onTabMove,
  menuActions,
  settings: _settings,
}) => {
  // State for selected favorite coins
  const [selectedCoins, setSelectedCoins] = useState<string[]>([
    'BTC',
    'ETH',
    'BNB',
  ]);

  const handleRemoveCoin = (coinSymbol: string) => {
    setSelectedCoins((prev) => {
      const newSelection = prev.filter((symbol) => symbol !== coinSymbol);
      // If removing this coin would result in an empty array, default to BTC
      return newSelection.length === 0 ? ['BTC'] : newSelection;
    });
  };

  const metadata = {
    id: widgetId,
    type: 'favorites',
    title: 'Favorites',
    header: false, // This widget has no header
    hasOptions: false,
  };

  const wrapperProps = {
    metadata,
    onRemove: () => {},
    isEditable,
    isCollapsible: false,
    ...(onCollapse && { onCollapse }),
    ...(onTabMove && { onTabMove }),
    ...(menuActions && { menuActions }),
  };

  // Example coinPairs data (replace with your real data source)
  const coinPairs = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
  ];

  return (
    <WidgetWrapper {...wrapperProps}>
      <div className="h-full flex flex-col pr-8">
        <div className="flex gap-xs flex-wrap">
          {selectedCoins.map((itemSymbol) => {
            const pair = coinPairs.find(
              (p) => itemSymbol === p.baseAsset || itemSymbol === p.symbol
            );
            if (!pair) return null;
            return (
              <div
                key={pair.symbol}
                className="bg-card border border-border rounded-lg p-xs flex items-center gap-xs min-w-0"
              >
                <div className="flex items-center gap-xs flex-1 min-w-0">
                  <CoinPair
                    baseAsset={pair.baseAsset}
                    quoteAsset={pair.quoteAsset}
                    iconSize="sm"
                    showText={false}
                  />
                  <span className="text-foreground text-xs font-medium truncate">
                    {pair.baseAsset}/{pair.quoteAsset}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveCoin(pair.symbol)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default Favorites;
