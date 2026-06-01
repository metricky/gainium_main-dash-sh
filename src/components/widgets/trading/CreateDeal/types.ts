// Enums and interfaces for TakeProfitSettings component

export enum CloseConditionEnum {
  tp = 'tp',
  techInd = 'techInd',
  webhook = 'webhook',
  manual = 'manual',
  dynamicAr = 'dynamicAr',
}

export enum CooldownUnits {
  minutes = 'minutes',
  hours = 'hours',
  days = 'days',
  weeks = 'weeks',
}

export enum ComboTpBase {
  filled = 'filled', // Based on used DCA
  full = 'full', // Based on max DCA
}

export enum GroupJoinOperator {
  AND = 'AND',
  OR = 'OR',
}

export enum DynamicArType {
  ATR = 'ATR',
  ADR = 'ADR',
}

export interface MultiTP {
  uuid: string;
  target: string; // Percentage (e.g., "2.5")
  amount: string; // Position percentage (e.g., "50")
  fixed?: string; // Fixed price value
}

export interface TechnicalIndicator {
  uuid: string;
  type: string; // e.g., 'Moving Averages', 'RSI', 'MACD'
  reference: string; // e.g., 'Current price', 'Close price'
  relativeTo: string; // e.g., 'EMA', 'SMA'
  length?: string; // EMA length, RSI period, etc.
  interval: string; // e.g., '1 day', '4 hours'
  condition: string; // e.g., 'Crossing up', 'Above', 'Below'
  value?: string; // For conditions that need a value
  keepTrue: string; // Number of periods to keep true
}

export interface TechnicalIndicatorGroup {
  uuid: string;
  indicators: TechnicalIndicator[];
  joinOperator: GroupJoinOperator; // How indicators within group are joined
}

export interface TakeProfitSettings {
  // Main toggle
  useTp: boolean;

  // Deal close options
  dealCloseCondition: CloseConditionEnum;

  // Close by timer
  closeByTimer: boolean;
  timerValue: number;
  timerUnits: CooldownUnits;

  // Multiple TP targets
  useMultipleTp: boolean;
  multiTp: MultiTP[];

  // Single TP configuration
  tpPerc: string;
  useFixedPrice: boolean;
  fixedPrice?: string;

  // Trailing TP
  trailingTp: boolean;
  trailingDeviation: string;

  // Combo bot specific
  tpLimit: boolean; // true = Limit, false = Market
  comboTpBase: ComboTpBase;

  // Technical indicators (conditional)
  minTpFilter: boolean;
  minTpPerc: string;

  // Technical indicators groups
  techIndicatorGroups: TechnicalIndicatorGroup[];
  groupJoinOperator: GroupJoinOperator; // How groups are joined together

  // Dynamic ATR/ADR settings
  dynamicArSettings?: DynamicArSettings;
}

export interface DynamicArSettings {
  uuid: string;
  type: DynamicArType; // ATR or ADR
  length: string; // Period length (e.g., "14")
  interval: string; // Time interval (e.g., "1 day")
  multiplier: string; // Multiplier value (e.g., "2.0")
}

// Stop Loss specific types
export interface MultiSL {
  uuid: string;
  target: string; // Negative percentage (e.g., "-5.0")
  amount: string; // Position percentage (e.g., "50")
  fixed?: string; // Fixed price value
}

export interface StopLossSettings {
  // Main toggle
  useSl: boolean;

  // Deal close options
  dealCloseCondition: CloseConditionEnum;

  // Close by timer
  closeByTimer: boolean;
  timerValue: number;
  timerUnits: CooldownUnits;

  // Multiple SL targets
  useMultipleSl: boolean;
  multiSl: MultiSL[];

  // Single SL configuration
  slPerc: string;
  useFixedPrice: boolean;
  fixedPrice?: string;

  // Trailing SL
  trailingSl: boolean;
  trailingDeviation: string;

  // Combo bot specific
  slLimit: boolean; // true = Limit, false = Market
  comboSlBase: ComboTpBase;

  // Technical indicators (conditional)
  minSlFilter: boolean;
  minSlPerc: string;

  // Technical indicators groups
  techIndicatorGroups: TechnicalIndicatorGroup[];
  groupJoinOperator: GroupJoinOperator; // How groups are joined together

  // Dynamic ATR/ADR settings
  dynamicArSettings?: DynamicArSettings;
}

// Update close conditions map for stop loss
export const closeConditionsMapSL = {
  tp: 'Percentage',
  dynamicAr: 'Dynamic AR',
  techInd: 'Technical indicators',
  webhook: 'Webhook',
};

export const closeConditionsMap = {
  tp: 'Percentage',
  dynamicAr: 'Dynamic AR',
  techInd: 'Technical indicators',
  webhook: 'Webhook',
};

export const cooldownUnitsMap = {
  minutes: 'Minutes',
  hours: 'Hours',
  days: 'Days',
  weeks: 'Weeks',
};

export type CreateDealHandle = {
  resetToDefaults: () => void;
  openPresets: () => void;
};
