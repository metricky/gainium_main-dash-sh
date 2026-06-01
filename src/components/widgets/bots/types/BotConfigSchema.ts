// Bot Configuration Schema for AI System Prompt
export const BOT_CONFIGURATION_SCHEMA = {
  // Basic Information (Required)
  name: {
    type: 'string',
    required: true,
    description: 'Bot name (user-friendly identifier)',
  },
  pair: {
    type: 'string',
    required: true,
    description: 'Trading pair (e.g., BTCUSDT, ETHUSDT)',
    examples: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOGEUSDT'],
  },
  exchange: {
    type: 'string',
    required: true,
    description: 'Exchange name',
    enum: ['binance', 'bybit', 'okx', 'kucoin'],
    default: 'binance',
  },
  strategy: {
    type: 'string',
    required: true,
    description: 'Trading strategy direction',
    enum: ['long', 'short', 'both'],
    default: 'long',
  },
  type: {
    type: 'string',
    required: true,
    description: 'Bot type',
    enum: ['dca', 'grid', 'combo'],
    default: 'dca',
  },

  // Core Order Configuration (Required)
  baseOrderSize: {
    type: 'string',
    required: true,
    description: 'Initial order size in quote currency',
    examples: ['100', '500', '1000'],
    validation: 'Must be positive number',
  },
  orderSize: {
    type: 'string',
    required: true,
    description: 'Safety order size (DCA orders)',
    examples: ['200', '500', '1000'],
    validation: 'Must be positive number, typically 2x baseOrderSize',
  },
  orderFixedIn: {
    type: 'string',
    required: true,
    description: 'Order size denomination',
    enum: ['quote', 'base'],
    default: 'quote',
  },
  profitCurrency: {
    type: 'string',
    required: true,
    description: 'Profit calculation currency',
    enum: ['quote', 'base'],
    default: 'quote',
  },

  // DCA Strategy (Required)
  step: {
    type: 'string',
    required: true,
    description: 'Price deviation percentage for DCA orders',
    examples: ['1.0', '2.5', '5.0'],
    validation: 'Typically 1-10%, higher for volatile assets',
  },
  ordersCount: {
    type: 'number',
    required: true,
    description: 'Maximum number of DCA orders',
    examples: [3, 5, 10],
    validation: 'Usually 3-10, more orders = higher capital requirement',
  },
  stepScale: {
    type: 'string',
    required: true,
    description: 'Step scaling factor (price deviation multiplier)',
    examples: ['1.0', '1.2', '1.5'],
    default: '1.0',
    validation: '1.0 = linear, >1.0 = exponential scaling',
  },
  volumeScale: {
    type: 'string',
    required: true,
    description: 'Volume scaling factor (order size multiplier)',
    examples: ['1.0', '1.5', '2.0'],
    default: '1.0',
    validation: '1.0 = equal sizes, >1.0 = increasing sizes',
  },
  useDca: {
    type: 'boolean',
    required: true,
    description: 'Enable Dollar Cost Averaging',
    default: true,
  },

  // Risk Management (Required)
  useTp: {
    type: 'boolean',
    required: true,
    description: 'Enable take profit',
    default: true,
  },
  tpPerc: {
    type: 'string',
    required: true,
    description: 'Take profit percentage',
    examples: ['1.0', '2.5', '5.0'],
    validation: 'Typically 1-10%, should cover fees + profit',
  },
  useSl: {
    type: 'boolean',
    required: true,
    description: 'Enable stop loss',
    default: false,
    note: 'Use cautiously, can realize losses',
  },
  slPerc: {
    type: 'string',
    required: false,
    description: 'Stop loss percentage (negative value)',
    examples: ['-5.0', '-10.0', '-20.0'],
    validation: 'Negative value, typically -5% to -20%',
  },

  // Advanced Features (Optional)
  maxNumberOfOpenDeals: {
    type: 'string',
    required: false,
    description: 'Maximum concurrent deals',
    default: '1',
    examples: ['1', '3', '5'],
  },
  useSmartOrders: {
    type: 'boolean',
    required: false,
    description: 'Enable smart order placement',
    default: true,
  },
  startCondition: {
    type: 'string',
    required: false,
    description: 'When to start the bot',
    enum: ['asap', 'manual', 'scheduled'],
    default: 'asap',
  },
  startOrderType: {
    type: 'string',
    required: false,
    description: 'Initial order type',
    enum: ['market', 'limit'],
    default: 'market',
  },

  // Multi-level Take Profits (Advanced)
  useMultiTp: {
    type: 'boolean',
    required: false,
    description: 'Enable multiple take profit levels',
    default: false,
  },
  trailingTp: {
    type: 'boolean',
    required: false,
    description: 'Enable trailing take profit',
    default: false,
  },

  // Futures Trading (Advanced)
  futures: {
    type: 'boolean',
    required: false,
    description: 'Enable futures trading',
    default: false,
  },
  leverage: {
    type: 'number',
    required: false,
    description: 'Leverage multiplier for futures',
    examples: [1, 2, 5, 10],
    validation: '1-20x, higher leverage = higher risk',
  },
};

