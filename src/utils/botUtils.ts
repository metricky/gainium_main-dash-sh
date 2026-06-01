import {
  ComboIcon,
  DcaIcon,
  GridIcon,
  HedgeComboIcon,
  HedgeDcaIcon,
  SignalIcon,
  TerminalIcon,
} from '@/components/common/BotTypeIcons';
import { BotTypesEnum } from '@/types';
import { Bot } from 'lucide-react';

/**
 * SINGLE SOURCE OF TRUTH for bot type icons
 *
 * This function determines the icon for each bot type across the entire application.
 * Update this function to change icons everywhere: bot chips, sidebar, bottom nav, etc.
 */
export function getBotTypeIcon(botType: BotTypesEnum | string) {
  switch (botType) {
    case BotTypesEnum.dca:
      return DcaIcon;
    case BotTypesEnum.terminal:
      return TerminalIcon;
    case BotTypesEnum.grid:
      return GridIcon;
    case BotTypesEnum.combo:
      return ComboIcon;
    case BotTypesEnum.hedgeCombo:
      return HedgeComboIcon;
    case BotTypesEnum.hedgeDca:
      return HedgeDcaIcon;
    // Legacy / upcoming string values
    case 'signal':
      return SignalIcon;
    case 'terminal':
      return TerminalIcon;
    default:
      return Bot;
  }
}

/**
 * SINGLE SOURCE OF TRUTH for bot type colors
 */
export function getBotTypeColor(botType: BotTypesEnum | string): string {
  switch (botType) {
    case BotTypesEnum.dca:
      return '#3b82f6';
    case BotTypesEnum.terminal:
      return '#f59e0b';
    case BotTypesEnum.grid:
      return '#10b981';
    case BotTypesEnum.combo:
      return '#8b5cf6';
    case BotTypesEnum.hedgeCombo:
      return '#ec4899'; // Pink — sibling of combo's purple
    case BotTypesEnum.hedgeDca:
      return '#6366f1'; // Indigo — sibling of DCA's blue
    case 'signal':
      return '#06b6d4';
    case 'terminal':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
}

/**
 * SINGLE SOURCE OF TRUTH for bot type labels
 */
export function getBotTypeLabel(botType: BotTypesEnum | string): string {
  if (!botType) return 'Unknown';
  switch (botType) {
    case BotTypesEnum.dca:
      return 'DCA';
    case BotTypesEnum.terminal:
      return 'Terminal';
    case BotTypesEnum.grid:
      return 'Grid';
    case BotTypesEnum.combo:
      return 'Combo';
    case BotTypesEnum.hedgeCombo:
      return 'Hedge Combo';
    case BotTypesEnum.hedgeDca:
      return 'Hedge DCA';
    case 'signal':
      return 'Signal';
    case 'terminal':
      return 'Terminal';
    default:
      return botType.charAt(0).toUpperCase() + botType.slice(1);
  }
}

// Bot type icons and colors - UPDATED to use single source of truth functions
export const BOT_TYPE_CONFIG = {
  [BotTypesEnum.dca]: {
    icon: getBotTypeIcon(BotTypesEnum.dca),
    label: getBotTypeLabel(BotTypesEnum.dca),
    color: getBotTypeColor(BotTypesEnum.dca),
  },
  [BotTypesEnum.grid]: {
    icon: getBotTypeIcon(BotTypesEnum.grid),
    label: getBotTypeLabel(BotTypesEnum.grid),
    color: getBotTypeColor(BotTypesEnum.grid),
  },
  [BotTypesEnum.combo]: {
    icon: getBotTypeIcon(BotTypesEnum.combo),
    label: getBotTypeLabel(BotTypesEnum.combo),
    color: getBotTypeColor(BotTypesEnum.combo),
  },
  [BotTypesEnum.hedgeCombo]: {
    icon: getBotTypeIcon(BotTypesEnum.hedgeCombo),
    label: getBotTypeLabel(BotTypesEnum.hedgeCombo),
    color: getBotTypeColor(BotTypesEnum.hedgeCombo),
  },
  [BotTypesEnum.hedgeDca]: {
    icon: getBotTypeIcon(BotTypesEnum.hedgeDca),
    label: getBotTypeLabel(BotTypesEnum.hedgeDca),
    color: getBotTypeColor(BotTypesEnum.hedgeDca),
  },
  [BotTypesEnum.terminal]: {
    icon: getBotTypeIcon(BotTypesEnum.terminal),
    label: getBotTypeLabel(BotTypesEnum.terminal),
    color: getBotTypeColor(BotTypesEnum.terminal),
  },
  // For legacy string values from BotCard
  signal: {
    icon: getBotTypeIcon('signal'),
    label: getBotTypeLabel('signal'),
    color: getBotTypeColor('signal'),
  },
} as const;

// Bot status configuration matching BotStatus widget
export const BOT_STATUS_CONFIG = {
  open: {
    label: 'Open',
    color: '#22c55e', // Green
    variant: 'success' as const,
  },
  range: {
    label: 'Range',
    color: '#eab308', // Yellow
    variant: 'warning' as const,
  },
  monitoring: {
    label: 'Monitoring',
    color: '#3b82f6', // Blue
    variant: 'info' as const,
  },
  error: {
    label: 'Error',
    color: '#ef4444', // Red
    variant: 'error' as const,
  },
  ok: {
    label: 'OK',
    color: '#22c55e', // Green
    variant: 'success' as const,
  },
  disabled: {
    label: 'Disabled',
    color: '#6b7280', // Gray
    variant: 'default' as const,
  },
  closed: {
    label: 'Closed',
    color: '#6b7280', // Gray
    variant: 'default' as const,
  },
  archive: {
    label: 'Archived',
    color: '#6b7280', // Gray
    variant: 'default' as const,
  },
  // Legacy status from BotCard
  active: {
    label: 'Active',
    color: '#22c55e', // Green
    variant: 'success' as const,
  },
  paused: {
    label: 'Stopped',
    color: '#6b7280', // Gray
    variant: 'secondary' as const,
  },
  stopped: {
    label: 'Stopped',
    color: '#6b7280', // Gray
    variant: 'default' as const,
  },
  pending: {
    label: 'Pending',
    color: '#f59e0b', // Amber
    variant: 'warning' as const,
  },
  completed: {
    label: 'Completed',
    color: '#22c55e', // Green
    variant: 'success' as const,
  },
  inactive: {
    label: 'Inactive',
    color: '#6b7280', // Gray
    variant: 'default' as const,
  },
} as const;

/**
 * Get bot type configuration - UPDATED to use single source of truth
 */
export function getBotTypeConfig(botType: string) {
  // Try exact match first
  if (botType in BOT_TYPE_CONFIG) {
    return BOT_TYPE_CONFIG[botType as keyof typeof BOT_TYPE_CONFIG];
  }

  // Fallback for unknown types - uses single source of truth functions
  return {
    icon: getBotTypeIcon(botType),
    label: getBotTypeLabel(botType),
    color: getBotTypeColor(botType),
  };
}

/**
 * Get bot status configuration
 */
export function getBotStatusConfig(status: string | undefined | null) {
  if (!status) {
    return {
      label: 'Unknown',
      color: '#6b7280',
      variant: 'default' as const,
    };
  }

  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus in BOT_STATUS_CONFIG) {
    return BOT_STATUS_CONFIG[
      normalizedStatus as keyof typeof BOT_STATUS_CONFIG
    ];
  }

  // Fallback for unknown status
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    color: '#6b7280',
    variant: 'default' as const,
  };
}

