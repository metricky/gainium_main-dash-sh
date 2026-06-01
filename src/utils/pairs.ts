export const COMMON_QUOTE_ASSETS = [
  'USDT',
  'USDC',
  'BUSD',
  'TUSD',
  'DAI',
  'PAX',
  'USDP',
  'BTC',
  'ETH',
  'BNB',
  'USD',
  'EUR',
  'TRY',
  'BRL',
  'AUD',
  'CAD',
  'GBP',
  'JPY',
] as const;

export const extractPairAssets = (symbol: string) => {
  if (!symbol) return { baseAsset: '', quoteAsset: '' };

  // Handle explicit separators first
  if (symbol.includes('/')) {
    const parts = symbol.split('/');
    return { baseAsset: parts[0], quoteAsset: parts[1] || '' };
  }
  if (symbol.includes('-')) {
    const parts = symbol.split('-');
    return { baseAsset: parts[0], quoteAsset: parts[1] || '' };
  }

  const upperSymbol = symbol.toUpperCase();

  for (const quote of COMMON_QUOTE_ASSETS) {
    if (upperSymbol.endsWith(quote) && symbol.length > quote.length) {
      return {
        baseAsset: symbol.slice(0, -quote.length).replace(/[-_]$/, ''),
        quoteAsset: quote,
      };
    }
  }

  return {
    baseAsset: symbol,
    quoteAsset: '',
  };
};
