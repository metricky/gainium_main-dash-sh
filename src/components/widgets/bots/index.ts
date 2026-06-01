import React from 'react';
import {
  ensureBotRegistryBootstrapped,
  resolveBotType,
} from '@/features/bots/registry';
import { default as Backtests } from './Backtests';
import { default as BotChart } from './BotChart';
import { default as BotPerformance } from './BotPerformance';
import { default as CreateBot } from './CreateBot';
import { default as DealHistory } from './DealHistory';
import { default as AIBotAssistant } from './AIBotAssistant';
import { default as ExampleOrders } from './ExampleOrders';
import { default as EditBot } from './EditBot';
import { default as EditBotChart } from './EditBotChart';
import { default as EditBotPerformance } from './EditBotPerformance';
import { default as EditBotProfit } from './EditBotProfit';
import { default as EditBotEvents } from './EditBotEvents';
import { default as EditDealHistory } from './EditDealHistory';
import { default as EditOrders } from './EditOrders';
import { GridBotData } from '@/features/bots/bot-types/grid/data';
import { default as NotesWidget } from '../dashboard/NotesWidget';

import {
  getCompatibilityDefaultSize,
  type WidgetSize,
} from '../DefaultWidgetSizes';
import type { BotTypesEnum } from '@/types';

export type BotWidgetType =
  | 'bot-performance'
  | 'deal-history'
  | 'backtests'
  | 'bot-chart'
  | 'create-bot'
  | 'ai-bot-assistant'
  | 'example-orders'
  | 'edit-bot'
  | 'edit-bot-chart'
  | 'edit-bot-performance'
  | 'edit-bot-profit'
  | 'edit-deal-history'
  | 'edit-bot-events'
  | 'edit-orders'
  | 'grid-bot-data'
  | 'notes';

export interface BotWidgetConfig {
  component: React.FC<{
    widgetId: string;
    [key: string]: unknown;
    botType: BotTypesEnum;
    terminal: boolean;
  }>;
  metadata: {
    id: string;
    type: BotWidgetType;
    title: string;
    category?: string;
    defaultSize: WidgetSize;
    minSize?: WidgetSize;
    maxSize?: WidgetSize;
    hasOptions?: boolean;
  };
}

