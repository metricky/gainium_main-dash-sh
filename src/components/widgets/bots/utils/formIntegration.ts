// Form Integration Utilities for AI Bot Assistant
import type { BotCreationFormData } from '../types/AIBotTypes';

/**
 * Maps AI-generated configuration to form field structure
 */
export const mapConfigurationToFormData = (
  config: BotCreationFormData
): BotCreationFormData => {
  // Ensure all required fields have valid values
  const mappedConfig: BotCreationFormData = {
    // Basic Information
    name: config.name || 'AI Generated Bot',
    pair: config.pair || 'BTCUSDT',
    pairs: config.pairs || [config.pair || 'BTCUSDT'],
    exchange: config.exchange || 'binance',
    exchangeUUID: config.exchangeUUID || '',
    strategy: config.strategy || 'long',
    type: config.type || 'dca',
    enabled: config.enabled ?? true,

    // Order Configuration
    baseOrderSize: config.baseOrderSize || '10',
    orderSize: config.orderSize || '10',
    orderFixedIn: config.orderFixedIn || 'quote',
    profitCurrency: config.profitCurrency || 'quote',
    ordersCount: config.ordersCount || 5,
    step: config.step || '2',
    stepScale: config.stepScale || '1.0',
    volumeScale: config.volumeScale || '1.2',
    minimumDeviation: config.minimumDeviation || '1.0',

    // Risk Management
    useTp: config.useTp ?? true,
    tpPerc: config.tpPerc || '3',
    useSl: config.useSl ?? false,
    slPerc: config.slPerc || '10',
    useMultiTp: config.useMultiTp ?? false,

    // DCA Strategy
    useDca: config.useDca ?? true,
    dcaCondition: config.dcaCondition || '',
    scaleDcaType: config.scaleDcaType || '',

    // Deal Management
    maxNumberOfOpenDeals: config.maxNumberOfOpenDeals || '1',
    useSmartOrders: config.useSmartOrders ?? false,
    activeOrdersCount: config.activeOrdersCount || 1,
    startCondition: config.startCondition || 'asap',
    cooldown: config.cooldown || '0',

    // Optional fields with defaults
    trailingTp: config.trailingTp ?? false,
    trailingTpPerc: config.trailingTpPerc || '0.5',

    // Market conditions
    minPrice: config.minPrice || '',
    maxPrice: config.maxPrice || '',

    // Time-based settings
    startTime: config.startTime || '',
    endTime: config.endTime || '',

    // Notifications
    notifications: config.notifications ?? true,

    // Paper trading
    paperTrading: config.paperTrading ?? true,

    // Multi-level Take Profits
    multiTp: config.multiTp || [],

    // Enhanced Stop Loss
    trailingSl: config.trailingSl ?? false,
    moveSL: config.moveSL ?? false,
    moveSLTrigger: config.moveSLTrigger || '',
    moveSLValue: config.moveSLValue || '',

    // Order Types
    startOrderType: config.startOrderType || 'market',
    useLimitPrice: config.useLimitPrice ?? false,
    limitTimeout: config.limitTimeout || '0',
    useLimitTimeout: config.useLimitTimeout ?? false,

    // Scheduling
    hodlDay: config.hodlDay || '',
    hodlAt: config.hodlAt || '',
    hodlHourly: config.hodlHourly ?? false,
    hodlNextBuy: config.hodlNextBuy || 0,

    // Futures Trading
    futures: config.futures ?? false,
    coinm: config.coinm ?? false,
    leverage: config.leverage || 1,
    marginType: config.marginType || 'isolated',

    // Multi-Pair Support
    useMulti: config.useMulti ?? false,
    maxDealsPerPair: config.maxDealsPerPair || '1',

    // Advanced Features
    useCooldown: config.useCooldown ?? false,
    closeByTimer: config.closeByTimer ?? false,
    closeByTimerValue: config.closeByTimerValue || 0,
  };

  return mappedConfig;
};

/**
 * Validates form data before population
 */
