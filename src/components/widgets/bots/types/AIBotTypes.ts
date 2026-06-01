/* eslint-disable @typescript-eslint/no-explicit-any */
// AI Bot Assistant Types
export interface AIBotMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isTyping?: boolean;
}

export interface AIBotConversation {
  id: string;
  messages: AIBotMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AIBotConfiguration {
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
  settings: BotCreationFormData;
  missingInfo: MissingInfoRequest[];
  suggestions: string[];
}

export interface MissingInfoRequest {
  field: string;
  question: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required: boolean;
}

export interface AIBotState {
  conversations: AIBotConversation[];
  currentConfig: AIBotConfiguration | null;
  isGenerating: boolean;
  suggestBestValues: boolean;
  error: string | null;
  currentConversationId: string | null;
}

// Re-export BotCreationFormData from existing types
export interface BotCreationFormData {
  // Basic Information (Required)
  name: string;
  pair: string;
  pairs: string[];
  exchange: string;
  exchangeUUID: string;
  strategy: 'long' | 'short' | 'both';
  type: 'dca' | 'grid' | 'combo';
  enabled: boolean;

  // Core Order Configuration
  baseOrderSize: string;
  orderSize: string;
  orderFixedIn: 'quote' | 'base';
  profitCurrency: 'quote' | 'base';

  // DCA Strategy
  step: string;
  ordersCount: number;
  stepScale: string;
  volumeScale: string;
  minimumDeviation: string;
  useDca: boolean;
  dcaCondition?: string;
  scaleDcaType?: string;

  // Deal Management
  maxNumberOfOpenDeals: string;
  useSmartOrders: boolean;
  activeOrdersCount: number;
  startCondition: 'asap' | 'manual' | 'scheduled';

  // Risk Management
  useTp: boolean;
  tpPerc: string;
  useSl: boolean;
  slPerc: string;
  useMultiTp: boolean;
  trailingTp: boolean;
  trailingTpPerc: string;

  // Multi-level Take Profits
  multiTp: Array<{
    percentage: string;
    volume: string;
    enabled: boolean;
  }>;

  // Enhanced Stop Loss
  trailingSl: boolean;
  moveSL: boolean;
  moveSLTrigger: string;
  moveSLValue: string;

  // Order Types
  startOrderType: string;
  useLimitPrice: boolean;
  limitTimeout: string;
  useLimitTimeout: boolean;

  // Scheduling
  hodlDay: string;
  hodlAt: string;
  hodlHourly: boolean;
  hodlNextBuy: number;

  // Futures Trading
  futures: boolean;
  coinm: boolean;
  leverage: number;
  marginType: string;

  // Multi-Pair Support
  useMulti: boolean;
  maxDealsPerPair: string;

  // Advanced Features
  useCooldown: boolean;
  closeByTimer: boolean;
  closeByTimerValue: number;

  // Additional Optional Properties
  cooldown?: string;
  minPrice?: string;
  maxPrice?: string;
  startTime?: string;
  endTime?: string;
  notifications?: boolean;
  paperTrading?: boolean;
}

export interface AIBotAssistantProps {
  widgetId?: string;
  isEditable?: boolean;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: any;
  data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  onConfigurationGenerated?: (config: BotCreationFormData) => void;
  onFormPopulate?: (config: BotCreationFormData) => void;
}
