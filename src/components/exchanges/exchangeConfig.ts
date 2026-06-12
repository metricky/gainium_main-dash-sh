import {
  ExchangeEnum,
  CoinbaseKeysType,
  OKXSource,
} from '../../types/exchange.types';
import type {
  ExchangeProviderConfig,
  PaperTradingAsset,
  ExchangeHostOption,
} from './types';

// Exchange provider configurations - matches main-dash exchangesList
export const exchangeProviders: ExchangeProviderConfig[] = [
  // Binance variants (live)
  {
    id: ExchangeEnum.binance,
    name: 'binance',
    displayName: 'Binance',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
  },
  {
    id: ExchangeEnum.binanceAll,
    name: 'binance',
    displayName: 'Binance SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
    popular: true,
  },
  {
    id: ExchangeEnum.binanceSpot,
    name: 'binance',
    displayName: 'Binance SPOT',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'spot',
    popular: true,
  },
  {
    id: ExchangeEnum.binanceCoinm,
    name: 'binance',
    displayName: 'Binance COIN-M Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },
  {
    id: ExchangeEnum.binanceUsdm,
    name: 'binance',
    displayName: 'Binance USDⓈ-M Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },
  {
    id: ExchangeEnum.binanceUS,
    name: 'binance',
    displayName: 'Binance US',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: false,
    isPaperExchange: false,
    category: 'spot',
  },

  // KuCoin variants (live)
  {
    id: ExchangeEnum.kucoin,
    name: 'kucoin',
    displayName: 'Kucoin',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
  },
  {
    id: ExchangeEnum.kucoinAll,
    name: 'kucoin',
    displayName: 'Kucoin SPOT & Futures',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
  },
  {
    id: ExchangeEnum.kucoinSpot,
    name: 'kucoin',
    displayName: 'Kucoin SPOT',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'spot',
  },
  {
    id: ExchangeEnum.kucoinLinear,
    name: 'kucoin',
    displayName: 'Kucoin USDⓈ-M Futures',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },
  {
    id: ExchangeEnum.kucoinInverse,
    name: 'kucoin',
    displayName: 'Kucoin COIN-M Futures',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },

  // Bybit variants (live)
  {
    id: ExchangeEnum.bybit,
    name: 'bybit',
    displayName: 'Bybit',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
  },
  {
    id: ExchangeEnum.bybitAll,
    name: 'bybit',
    displayName: 'Bybit SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
    popular: true,
  },
  {
    id: ExchangeEnum.bybitSpot,
    name: 'bybit',
    displayName: 'Bybit SPOT',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'spot',
  },
  {
    id: ExchangeEnum.bybitUsdm,
    name: 'bybit',
    displayName: 'Bybit Linear Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },
  {
    id: ExchangeEnum.bybitCoinm,
    name: 'bybit',
    displayName: 'Bybit Inverse Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },

  // OKX variants (live)
  {
    id: ExchangeEnum.okx,
    name: 'okx',
    displayName: 'OKX',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
  },
  {
    id: ExchangeEnum.okxAll,
    name: 'okx',
    displayName: 'OKX SPOT & Futures',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
  },
  {
    id: ExchangeEnum.okxSpot,
    name: 'okx',
    displayName: 'OKX SPOT',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'spot',
  },
  {
    id: ExchangeEnum.okxLinear,
    name: 'okx',
    displayName: 'OKX Linear Futures',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },
  {
    id: ExchangeEnum.okxInverse,
    name: 'okx',
    displayName: 'OKX Inverse Futures',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: true,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },

  // Coinbase (live)
  {
    id: ExchangeEnum.coinbase,
    name: 'coinbase',
    displayName: 'Coinbase',
    requiresPassphrase: false,
    supportsKeyTypes: true,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'spot',
  },

  // Paper Binance variants
  {
    id: ExchangeEnum.paperBinance,
    name: 'binance',
    displayName: 'Paper Binance',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
  },
  {
    id: ExchangeEnum.paperBinanceAll,
    name: 'binance',
    displayName: 'Paper Binance SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
    popular: true,
  },
  {
    id: ExchangeEnum.paperBinanceSpot,
    name: 'binance',
    displayName: 'Paper Binance SPOT',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'spot',
  },
  {
    id: ExchangeEnum.paperBinanceCoinm,
    name: 'binance',
    displayName: 'Paper Binance COIN-M Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },
  {
    id: ExchangeEnum.paperBinanceUsdm,
    name: 'binance',
    displayName: 'Paper Binance USDⓈ-M Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },

  // Paper KuCoin variants
  {
    id: ExchangeEnum.paperKucoin,
    name: 'kucoin',
    displayName: 'Paper Kucoin',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
  },
  {
    id: ExchangeEnum.paperKucoinAll,
    name: 'kucoin',
    displayName: 'Paper Kucoin SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
  },
  {
    id: ExchangeEnum.paperKucoinSpot,
    name: 'kucoin',
    displayName: 'Paper Kucoin SPOT',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'spot',
  },
  {
    id: ExchangeEnum.paperKucoinLinear,
    name: 'kucoin',
    displayName: 'Paper Kucoin USDⓈ-M Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },
  {
    id: ExchangeEnum.paperKucoinInverse,
    name: 'kucoin',
    displayName: 'Paper Kucoin COIN-M Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },

  // Paper Bybit variants
  {
    id: ExchangeEnum.paperBybit,
    name: 'bybit',
    displayName: 'Paper Bybit',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
  },
  {
    id: ExchangeEnum.paperBybitAll,
    name: 'bybit',
    displayName: 'Paper Bybit SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
    popular: true,
  },
  {
    id: ExchangeEnum.paperBybitSpot,
    name: 'bybit',
    displayName: 'Paper Bybit SPOT',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'spot',
  },
  {
    id: ExchangeEnum.paperBybitCoinm,
    name: 'bybit',
    displayName: 'Paper Bybit Inverse Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },
  {
    id: ExchangeEnum.paperBybitUsdm,
    name: 'bybit',
    displayName: 'Paper Bybit Linear Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },

  // Paper OKX variants
  {
    id: ExchangeEnum.paperOkx,
    name: 'okx',
    displayName: 'Paper OKX',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
  },
  {
    id: ExchangeEnum.paperOkxAll,
    name: 'okx',
    displayName: 'Paper OKX SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
  },
  {
    id: ExchangeEnum.paperOkxSpot,
    name: 'okx',
    displayName: 'Paper OKX SPOT',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'spot',
  },
  {
    id: ExchangeEnum.paperOkxInverse,
    name: 'okx',
    displayName: 'Paper OKX Inverse Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },
  {
    id: ExchangeEnum.paperOkxLinear,
    name: 'okx',
    displayName: 'Paper OKX Linear Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },

  // Paper Coinbase
  {
    id: ExchangeEnum.paperCoinbase,
    name: 'coinbase',
    displayName: 'Paper Coinbase',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'spot',
  },

  // Bitget variants (live)
  {
    id: ExchangeEnum.bitgetAll,
    name: 'bitget',
    displayName: 'Bitget SPOT & Futures',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
    popular: true,
  },
  {
    id: ExchangeEnum.bitgetSpot,
    name: 'bitget',
    displayName: 'Bitget SPOT',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'spot',
  },
  {
    id: ExchangeEnum.bitgetUsdm,
    name: 'bitget',
    displayName: 'Bitget Linear Futures',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },
  {
    id: ExchangeEnum.bitgetCoinm,
    name: 'bitget',
    displayName: 'Bitget Inverse Futures',
    requiresPassphrase: true,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },

  // Hyperliquid variants (live)
  {
    id: ExchangeEnum.hyperliquid,
    name: 'hyperliquid',
    displayName: 'Hyperliquid',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'spot',
  },
  {
    id: ExchangeEnum.hyperliquidLinear,
    name: 'hyperliquid',
    displayName: 'Hyperliquid Linear Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },
  {
    id: ExchangeEnum.hyperliquidAll,
    name: 'hyperliquid',
    displayName: 'Hyperliquid SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
  },

  // Paper Bitget variants
  {
    id: ExchangeEnum.paperBitget,
    name: 'bitget',
    displayName: 'Paper Bitget',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
    popular: true,
  },
  {
    id: ExchangeEnum.paperBitgetUsdm,
    name: 'bitget',
    displayName: 'Paper Bitget Linear Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },
  {
    id: ExchangeEnum.paperBitgetCoinm,
    name: 'bitget',
    displayName: 'Paper Bitget Inverse Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },

  // Paper Hyperliquid
  {
    id: ExchangeEnum.paperHyperliquid,
    name: 'hyperliquid',
    displayName: 'Paper Hyperliquid',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'spot',
  },
  {
    id: ExchangeEnum.paperHyperliquidLinear,
    name: 'hyperliquid',
    displayName: 'Paper Hyperliquid Linear',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },
  {
    id: ExchangeEnum.paperHyperliquidAll,
    name: 'hyperliquid',
    displayName: 'Paper Hyperliquid SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
  },

  // Kraken (live)
  {
    id: ExchangeEnum.kraken,
    name: 'kraken',
    displayName: 'Kraken',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
  },
  {
    id: ExchangeEnum.krakenAll,
    name: 'kraken',
    displayName: 'Kraken SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'all',
  },
  {
    id: ExchangeEnum.krakenSpot,
    name: 'kraken',
    displayName: 'Kraken SPOT',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'spot',
  },
  {
    id: ExchangeEnum.krakenUsdm,
    name: 'kraken',
    displayName: 'Kraken USDⓈ-M Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: false,
    category: 'futures',
  },

  // Kraken (paper)
  {
    id: ExchangeEnum.paperKraken,
    name: 'kraken',
    displayName: 'Paper Kraken',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
  },
  {
    id: ExchangeEnum.paperKrakenAll,
    name: 'kraken',
    displayName: 'Paper Kraken SPOT & Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'all',
  },
  {
    id: ExchangeEnum.paperKrakenSpot,
    name: 'kraken',
    displayName: 'Paper Kraken SPOT',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'spot',
  },
  {
    id: ExchangeEnum.paperKrakenUsdm,
    name: 'kraken',
    displayName: 'Paper Kraken USDⓈ-M Futures',
    requiresPassphrase: false,
    supportsKeyTypes: false,
    supportsHostSelection: false,
    supportsPaperTrading: true,
    isPaperExchange: true,
    category: 'futures',
  },
];

// Paper trading asset configurations
export const paperTradingAssets: Record<string, PaperTradingAsset[]> = {
  binance: [
    { symbol: 'USDT', name: 'Tether USD', defaultBalance: '10000' },
    { symbol: 'BUSD', name: 'Binance USD', defaultBalance: '10000' },
    { symbol: 'TUSD', name: 'TrueUSD', defaultBalance: '10000' },
    { symbol: 'BTC', name: 'Bitcoin', defaultBalance: '1' },
    { symbol: 'ETH', name: 'Ethereum', defaultBalance: '10' },
  ],
  bybit: [
    { symbol: 'USDT', name: 'Tether USD', defaultBalance: '10000' },
    { symbol: 'USDC', name: 'USD Coin', defaultBalance: '10000' },
    { symbol: 'DAI', name: 'Dai Stablecoin', defaultBalance: '10000' },
    { symbol: 'BUSD', name: 'Binance USD', defaultBalance: '10000' },
    { symbol: 'TUSD', name: 'TrueUSD', defaultBalance: '10000' },
    { symbol: 'BTC', name: 'Bitcoin', defaultBalance: '1' },
    { symbol: 'ETH', name: 'Ethereum', defaultBalance: '10' },
  ],
  okx: [
    { symbol: 'USDT', name: 'Tether USD', defaultBalance: '10000' },
    { symbol: 'USDC', name: 'USD Coin', defaultBalance: '10000' },
    { symbol: 'BTC', name: 'Bitcoin', defaultBalance: '1' },
    { symbol: 'ETH', name: 'Ethereum', defaultBalance: '10' },
  ],
  kucoin: [
    { symbol: 'USDT', name: 'Tether USD', defaultBalance: '10000' },
    { symbol: 'USDC', name: 'USD Coin', defaultBalance: '10000' },
    { symbol: 'TUSD', name: 'TrueUSD', defaultBalance: '10000' },
    { symbol: 'GUSD', name: 'Gemini Dollar', defaultBalance: '10000' },
    { symbol: 'PAX', name: 'Paxos Standard', defaultBalance: '10000' },
    { symbol: 'BTC', name: 'Bitcoin', defaultBalance: '1' },
    { symbol: 'ETH', name: 'Ethereum', defaultBalance: '10' },
  ],
  bitget: [
    { symbol: 'USDT', name: 'Tether USD', defaultBalance: '10000' },
    { symbol: 'USDC', name: 'USD Coin', defaultBalance: '10000' },
    { symbol: 'BTC', name: 'Bitcoin', defaultBalance: '1' },
    { symbol: 'ETH', name: 'Ethereum', defaultBalance: '10' },
  ],
  coinbase: [
    { symbol: 'USDT', name: 'Tether USD', defaultBalance: '10000' },
    { symbol: 'USDC', name: 'USD Coin', defaultBalance: '10000' },
    { symbol: 'EUR', name: 'Euro', defaultBalance: '10000' },
    { symbol: 'GBP', name: 'British Pound', defaultBalance: '10000' },
  ],
  mexc: [{ symbol: 'USDT', name: 'Tether USD', defaultBalance: '10000' }],
  hyperliquid: [{ symbol: 'USDC', name: 'USD Coin', defaultBalance: '10000' }],
  kraken: [
    { symbol: 'USDT', name: 'Tether USD', defaultBalance: '10000' },
    { symbol: 'USDC', name: 'USD Coin', defaultBalance: '10000' },
    { symbol: 'EUR', name: 'Euro', defaultBalance: '10000' },
    { symbol: 'GBP', name: 'British Pound', defaultBalance: '10000' },
    { symbol: 'BTC', name: 'Bitcoin', defaultBalance: '1' },
    { symbol: 'ETH', name: 'Ethereum', defaultBalance: '10' },
  ],
};

// Exchange host options — mirrors main-dash exactly (bybitHostMap /
// okxHostMap in main-dash/types/exchange.types.ts). The label is the
// bare origin URL on purpose: these are API origins, not regions, so we
// do NOT decorate them with country names (e.g. my.okx.com is NOT a
// Malaysia-only host). `value` must stay the legacy enum value — the
// backend maps it to the origin and hasn't changed.
export const exchangeHostOptions: Record<string, ExchangeHostOption[]> = {
  // bybitHostMap order, with `nl` filtered out (legacy filters it too).
  bybit: [
    { value: 'eu', label: 'https://bybit.eu', url: 'https://bybit.eu' },
    { value: 'com', label: 'https://bybit.com', url: 'https://bybit.com' },
    {
      value: 'tr',
      label: 'https://bybit-tr.com',
      url: 'https://bybit-tr.com',
    },
    {
      value: 'kz',
      label: 'https://www.bybit.kz/',
      url: 'https://www.bybit.kz/',
    },
    {
      value: 'ge',
      label: 'https://www.bybitgeorgia.ge/',
      url: 'https://www.bybitgeorgia.ge/',
    },
  ],
  // okxHostMap order: my, app, com.
  okx: [
    { value: 'my', label: 'https://my.okx.com', url: 'https://my.okx.com' },
    { value: 'app', label: 'https://app.okx.com', url: 'https://app.okx.com' },
    { value: 'com', label: 'https://okx.com', url: 'https://okx.com' },
  ],
};

// Coinbase key type options
export const coinbaseKeyTypes = [
  { value: CoinbaseKeysType.legacy, label: 'Legacy Keys' },
  { value: CoinbaseKeysType.cloud, label: 'Cloud Trading Keys' },
];

// OKX source options — mirrors okxHostMap order/labels (bare URLs).
export const okxSourceOptions = [
  { value: OKXSource.my, label: 'https://my.okx.com' },
  { value: OKXSource.app, label: 'https://app.okx.com' },
  { value: OKXSource.com, label: 'https://okx.com' },
];

// Helper functions
export const getExchangeConfig = (
  provider: ExchangeEnum
): ExchangeProviderConfig | undefined => {
  return exchangeProviders.find((config) => config.id === provider);
};

export const getExchangesByCategory = (
  category?: 'spot' | 'futures' | 'all'
) => {
  if (!category) return exchangeProviders;
  return exchangeProviders.filter((config) => config.category === category);
};

export const getPaperTradingAssets = (
  exchangeName: string
): PaperTradingAsset[] => {
  return paperTradingAssets[exchangeName] || paperTradingAssets['binance'];
};

export const getExchangeHostOptions = (
  exchangeName: string
): ExchangeHostOption[] => {
  return exchangeHostOptions[exchangeName] || [];
};

export const isPaperExchange = (provider: ExchangeEnum): boolean => {
  const config = getExchangeConfig(provider);
  return config?.isPaperExchange || false;
};

export const requiresPassphrase = (provider: ExchangeEnum): boolean => {
  const config = getExchangeConfig(provider);
  return config?.requiresPassphrase || false;
};

export const supportsKeyTypes = (provider: ExchangeEnum): boolean => {
  const config = getExchangeConfig(provider);
  return config?.supportsKeyTypes || false;
};

export const supportsHostSelection = (provider: ExchangeEnum): boolean => {
  const config = getExchangeConfig(provider);
  return config?.supportsHostSelection || false;
};