// Default bot configuration for fallback
export const DEFAULT_BOT_CONFIG = {
  name: 'AI Generated Bot',
  pair: 'BTCUSDT',
  pairs: ['BTCUSDT'],
  exchange: 'binance',
  exchangeUUID: '',
  strategy: 'long' as const,
  type: 'dca' as const,
  enabled: false,

  // Core Order Configuration
  baseOrderSize: '100',
  orderSize: '200',
  orderFixedIn: 'quote' as const,
  profitCurrency: 'quote' as const,

  // DCA Strategy
  step: '2.5',
  ordersCount: 5,
  stepScale: '1.0',
  volumeScale: '1.0',
  minimumDeviation: '0.1',
  useDca: true,
  dcaCondition: '',
  scaleDcaType: '',

  // Deal Management
  maxNumberOfOpenDeals: '1',
  useSmartOrders: true,
  activeOrdersCount: 3,
  startCondition: 'asap' as const,

  // Risk Management
  useTp: true,
  tpPerc: '2.5',
  useSl: false,
  slPerc: '-10.0',
  useMultiTp: false,
  trailingTp: false,
  trailingTpPerc: '1.0',

  // Multi-level Take Profits
  multiTp: [],

  // Enhanced Stop Loss
  trailingSl: false,
  moveSL: false,
  moveSLTrigger: '0',
  moveSLValue: '0',

  // Order Types
  startOrderType: 'market',
  useLimitPrice: false,
  limitTimeout: '300',
  useLimitTimeout: false,

  // Scheduling
  hodlDay: '',
  hodlAt: '',
  hodlHourly: false,
  hodlNextBuy: 0,

  // Futures Trading
  futures: false,
  coinm: false,
  leverage: 1,
  marginType: 'isolated',

  // Multi-Pair Support
  useMulti: false,
  maxDealsPerPair: '1',

  // Advanced Features
  useCooldown: false,
  closeByTimer: false,
  closeByTimerValue: 0,
};

// System prompt for AI bot creation
export const BOT_CREATION_SYSTEM_PROMPT = `
You are a Gainium trading bot expert. Create bot configurations based on user requests.

RESPONSE FORMAT (JSON only):
{
  "explanation": "Brief strategy explanation",
  "confidence": "high|medium|low",
  "settings": {
    "name": "Bot Name",
    "pair": "BTCUSDT",
    "exchange": "binance",
    "strategy": "long|short|both",
    "type": "dca|grid|combo",
    "baseOrderSize": "100",
    "orderSize": "200",
    "step": "2.5",
    "ordersCount": 5,
    "volumeScale": "1.0",
    "useTp": true,
    "tpPerc": "3.0",
    "useSl": false,
    "slPerc": "-10.0",
    "useDca": true,
    "maxNumberOfOpenDeals": "1"
  },
  "missingInfo": [{"field": "budget", "question": "What's your budget?", "type": "number", "required": true}],
  "suggestions": ["Start with paper trading", "Consider conservative settings"]
}

GUIDELINES:
- Use realistic values for current market conditions
- Conservative: 1-2% steps, 3-5 orders, 1-3% profit
- Aggressive: 5-10% steps, 7-10 orders, 5-10% profit
- DCA bots: Calculate capital needs (baseOrder + orders * orderSize * volumeScale)
- Always include take profit, be cautious with stop loss
- Suggest paper trading for new strategies
`;

// Validation function for bot configuration
export const validateBotConfiguration = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!config.name) errors.push('Bot name is required');
  if (!config.pair) errors.push('Trading pair is required');
  if (!config.baseOrderSize) errors.push('Base order size is required');
  if (!config.orderSize) errors.push('Safety order size is required');
  if (!config.tpPerc && config.useTp)
    errors.push('Take profit percentage is required when TP is enabled');

  // Numeric validation
  if (config.baseOrderSize && parseFloat(config.baseOrderSize) <= 0) {
    errors.push('Base order size must be positive');
  }
  if (config.orderSize && parseFloat(config.orderSize) <= 0) {
    errors.push('Safety order size must be positive');
  }
  if (config.tpPerc && parseFloat(config.tpPerc) <= 0) {
    errors.push('Take profit percentage must be positive');
  }
  // Stop loss validation removed - percentage can be positive or negative
  // depending on whether we're editing an existing deal or creating a new one.
  // The UI validates against current price instead.

  // Enum validation
  if (config.strategy && !['long', 'short', 'both'].includes(config.strategy)) {
    errors.push('Invalid strategy value');
  }
  if (config.type && !['dca', 'grid', 'combo'].includes(config.type)) {
    errors.push('Invalid bot type');
  }
  if (
    config.exchange &&
    !['binance', 'bybit', 'okx', 'kucoin'].includes(config.exchange)
  ) {
    errors.push('Invalid exchange');
  }

  // Warnings for risky configurations
  if (config.leverage && config.leverage > 5) {
    warnings.push('High leverage (>5x) significantly increases risk');
  }
  if (config.ordersCount && config.ordersCount > 10) {
    warnings.push('High order count requires significant capital');
  }
  if (config.useSl && config.slPerc && parseFloat(config.slPerc) > -5) {
    warnings.push('Tight stop loss may trigger frequently in volatile markets');
  }
  if (!config.useTp) {
    warnings.push('No take profit set - bot may run indefinitely');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