export const BOT_WIDGET_REGISTRY: Record<BotWidgetType, BotWidgetConfig> = {
  'bot-performance': {
    component: BotPerformance,
    metadata: {
      id: 'bot-performance',
      type: 'bot-performance',
      title: 'Bot Performance',
      category: 'Analytics',
      defaultSize: getCompatibilityDefaultSize('bot-performance'),
      minSize: { w: 4, h: 4 },
      maxSize: { w: 12, h: 8 },
      hasOptions: true,
    },
  },
  'deal-history': {
    component: DealHistory,
    metadata: {
      id: 'deal-history',
      type: 'deal-history',
      title: 'Deal History',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('deal-history'),
      minSize: { w: 8, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  backtests: {
    component: Backtests,
    metadata: {
      id: 'backtests',
      type: 'backtests',
      title: 'Backtests',
      category: 'Analytics',
      defaultSize: getCompatibilityDefaultSize('backtests'),
      minSize: { w: 8, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'bot-chart': {
    component: BotChart,
    metadata: {
      id: 'bot-chart',
      type: 'bot-chart',
      title: 'Chart',
      category: 'Charts',
      defaultSize: getCompatibilityDefaultSize('bot-chart'),
      minSize: { w: 8, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'create-bot': {
    component: CreateBot,
    metadata: {
      id: 'create-bot',
      type: 'create-bot',
      title: 'Create Bot',
      category: 'Management',
      defaultSize: getCompatibilityDefaultSize('create-bot'),
      minSize: { w: 6, h: 8 },
      maxSize: { w: 10, h: 12 },
      hasOptions: true,
    },
  },
  'ai-bot-assistant': {
    component: AIBotAssistant,
    metadata: {
      id: 'ai-bot-assistant',
      type: 'ai-bot-assistant',
      title: 'AI Bot Assistant',
      category: 'Utilities',
      defaultSize: getCompatibilityDefaultSize('ai-bot-assistant'),
      minSize: { w: 6, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'example-orders': {
    component: ExampleOrders,
    metadata: {
      id: 'example-orders',
      type: 'example-orders',
      title: 'Example Orders for a Deal',
      category: 'Analysis',
      defaultSize: getCompatibilityDefaultSize('example-orders'),
      minSize: { w: 8, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'edit-bot': {
    component: EditBot,
    metadata: {
      id: 'edit-bot',
      type: 'edit-bot',
      title: 'Edit Bot',
      category: 'Management',
      defaultSize: getCompatibilityDefaultSize('edit-bot'),
      minSize: { w: 6, h: 8 },
      maxSize: { w: 10, h: 12 },
      hasOptions: true,
    },
  },
  'edit-bot-chart': {
    component: EditBotChart,
    metadata: {
      id: 'edit-bot-chart',
      type: 'edit-bot-chart',
      title: 'Trading Chart',
      category: 'Charts',
      defaultSize: getCompatibilityDefaultSize('bot-chart'),
      minSize: { w: 8, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'edit-bot-performance': {
    component: EditBotPerformance,
    metadata: {
      id: 'edit-bot-performance',
      type: 'edit-bot-performance',
      title: 'Performance Analysis',
      category: 'Analytics',
      defaultSize: getCompatibilityDefaultSize('bot-performance'),
      minSize: { w: 4, h: 4 },
      maxSize: { w: 12, h: 8 },
      hasOptions: true,
    },
  },
  'edit-bot-profit': {
    component: EditBotProfit,
    metadata: {
      id: 'edit-bot-profit',
      type: 'edit-bot-profit',
      title: 'Profit Analysis',
      category: 'Analytics',
      defaultSize: getCompatibilityDefaultSize('bot-performance'),
      minSize: { w: 6, h: 4 },
      maxSize: { w: 12, h: 8 },
      hasOptions: true,
    },
  },
  'edit-deal-history': {
    component: EditDealHistory,
    metadata: {
      id: 'edit-deal-history',
      type: 'edit-deal-history',
      title: 'Deal History',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('deal-history'),
      minSize: { w: 8, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'edit-bot-events': {
    component: EditBotEvents,
    metadata: {
      id: 'edit-bot-events',
      type: 'edit-bot-events',
      title: 'Bot Events',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('edit-bot-events'),
      minSize: { w: 8, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'edit-orders': {
    component: EditOrders,
    metadata: {
      id: 'edit-orders',
      type: 'edit-orders',
      title: 'Bot Orders',
      category: 'Trading',
      defaultSize: getCompatibilityDefaultSize('deal-history'),
      minSize: { w: 8, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
  },
  'grid-bot-data': {
    component: (props) => React.createElement(GridBotData, props),
    metadata: {
      id: 'grid-bot-data',
      type: 'grid-bot-data',
      title: 'Grid Bot Data',
      category: 'Analytics',
      defaultSize: getCompatibilityDefaultSize('edit-bot-performance'),
      minSize: { w: 8, h: 8 },
      maxSize: { w: 12, h: 14 },
    },
  },
  notes: {
    component: NotesWidget,
    metadata: {
      id: 'notes',
      type: 'notes',
      title: 'Notes',
      category: 'Utilities',
      defaultSize: getCompatibilityDefaultSize('notes'),
      minSize: { w: 4, h: 4 },
      maxSize: { w: 8, h: 8 },
      hasOptions: true,
    },
  },
};

export function getBotWidgetMetadata(type: BotWidgetType) {
  const widget = BOT_WIDGET_REGISTRY[type];
  if (!widget) {
    throw new Error(`Unknown widget type: ${type}`);
  }
  return widget.metadata;
}

export function getBotWidgetComponent(type: BotWidgetType) {
  const widget = BOT_WIDGET_REGISTRY[type];
  if (!widget) {
    console.error(
      `Unknown widget type: ${type}. Available types:`,
      Object.keys(BOT_WIDGET_REGISTRY)
    );
    // Return a fallback component instead of throwing
    return () =>
      React.createElement(
        'div',
        {
          className: 'p-md border border-red-200 bg-red-50 rounded-lg',
        },
        `Unknown widget type: ${type}`
      );
  }
  return widget.component;
}

// Export widget components for direct use
export { default as Backtests } from './Backtests';
export { default as BotChart } from './BotChart';
export { default as BotPerformance } from './BotPerformance';
export { default as CreateBot } from './CreateBot';
export { default as DealHistory } from './DealHistory';
export { default as ExampleOrders } from './ExampleOrders';
// Edit-specific widgets (exported for direct use only, not in registry)
export { default as EditBotChart } from './EditBotChart';
export { default as EditBotPerformance } from './EditBotPerformance';
export { default as EditDealHistory } from './EditDealHistory';

// Export component prop types
export type { BacktestsProps } from './Backtests';
export type { BotChartProps } from './BotChart';
export type { BotPerformanceProps } from './BotPerformance';
export type { CreateBotProps } from './CreateBot';
export type { DealHistoryProps } from './DealHistory';
export type { ExampleOrdersProps } from './ExampleOrders';
// Edit-specific widget prop types (for direct use only)
export type { EditBotChartProps } from './EditBotChart';
export type { EditBotPerformanceProps } from './EditBotPerformance';
export type { EditDealHistoryProps } from './EditDealHistory';

// Helper function to get all available bot widget types
export const getAvailableBotWidgetTypes = (): BotWidgetType[] => {
  return Object.keys(BOT_WIDGET_REGISTRY) as BotWidgetType[];
};

// Helper function to check if a widget type is a bot widget
export const isBotWidget = (type: string): type is BotWidgetType => {
  return type in BOT_WIDGET_REGISTRY;
};

// Helper function to get available bot widget types for a specific page
export const getAvailableBotWidgetTypesForPage = (
  widgetSet: 'create' | 'edit',
  options?: { botTypeId?: string | null }
): BotWidgetType[] => {
  if (options?.botTypeId) {
    try {
      ensureBotRegistryBootstrapped();
      const config = resolveBotType(options.botTypeId);
      const defaults =
        widgetSet === 'edit'
          ? config.defaults.editWidgetTypes
          : config.defaults.createWidgetTypes;

      if (defaults && defaults.length > 0) {
        return defaults;
      }
    } catch (error) {
      console.warn(
        `[Bot Widgets] Falling back to legacy widget list for botType='${options.botTypeId}':`,
        error
      );
    }
  }

  const allBotWidgetTypes = getAvailableBotWidgetTypes();

  // Define which widgets belong to which page
  const editPageWidgets: BotWidgetType[] = [
    'edit-bot-chart',
    'edit-bot',
    'backtests',
    'notes',
  ];

  const createPageWidgets: BotWidgetType[] = [
    'bot-chart',
    'create-bot',
    'backtests',
    'notes',
  ];

  const pageWidgets =
    widgetSet === 'edit' ? editPageWidgets : createPageWidgets;

  // Filter all bot widgets to only include those for the current page
  return allBotWidgetTypes.filter((type) => pageWidgets.includes(type));
};
