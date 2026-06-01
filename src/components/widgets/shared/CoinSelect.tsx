import { useTradingPairsFromContext } from '@/contexts/ExchangeDataContext';
import { useBotFormState } from '@/features/bots';
import { useBotFormQuery } from '@/features/bots/widgets/BotForm/providers/BotFormQueryProvider';
import { type TradingPair } from '@/hooks/useTradingPairs';
import { type CoinListItem } from '@/types';
import { ArrowRightLeft, X as CloseIcon, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CoinIcon from './CoinIcon';
import CoinPair from './CoinPair';
import { ListModal } from './ListModal';

export interface CoinFilterPairMetadata {
  bySelectionSymbol: Record<string, TradingPair>;
  byPair: Record<string, TradingPair>;
}

export interface CoinFilterHelperToken {
  token: string;
  label: string;
  description?: string;
}

export interface CoinFilterProps {
  selectedCoins: string[];
  onCoinToggle: (coinSymbol: string) => void;
  onRemoveCoin: (coinSymbol: string) => void;
  mode?: 'coins' | 'pairs';
  /** Provider identifier (e.g. BINANCE). When supplied we filter pairs to that exchange */
  /* exchangeProvider?: string; */
  onPairsPaste?: (raw: string) => void;
  helperTokens?: CoinFilterHelperToken[];
  shouldShowAddButton?: boolean;
  showAllOption?: boolean;
}

export const CoinFilter: React.FC<CoinFilterProps> = ({
  selectedCoins,
  onCoinToggle,
  onRemoveCoin,
  mode = 'coins',
  /* exchangeProvider, */
  onPairsPaste,
  helperTokens,
  shouldShowAddButton = true,
  showAllOption = true,
}) => {
  const [showCoinDialog, setShowCoinDialog] = useState(false);
  // When the dialog is opened via the change/swap icon on the only chip,
  // picking a new coin must REPLACE the existing one, not toggle in a
  // second selection. We capture the symbol being replaced so the
  // handler can ignore stale parent closures (handleCoinToggle reads
  // `pairs` from a captured ref and would write `[old, new]`).
  const [replacingSymbol, setReplacingSymbol] = useState<string | null>(null);
  const [showAllSelected, setShowAllSelected] = useState(false);

  const {
    pairsByExchange,
    isLoading: tradingPairsLoading,
    error: tradingPairsError,
    refresh: refreshTradingPairs,
  } = useTradingPairsFromContext();

  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryPairs = useCallback(async () => {
    setIsRetrying(true);
    try {
      await refreshTradingPairs();
    } finally {
      setIsRetrying(false);
    }
  }, [refreshTradingPairs]);

  const { updateFormData } = useBotFormState();

  /* const normalizedProvider = exchangeProvider?.toUpperCase(); */
  const isPairsMode = mode === 'pairs';

  const helperModalItems = useMemo(() => {
    if (!isPairsMode || !helperTokens?.length) {
      return [] as CoinListItem[];
    }

    return helperTokens.map((token) => ({
      symbol: token.token.toUpperCase(),
      name: token.label,
      color: 'var(--color-primary)',
      ...(token.description ? { subtitle: token.description } : {}),
      isHelper: true,
    }));
  }, [helperTokens, isPairsMode]);
  // Show every pair the current exchange supports — match legacy
  // behavior. The previous redesign-only filter narrowed the modal to
  // pairs sharing the first pair's quote (long / futures) or base
  // (short / coinm). That hid valid candidates whenever the user was
  // *replacing* the only pair, especially when a stale `formData.pair`
  // (e.g. last-used `BTCUSDC` on the terminal) silently constrained
  // the search to USDC. Any "single quote currency per bot" constraint
  // should be enforced at submit time, not by hiding pairs from search.
  const { pairItems } = useBotFormQuery();

  const coinItems = useMemo(() => {
    if (isPairsMode || !pairsByExchange) {
      return [] as CoinListItem[];
    }

    const symbols = new Set<string>();
    const items: CoinListItem[] = [];

    Object.values(pairsByExchange).forEach((pairs) => {
      pairs.forEach((pair) => {
        const addSymbol = (symbol?: string) => {
          const normalizedSymbol = symbol?.toUpperCase();
          if (!normalizedSymbol || symbols.has(normalizedSymbol)) {
            return;
          }
          symbols.add(normalizedSymbol);
          items.push({
            symbol: normalizedSymbol,
            name: normalizedSymbol,
            color: 'var(--color-primary)',
          });
        };

        addSymbol(pair.baseAsset?.name);
        addSymbol(pair.quoteAsset?.name);
      });
    });

    return items.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [isPairsMode, pairsByExchange]);

  const modalItems = useMemo(() => {
    if (isPairsMode) {
      return [...helperModalItems, ...pairItems] as CoinListItem[];
    }
    return coinItems;
  }, [coinItems, helperModalItems, isPairsMode, pairItems]);

  const VISIBLE_SELECTION_LIMIT = 10;

  const displayedSelectedCoins = useMemo(() => {
    if (showAllSelected || selectedCoins.length <= VISIBLE_SELECTION_LIMIT) {
      return selectedCoins;
    }
    return selectedCoins.slice(0, VISIBLE_SELECTION_LIMIT);
  }, [selectedCoins, showAllSelected]);

  const hiddenCount = selectedCoins.length - displayedSelectedCoins.length;
  const canCollapse =
    showAllSelected && selectedCoins.length > VISIBLE_SELECTION_LIMIT;

  useEffect(() => {
    if (selectedCoins.length <= VISIBLE_SELECTION_LIMIT && showAllSelected) {
      setShowAllSelected(false);
    }
  }, [selectedCoins.length, showAllSelected]);

  const itemLookup = useMemo(() => {
    return modalItems.reduce<Record<string, CoinListItem>>((acc, item) => {
      acc[item.symbol] = item;
      return acc;
    }, {});
  }, [modalItems]);

  // Prepare items for the ListModal based on mode
  const listModalItems = useMemo(() => {
    const header = {
      symbol: 'ALL',
      name: isPairsMode ? 'All Pairs' : 'All Coins',
      icon: '📊',
      color: 'var(--color-primary)',
      subtitle: isPairsMode ? 'All trading pairs' : 'All assets',
    } as const;

    if (modalItems.length === 0) {
      return showAllOption ? [header] : [];
    }

    return [
      ...(showAllOption ? [header] : []),
      ...modalItems.map((item) => ({
        symbol: item.symbol,
        name: item.name,
        icon: '',
        color: item.color,
        ...(item.baseAsset && item.quoteAsset
          ? { baseAsset: item.baseAsset, quoteAsset: item.quoteAsset }
          : {}),
        ...(item.subtitle ? { subtitle: item.subtitle } : {}),
        ...(item.isHelper ? { isHelper: true } : {}),
      })),
    ];
  }, [modalItems, isPairsMode, showAllOption]);

  const isLastCoin = selectedCoins.length === 1;
  const changeLabel = isPairsMode ? 'Change pair' : 'Change coin';

  const openChangeDialog = (symbol: string) => {
    setReplacingSymbol(symbol);
    setShowCoinDialog(true);
  };

  const handleDialogClose = () => {
    setShowCoinDialog(false);
    setReplacingSymbol(null);
  };

  // When the dialog was opened in replace mode, picking any coin must
  // atomically swap the previous symbol for the new one. We bypass the
  // toggle callback chain here because `handleCoinToggle` in the bot
  // form reads `pairs` from a captured closure — calling remove + add
  // in the same tick would write `[old, new]` instead of `[new]`.
  const handleDialogToggle = (symbol: string) => {
    if (replacingSymbol !== null) {
      if (symbol === replacingSymbol) {
        handleDialogClose();
        return;
      }
      // The dialog items use a dashed selectionSymbol (e.g. `BTC-USDT`),
      // but the rest of the form keys `pairMetadata` by the undashed
      // form (`BTCUSDT`). Without normalizing here the downstream
      // `pairMetadata[pair]` lookup misses → BotChart never receives a
      // symbol prop → chart stays on the old pair, backtest button stays
      // disabled. The regular add-pair flow goes through `normalizePair`
      // in basic-settings; bypassing it for atomic replace skipped that
      // step. Match the same regex as `normalizePairInput`.
      const normalized = symbol.replace(/[\s\-/]/g, '').toUpperCase();
      // Atomic single-write replacement.
      updateFormData('pair', [normalized]);
      handleDialogClose();
      return;
    }
    onCoinToggle(symbol);
  };

  const renderRemoveOrChange = (symbol: string, label: string) =>
    isLastCoin ? (
      <button
        type="button"
        onClick={() => openChangeDialog(symbol)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={changeLabel}
      >
        <ArrowRightLeft className="h-4 w-4" />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => onRemoveCoin(symbol)}
        className="text-muted-foreground hover:text-destructive transition-colors"
        aria-label={`Remove ${label}`}
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    );

  const renderSelectedItem = (symbol: string, index: number) => {
    if (symbol === 'ALL') {
      return (
        <div
          key={`ALL-${index}`}
          className="bg-card rounded-lg p-xs flex items-center gap-xs min-w-0"
        >
          <div className="flex items-center gap-xs flex-1 min-w-0">
            <CoinIcon symbol="ALL" size="w-4 h-4" />
            <span className="text-foreground text-xs font-medium truncate">
              {isPairsMode ? 'All pairs' : 'All coins'}
            </span>
          </div>
          {selectedCoins.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveCoin('ALL')}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remove All"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    }

    const item = itemLookup[symbol];

    if (isPairsMode) {
      const [baseAsset = '?', quoteAsset = '?'] = symbol.split('-');
      const label = item?.name ?? `${baseAsset}/${quoteAsset}`;
      return (
        <div
          key={`${symbol}-${index}`}
          className="bg-card rounded-lg p-xs flex items-center gap-xs min-w-0"
        >
          <div className="flex items-center gap-xs flex-1 min-w-0">
            <CoinPair
              baseAsset={baseAsset}
              quoteAsset={quoteAsset}
              iconSize="sm"
              showText={false}
            />
            <span className="text-foreground text-xs font-medium truncate">
              {label}
            </span>
          </div>
          {renderRemoveOrChange(symbol, label)}
        </div>
      );
    }

    const label = item?.name ?? symbol;
    return (
      <div
        key={`${symbol}-${index}`}
        className="bg-card rounded-lg p-xs flex items-center gap-xs min-w-0"
      >
        <div className="flex items-center gap-xs flex-1 min-w-0">
          <CoinIcon symbol={symbol} size="w-4 h-4" />
          <span className="text-foreground text-xs font-medium truncate">
            {label}
          </span>
        </div>
        {renderRemoveOrChange(symbol, label)}
      </div>
    );
  };

  const addButtonLabel = isPairsMode
    ? tradingPairsLoading
      ? 'Loading pairs…'
      : 'Add pairs'
    : 'Add coins';

  return (
    <>
      {/* Coins Section */}
      <div className="rounded-lg p-sm space-y-sm bg-inner-container">
        {isPairsMode && tradingPairsError && (
          <div className="flex items-center gap-sm text-xs text-destructive">
            <span>
              {tradingPairsError.message || 'Failed to load trading pairs.'}
            </span>
            <button
              type="button"
              onClick={handleRetryPairs}
              disabled={isRetrying}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`}
              />
              {isRetrying ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        )}
        {isPairsMode && tradingPairsLoading && (
          <div className="flex items-center gap-xs text-xs text-muted-foreground">
            <span className="inline-flex h-3 w-3 animate-spin rounded-full border border-border border-t-transparent" />
            <span>Loading trading pairs…</span>
          </div>
        )}

        <div className="space-y-xs">
          {/* Selected Coins */}
          <div className="flex flex-wrap gap-xs">
            {displayedSelectedCoins.map(renderSelectedItem)}

            {hiddenCount > 0 && !showAllSelected && (
              <button
                type="button"
                onClick={() => setShowAllSelected(true)}
                className="border border-dashed border-border rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Show ${hiddenCount} more selected ${isPairsMode ? 'pairs' : 'coins'}`}
              >
                + Load all ({hiddenCount} more)
              </button>
            )}

            {canCollapse && (
              <button
                type="button"
                onClick={() => setShowAllSelected(false)}
                className="border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Show fewer selected items"
              >
                Show less
              </button>
            )}

            {isPairsMode &&
              tradingPairsLoading &&
              selectedCoins.length === 0 && (
                <div className="flex items-center gap-xs rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground animate-pulse">
                  <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/60" />
                  <span>Preparing available pairs…</span>
                </div>
              )}

            {/* Add Items Button */}
            {(shouldShowAddButton ||
              (!shouldShowAddButton && selectedCoins.length === 0)) && (
              <button
                onClick={() => setShowCoinDialog(true)}
                className="border border-border rounded-lg p-xs flex items-center gap-xs text-muted-foreground hover:text-foreground bg-card hover:border-primary transition-all disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPairsMode && tradingPairsLoading}
                aria-busy={isPairsMode && tradingPairsLoading}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs">{addButtonLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selection Modal */}
      <ListModal
        isOpen={showCoinDialog}
        onClose={handleDialogClose}
        title={
          replacingSymbol !== null
            ? isPairsMode
              ? 'Change pair'
              : 'Change coin'
            : isPairsMode
              ? 'Select Pairs'
              : 'Select Coins'
        }
        items={listModalItems}
        selectedItems={selectedCoins}
        onItemToggle={handleDialogToggle}
        searchPlaceholder={isPairsMode ? 'Search pairs...' : 'Search coins...'}
        isLoading={isPairsMode && tradingPairsLoading}
        loadingMessage={
          isPairsMode
            ? 'Fetching trading pairs from your exchange…'
            : 'Preparing assets…'
        }
        {...(isPairsMode && onPairsPaste ? { onPaste: onPairsPaste } : {})}
      />
    </>
  );
};
