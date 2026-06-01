/**
 * Utility functions for formatting exchange provider information
 * Handles both real exchanges and paper trading exchanges
 */

export interface ExchangeProviderInfo {
  displayName: string;
  icon: string;
  type: 'spot' | 'futures' | 'paper' | 'unknown';
  futuresType?: string; // e.g., 'USDM', 'USDT', 'COIN'
}

/**
 * Get formatted exchange provider information
 * @param provider - The raw provider string from the API
 * @returns Formatted exchange information with display name, icon, and type
 */
export function getExchangeProviderInfo(
  provider: string
): ExchangeProviderInfo {
  if (!provider) {
    return {
      displayName: 'Unknown Exchange',
      icon: '❓',
      type: 'unknown',
    };
  }

  const providerLower = provider.toLowerCase().trim();

  // Handle paper trading exchanges
  if (providerLower.includes('paper')) {
    // Extract the base exchange name from paper trading
    const paperMatch = providerLower.match(/paper[\s-_]*(.+)/);
    const baseExchange = paperMatch ? paperMatch[1] : 'trading';

    return {
      displayName: `${capitalizeFirst(baseExchange)} Paper Trading`,
      icon: '📄',
      type: 'paper',
    };
  }

  // Handle futures exchanges
  if (providerLower.includes('futures')) {
    if (providerLower.includes('binance')) {
      return {
        displayName: 'Binance',
        icon: '🟡',
        type: 'futures',
        futuresType: 'USDM',
      };
    }

    if (providerLower.includes('bybit')) {
      return {
        displayName: 'Bybit',
        icon: '🟠',
        type: 'futures',
        futuresType: 'USDT',
      };
    }

    if (providerLower.includes('okx') || providerLower.includes('okex')) {
      return {
        displayName: 'OKX',
        icon: '⚫',
        type: 'futures',
        futuresType: 'USDT',
      };
    }

    if (providerLower.includes('bitmex')) {
      return {
        displayName: 'BitMEX',
        icon: '🔶',
        type: 'futures',
        futuresType: 'COIN',
      };
    }

    if (providerLower.includes('deribit')) {
      return {
        displayName: 'Deribit',
        icon: '🟡',
        type: 'futures',
        futuresType: 'COIN',
      };
    }

    // Generic futures exchange
    return {
      displayName:
        capitalizeFirst(providerLower.replace('futures', '').trim()) ||
        'Futures Exchange',
      icon: '📈',
      type: 'futures',
    };
  }

  // Handle spot exchanges
  const spotExchanges: Record<string, { name: string; icon: string }> = {
    binance: { name: 'Binance', icon: '🟡' },
    coinbase: { name: 'Coinbase', icon: '🔵' },
    kraken: { name: 'Kraken', icon: '🟣' },
    bybit: { name: 'Bybit', icon: '🟠' },
    okx: { name: 'OKX', icon: '⚫' },
    okex: { name: 'OKX', icon: '⚫' },
    kucoin: { name: 'KuCoin', icon: '🟢' },
    huobi: { name: 'Huobi', icon: '🔴' },
    gate: { name: 'Gate.io', icon: '🟦' },
    bitfinex: { name: 'Bitfinex', icon: '🟩' },
    ftx: { name: 'FTX', icon: '🔷' },
    gemini: { name: 'Gemini', icon: '♊' },
    bitstamp: { name: 'Bitstamp', icon: '🟨' },
    poloniex: { name: 'Poloniex', icon: '⚪' },
    bithumb: { name: 'Bithumb', icon: '🟥' },
    coincheck: { name: 'Coincheck', icon: '🔶' },
    bitflyer: { name: 'bitFlyer', icon: '🔺' },
    mexc: { name: 'MEXC', icon: '🟢' },
    'crypto.com': { name: 'Crypto.com', icon: '💎' },
    crypto: { name: 'Crypto.com', icon: '💎' },
  };

  // Check for known spot exchanges
  for (const [key, info] of Object.entries(spotExchanges)) {
    if (providerLower.includes(key)) {
      return {
        displayName: info.name,
        icon: info.icon,
        type: 'spot',
      };
    }
  }

  // Default case for unknown exchanges
  return {
    displayName: capitalizeFirst(provider),
    icon: '🏢',
    type: 'unknown',
  };
}

/**
 * Format the complete display string for an exchange
 * @param provider - The raw provider string from the API
 * @returns Formatted string like "Binance, spot" or "Binance, futures (USDM)"
 */
export function formatExchangeDisplay(provider: string): string {
  const info = getExchangeProviderInfo(provider);

  if (info.type === 'paper') {
    return info.displayName; // Already includes "Paper Trading"
  }

  if (info.type === 'futures' && info.futuresType) {
    return `${info.displayName}, futures (${info.futuresType})`;
  }

  if (info.type === 'futures') {
    return `${info.displayName}, futures`;
  }

  if (info.type === 'spot') {
    return `${info.displayName}, spot`;
  }

  // For unknown types, just return the display name
  return info.displayName;
}

/**
 * Helper function to capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
