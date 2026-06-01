import type {
  CoinbaseKeysType,
  ExchangeEnum,
  ExchangeInUser,
  OKXSource,
} from '../../types/exchange.types';

// Exchange dialog mode
export type ExchangeDialogMode = 'add' | 'edit';

// Exchange dialog props
export interface ExchangeDialogProps {
  open: boolean;
  onClose: () => void;
  mode: ExchangeDialogMode;
  exchangeData?: ExchangeInUser | undefined;
  onSuccess: (exchange: ExchangeInUser) => void;
  onModeChange?: (mode: 'paper' | 'live') => void;
  initialTradingMode?: 'paper' | 'live';
}

// Exchange form data structure
export interface ExchangeFormData {
  // Basic Information
  name: string;
  provider: ExchangeEnum;

  // Authentication
  key: string;
  secret: string;
  passphrase?: string;

  // Exchange-specific settings
  keysType?: CoinbaseKeysType | undefined;
  okxSource?: OKXSource | undefined;
  bybitHost?: string | undefined;

  // Paper trading settings
  isPaperTrading: boolean;
  stablecoinBalance: string;
  coinToTopUp: string;

  // Hyperliquid-specific settings
  useApproveBuilderFees?: boolean;
  subaccount?: boolean;

  // Advanced settings
  hedgeMode: boolean;
  ignoreFees: boolean;
}

// Exchange form validation errors
export interface ExchangeFormErrors {
  name?: string;
  provider?: string;
  key?: string;
  secret?: string;
  passphrase?: string;
  stablecoinBalance?: string;
  coinToTopUp?: string;
}

// Exchange provider configuration
export interface ExchangeProviderConfig {
  id: ExchangeEnum;
  name: string;
  displayName: string;
  requiresPassphrase: boolean;
  supportsKeyTypes: boolean;
  supportsHostSelection: boolean;
  supportsPaperTrading: boolean;
  isPaperExchange: boolean;
  category: 'spot' | 'futures' | 'all';
  popular?: boolean;
}

// Paper trading asset options
export interface PaperTradingAsset {
  symbol: string;
  name: string;
  defaultBalance: string;
}

// Exchange host options (for Bybit, OKX)
export interface ExchangeHostOption {
  value: string;
  label: string;
  url: string;
}

// Form validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ExchangeFormErrors;
}

// Exchange connection status
export interface ExchangeConnectionStatus {
  isConnecting: boolean;
  isValidating: boolean;
  connectionError?: string;
  validationError?: string;
}
