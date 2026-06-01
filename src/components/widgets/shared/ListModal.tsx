import React, { useDeferredValue, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatExchangeProvider } from '../../../utils/exchangeUtils';
import CoinIcon from './CoinIcon';
import CoinPair from './CoinPair';
import ExchangeIcon from './ExchangeIcon';

interface ListItem {
  symbol: string;
  name: string;
  icon: string;
  price?: number;
  color: string;
  subtitle?: string;
  // Pair-specific properties
  baseIcon?: string;
  quoteIcon?: string;
  baseAsset?: string;
  quoteAsset?: string;
  // Exchange-specific properties
  isExchange?: boolean;
  isHelper?: boolean;
}

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: ListItem[];
  selectedItems: string[];
  onItemToggle: (itemSymbol: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  onPaste?: (raw: string) => void;
}

const renderItemIcon = (item: ListItem) => {
  if (item.isHelper) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
        <span className="text-lg">✨</span>
      </div>
    );
  }

  // If it has both base and quote assets, it's a trading pair
  if (item.baseAsset && item.quoteAsset) {
    return (
      <CoinPair
        baseAsset={item.baseAsset}
        quoteAsset={item.quoteAsset}
        iconSize="md"
        showText={false}
      />
    );
  }

  // If it's marked as an exchange
  if (item.isExchange) {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          backgroundColor: item.color
            ? item.color + '20'
            : 'var(--color-muted)',
        }}
      >
        <ExchangeIcon icon={item.icon} size="w-6 h-6" />
      </div>
    );
  }

  // If icon is empty string, skip icon rendering (text-only mode)
  if (item.icon === '') {
    return null;
  }

  // Default: single token/coin
  return <CoinIcon symbol={item.symbol} size="lg" />;
};

export const ListModal: React.FC<ListModalProps> = ({
  isOpen,
  onClose,
  title,
  items,
  selectedItems,
  onItemToggle,
  searchPlaceholder = 'Search...',
  isLoading = false,
  loadingMessage = 'Loading items…',
  onPaste,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredItems = useDeferredValue(items);

  const filteredItems = useMemo(() => {
    if (isLoading) {
      return [] as ListItem[];
    }

    if (!searchTerm.trim()) return deferredItems;

    const searchLower = searchTerm.toLowerCase().trim();

    // Split search term into words for multi-term search
    const searchWords = searchLower
      .split(/\s+/)
      .filter((word) => word.length > 0);

    return deferredItems.filter((item) => {
      // Combine all searchable text into one string
      const searchableText = [item.name, item.symbol, item.subtitle || '']
        .join(' ')
        .toLowerCase();

      // All search words must appear somewhere in the combined text
      return searchWords.every((word) => searchableText.includes(word));
    });
  }, [deferredItems, isLoading, searchTerm]);

  // Close on Escape for a better keyboard UX (hook called unconditionally)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      data-testid="list-modal-overlay"
    >
      <div
        className="bg-card border border-border rounded-lg shadow-lg w-80 max-h-96 flex flex-col"
        role="dialog"
        aria-modal="true"
        data-testid="list-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-md border-b border-border">
          <h3 className="text-foreground font-semibold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-md border-b border-border">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              onPaste={(event) => {
                if (!onPaste) {
                  return;
                }
                const text = event.clipboardData?.getData('text');
                if (!text?.trim()) {
                  return;
                }
                event.preventDefault();
                onPaste(text);
              }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-xs">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-sm py-12">
              <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground text-center px-6">
                {loadingMessage}
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No items found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item) => {
                const isSelected = selectedItems.includes(item.symbol);
                let subtitleText: string | null = null;
                if (item.isExchange && item.subtitle) {
                  subtitleText = formatExchangeProvider(item.subtitle);
                } else if (item.subtitle) {
                  subtitleText = item.subtitle;
                } else if (
                  item.price !== undefined &&
                  !item.baseAsset &&
                  !item.quoteAsset
                ) {
                  subtitleText = `$${item.price.toLocaleString('en-US', {
                    minimumFractionDigits: item.symbol === 'USDT' ? 0 : 2,
                    maximumFractionDigits: item.symbol === 'USDT' ? 0 : 2,
                  })}`;
                }

                return (
                  <div
                    key={item.symbol}
                    className={`flex items-center justify-between p-sm rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/30 shadow-sm'
                        : item.isHelper
                          ? 'border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10'
                          : 'hover:bg-muted/30 border border-transparent'
                    }`}
                    onClick={() => onItemToggle(item.symbol)}
                  >
                    <div className="flex items-center gap-sm flex-1 min-w-0">
                      {/* Icon - only render if present */}
                      {renderItemIcon(item) && (
                        <div className="shrink-0">{renderItemIcon(item)}</div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-medium text-sm truncate">
                          {item.baseAsset && item.quoteAsset
                            ? `${item.baseAsset}/${item.quoteAsset}`
                            : item.isExchange
                              ? item.name // For exchanges, just show the name without parentheses
                              : item.icon === ''
                                ? item.name // Text-only mode, no symbol in parentheses
                                : `${item.name} (${item.symbol})`}
                        </div>
                        {subtitleText && (
                          <div className="text-muted-foreground text-xs truncate">
                            {subtitleText}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="shrink-0 ml-2">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-primary-foreground"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render modal into the document body so it isn't constrained by parent overflow
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  // Fallback to inline render
  return modalContent;
};