/**
 * Get strategy color variant
 */
export function getStrategyVariant(
  strategy: string
): 'success' | 'error' | 'default' {
  const strategyLower = strategy.toLowerCase();

  if (strategyLower === 'long') {
    return 'success';
  } else if (strategyLower === 'short') {
    return 'error';
  }

  return 'default';
}

/**
 * Get all bot types with their icons, labels, and colors for navigation
 * Uses the single source of truth functions
 */
export function getNavigationBotTypes() {
  return Object.values(BotTypesEnum).map((botType) => ({
    type: botType,
    icon: getBotTypeIcon(botType),
    label: getBotTypeLabel(botType),
    color: getBotTypeColor(botType),
  }));
}

/**
 * Get navigation route for a given bot type
 */
export function getBotTypeRoute(botType: string) {
  switch (botType) {
    case BotTypesEnum.dca:
      return '/bot';
    case BotTypesEnum.combo:
      return '/combo';
    case BotTypesEnum.grid:
      return '/grid';
    case BotTypesEnum.hedgeCombo:
      return '/hedge/combo';
    case BotTypesEnum.hedgeDca:
      return '/hedge/bot';
    case 'terminal':
      return '/terminal';
    case 'signal':
      return '/bot';
    default:
      return '/bot';
  }
}

/**
 * Get all unique icons used by bot types
 * Useful for determining which icons need to be available in the icon library
 */
export function getAllBotTypeIcons() {
  const allTypes = [...Object.values(BotTypesEnum), 'signal', 'terminal'];
  return [...new Set(allTypes.map((type) => getBotTypeIcon(type)))];
}