export const validateFormData = (
  config: BotCreationFormData
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required field validation
  if (!config.name || config.name.trim() === '') {
    errors.push('Bot name is required');
  }

  if (!config.pair || config.pair.trim() === '') {
    errors.push('Trading pair is required');
  }

  if (!config.exchange || config.exchange.trim() === '') {
    errors.push('Exchange is required');
  }

  // Numeric validation
  const baseOrderSize = parseFloat(config.baseOrderSize);
  if (isNaN(baseOrderSize) || baseOrderSize <= 0) {
    errors.push('Base order size must be a positive number');
  }

  const orderSize = parseFloat(config.orderSize);
  if (isNaN(orderSize) || orderSize <= 0) {
    errors.push('Safety order size must be a positive number');
  }

  if (config.ordersCount <= 0) {
    errors.push('Orders count must be greater than 0');
  }

  const step = parseFloat(config.step);
  if (isNaN(step) || step <= 0) {
    errors.push('Price step must be a positive number');
  }

  // Take profit validation
  if (config.useTp) {
    const tpPerc = parseFloat(config.tpPerc);
    if (isNaN(tpPerc) || tpPerc <= 0) {
      errors.push('Take profit percentage must be a positive number');
    }
  }

  // Stop loss validation
  if (config.useSl) {
    const slPerc = parseFloat(config.slPerc);
    if (isNaN(slPerc) || slPerc <= 0) {
      errors.push('Stop loss percentage must be a positive number');
    }
  }

  // Volume scale validation
  const volumeScale = parseFloat(config.volumeScale);
  if (isNaN(volumeScale) || volumeScale <= 0) {
    errors.push('Volume scale must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calculates estimated capital requirement for the configuration
 */
export const calculateCapitalRequirement = (
  config: BotCreationFormData
): number => {
  const baseOrder = parseFloat(config.baseOrderSize) || 0;
  const safetyOrder = parseFloat(config.orderSize) || 0;
  const maxOrders = config.ordersCount || 0;
  const volumeScale = parseFloat(config.volumeScale) || 1;
  const maxDeals = parseInt(config.maxNumberOfOpenDeals) || 1;

  let total = baseOrder;
  let currentOrderSize = safetyOrder;

  for (let i = 0; i < maxOrders; i++) {
    total += currentOrderSize;
    currentOrderSize *= volumeScale;
  }

  return total * maxDeals;
};

/**
 * Generates a summary of the configuration for display
 */
export const generateConfigurationSummary = (
  config: BotCreationFormData
): string => {
  const capitalReq = calculateCapitalRequirement(config);
  const strategy = `${config.strategy.toUpperCase()} ${config.type.toUpperCase()}`;

  return (
    `${strategy} bot for ${config.pair} on ${config.exchange}. ` +
    `Base: $${config.baseOrderSize}, Safety: $${config.orderSize}, ` +
    `${config.ordersCount} orders, ${config.step}% step. ` +
    `${config.useTp ? `TP: ${config.tpPerc}%` : 'No TP'}, ` +
    `${config.useSl ? `SL: ${config.slPerc}%` : 'No SL'}. ` +
    `Est. capital: $${capitalReq.toFixed(2)}`
  );
};

/**
 * Sanitizes configuration values to prevent injection attacks
 */
export const sanitizeConfiguration = (
  config: BotCreationFormData
): BotCreationFormData => {
  const sanitizeString = (str: string): string => {
    return str.replace(/[<>"'&]/g, '').trim();
  };

  const sanitizeNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0' : Math.abs(num).toString();
  };

  return {
    ...config,
    name: sanitizeString(config.name),
    pair: sanitizeString(config.pair).toUpperCase(),
    exchange: sanitizeString(config.exchange).toLowerCase(),
    strategy: sanitizeString(config.strategy).toLowerCase() as
      | 'long'
      | 'short'
      | 'both',
    type: sanitizeString(config.type).toLowerCase() as 'dca' | 'grid' | 'combo',
    baseOrderSize: sanitizeNumber(config.baseOrderSize),
    orderSize: sanitizeNumber(config.orderSize),
    step: sanitizeNumber(config.step),
    volumeScale: sanitizeNumber(config.volumeScale),
    tpPerc: sanitizeNumber(config.tpPerc),
    slPerc: sanitizeNumber(config.slPerc),
    maxNumberOfOpenDeals: sanitizeNumber(config.maxNumberOfOpenDeals),
    cooldown: config.cooldown ? sanitizeNumber(config.cooldown) : '0',
    trailingTpPerc: sanitizeNumber(config.trailingTpPerc),
    minPrice: config.minPrice ? sanitizeNumber(config.minPrice) : '',
    maxPrice: config.maxPrice ? sanitizeNumber(config.maxPrice) : '',
    startTime: sanitizeString(config.startTime || ''),
    endTime: sanitizeString(config.endTime || ''),
  };
};

/**
 * Compares two configurations to detect changes
 */
export const compareConfigurations = (
  config1: BotCreationFormData,
  config2: BotCreationFormData
): { hasChanges: boolean; changes: string[] } => {
  const changes: string[] = [];

  // Compare key fields
  const keyFields: (keyof BotCreationFormData)[] = [
    'name',
    'pair',
    'exchange',
    'strategy',
    'type',
    'baseOrderSize',
    'orderSize',
    'ordersCount',
    'step',
    'useTp',
    'tpPerc',
    'useSl',
    'slPerc',
  ];

  keyFields.forEach((field) => {
    if (config1[field] !== config2[field]) {
      changes.push(`${field}: ${config1[field]} → ${config2[field]}`);
    }
  });

  return {
    hasChanges: changes.length > 0,
    changes,
  };
};

/**
 * Creates a backup of the current form state
 */
export const createFormBackup = (config: BotCreationFormData): string => {
  try {
    return JSON.stringify(config, null, 2);
  } catch (error) {
    console.error('[FormIntegration] Failed to create backup:', error);
    return '';
  }
};

/**
 * Restores form state from backup
 */
export const restoreFormBackup = (
  backup: string
): BotCreationFormData | null => {
  try {
    const config = JSON.parse(backup);
    return mapConfigurationToFormData(config);
  } catch (error) {
    console.error('[FormIntegration] Failed to restore backup:', error);
    return null;
  }
};

export default {
  mapConfigurationToFormData,
  validateFormData,
  calculateCapitalRequirement,
  generateConfigurationSummary,
  sanitizeConfiguration,
  compareConfigurations,
  createFormBackup,
  restoreFormBackup,
};
