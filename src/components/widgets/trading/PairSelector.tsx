import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTradingPairsFromContext } from '@/contexts/ExchangeDataContext';
import { type TradingPair } from '@/hooks/useTradingPairs';
import { useWidgetPortal } from '@/hooks/useWidgetPortal';
import { Plus, Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PairSelectorProps {
  onPairSelect: (pair: TradingPair) => void;
  selectedPairs?: Array<{ pair: string; exchange: string }>;
  children?: React.ReactNode;
  widgetId?: string; // Add widgetId prop for portal targeting
  mode?: 'single' | 'multiple'; // Add mode to control selection behavior
  title?: string; // Custom title for the modal
}

const PairSelector: React.FC<PairSelectorProps> = ({
  onPairSelect,
  selectedPairs = [],
  children,
  widgetId = 'pair-selector',
  mode = 'multiple',
  title,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { pairsByExchange, isLoading, error } = useTradingPairsFromContext();

  // Get hybrid portal configuration
  const { portalTarget, zIndexClass, shouldUsePortal } = useWidgetPortal(
    widgetId || 'default'
  ); // Filter pairs based on search term and exclude already selected pairs
  const filteredPairsByExchange = useMemo(() => {
    if (!pairsByExchange) return {};

    const filtered: typeof pairsByExchange = {};

    Object.entries(pairsByExchange).forEach(([exchange, pairs]) => {
      const filteredPairs = pairs.filter((pair) => {
        // In multiple mode, skip if already selected
        if (
          mode === 'multiple' &&
          selectedPairs.some(
            (selected) =>
              selected.pair === pair.pair && selected.exchange === pair.exchange
          )
        ) {
          return false;
        }

        // Filter by search term
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            pair.pair.toLowerCase().includes(term) ||
            pair.baseAsset.name.toLowerCase().includes(term) ||
            pair.quoteAsset.name.toLowerCase().includes(term)
          );
        }
        return true;
      });

      if (filteredPairs.length > 0) {
        filtered[exchange] = filteredPairs;
      }
    });

    return filtered;
  }, [pairsByExchange, searchTerm, selectedPairs, mode]);

  const handlePairSelect = (pair: TradingPair) => {
    onPairSelect(pair);
    setIsOpen(false);
    setSearchTerm(''); // Clear search after selection
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const exchangeNames = Object.keys(filteredPairsByExchange).sort();

  // Modal content component
  const modalContent = (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md ${zIndexClass}`}
      onClick={handleBackdropClick}
    >
      <div
        className="relative bg-card rounded-lg shadow-lg border border-border w-full max-w-2xl max-h-[600px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-sm hover:bg-muted/50 transition-colors z-10"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="p-lg">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {title ||
              (mode === 'single' ? 'Select Trading Pair' : 'Add Trading Pairs')}
          </h2>

          <div className="space-y-md">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  mode === 'single'
                    ? 'Search pairs (e.g., BTC, ETHUSDT...)'
                    : 'Search pairs (e.g., BTC, ETHUSDT, ethereum...)'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                autoFocus={mode === 'single'}
              />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">
                  Loading trading pairs...
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex justify-center py-8">
                <div className="text-destructive">
                  Failed to load trading pairs. Please try again.
                </div>
              </div>
            )}

            {/* Pairs List */}
            {!isLoading && !error && (
              <div className="max-h-[400px] overflow-y-auto space-y-md">
                {exchangeNames.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm
                      ? 'No pairs found matching your search.'
                      : 'No available pairs to add.'}
                  </div>
                ) : (
                  exchangeNames.map((exchangeName) => (
                    <div key={exchangeName} className="space-y-xs">
                      <div className="flex items-center gap-xs">
                        <Badge variant="secondary" className="text-xs">
                          {exchangeName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {filteredPairsByExchange[exchangeName].length} pairs
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xs">
                        {filteredPairsByExchange[exchangeName].map((pair) => (
                          <Button
                            key={`${pair.exchange}-${pair.pair}`}
                            variant="ghost"
                            className="justify-start h-auto p-sm text-left"
                            onClick={() => handlePairSelect(pair)}
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="font-medium text-sm">
                                {pair.pair}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {pair.baseAsset.name}/{pair.quoteAsset.name}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger Button */}
      {children ? (
        <Button
          asChild
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
        >
          {children as React.ReactElement}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-xs"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Pair
        </Button>
      )}

      {/* Modal - Use portal in normal mode, direct rendering in fullscreen */}
      {isOpen &&
        (shouldUsePortal
          ? createPortal(modalContent, portalTarget)
          : modalContent)}
    </>
  );
};

export default PairSelector;
