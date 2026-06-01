import {
  AlertTriangle,
  /* Cog, */
  Grid3x3,
  Settings,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import type { BotFormTabDescriptor } from '@/features/bots/widgets/BotForm/types';
import {
  createTabDescriptors,
  type TabDescriptorInput,
} from '@/features/bots/shared/tabs/createTabDescriptors';
/* import { AdvancedSettingsTab } from '@/features/bots/bot-types/dca/form/tabs/AdvancedSettingsTab'; */

import { countGridTabErrors } from './tabMetrics';

import { GridBasicSettingsTab } from './GridBasicSettingsTab';
import { GridBudgetSettingsTab } from './GridBudgetSettingsTab';
import { GridRangeSettingsTab } from './GridRangeSettingsTab';
import { GridStrategySettingsTab } from './GridStrategySettingsTab';
import { GridTakeProfitSettingsTab } from './GridTakeProfitSettingsTab';
import { GridStopLossSettingsTab } from './GridStopLossSettingsTab';

const gridTabConfig: TabDescriptorInput[] = [
  {
    id: 'basic',
    label: 'Basic',
    icon: Settings,
    Component: GridBasicSettingsTab,
    description:
      'Configure bot name, exchange account, trading pairs, and initial price.',
    navigation: {
      currentLabel: 'Basic setup',
      previous: { id: 'basic', label: 'Back: Basic' },
    },
    badge: (errors) => {
      const issues = countGridTabErrors(errors, 'basic');
      return issues > 0
        ? {
            variant: 'destructive',
            label: `${issues} ${issues === 1 ? 'issue' : 'issues'}`,
          }
        : undefined;
    },
  },
  {
    id: 'grid-budget',
    label: 'Investment',
    icon: Wallet,
    Component: GridBudgetSettingsTab,
    description:
      'Define capital allocation, smart order preferences, and active orders.',
    tooltipUrl: '/help/budget-grid',
    navigation: {
      currentLabel: 'Investment & smart orders',
    },
    badge: (errors) => {
      const issues = countGridTabErrors(errors, 'grid-budget');
      return issues > 0
        ? {
            variant: 'destructive',
            label: `${issues} ${issues === 1 ? 'issue' : 'issues'}`,
          }
        : undefined;
    },
  },
  {
    id: 'grid-range',
    label: 'Range',
    icon: Grid3x3,
    Component: GridRangeSettingsTab,
    description:
      'Adjust price boundaries, grid levels, spacing, and displacement.',
    tooltipUrl: '/help/grid-step',
    navigation: {
      currentLabel: 'Price range & levels',
    },
    badge: (errors) => {
      const issues = countGridTabErrors(errors, 'grid-range');
      return issues > 0
        ? {
            variant: 'destructive',
            label: `${issues} ${issues === 1 ? 'issue' : 'issues'}`,
          }
        : undefined;
    },
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: Target,
    Component: GridStrategySettingsTab,
    description:
      'Select profit currency, order sizing reference, direction, and leverage.',
    tooltipUrl: '/help/start-price-grid-bots',
    navigation: {
      currentLabel: 'Strategy & execution',
    },
    badge: (errors) => {
      const issues = countGridTabErrors(errors, 'strategy');
      return issues > 0
        ? {
            variant: 'destructive',
            label: `${issues} ${issues === 1 ? 'issue' : 'issues'}`,
          }
        : undefined;
    },
  },
  {
    id: 'take-profit',
    label: 'Take Profit',
    icon: TrendingUp,
    Component: GridTakeProfitSettingsTab,
    description:
      'Configure take profit targets, trailing automation, and indicator exits.',
    tooltipUrl: '/help/take-profit-stop-loss-grid',
    navigation: {
      currentLabel: 'Take profit & automation',
    },
    badge: (errors) => {
      const issues = countGridTabErrors(errors, 'take-profit');
      return issues > 0
        ? {
            variant: 'destructive',
            label: `${issues} ${issues === 1 ? 'issue' : 'issues'}`,
          }
        : undefined;
    },
  },
  {
    id: 'stop-loss',
    label: 'Stop Loss',
    icon: AlertTriangle,
    Component: GridStopLossSettingsTab,
    description:
      'Configure stop loss triggers, trailing behaviour, and protection actions.',
    tooltipUrl: '/help/take-profit-stop-loss-grid',
    navigation: {
      currentLabel: 'Stop loss & automation',
    },
    badge: (errors) => {
      const issues = countGridTabErrors(errors, 'stop-loss');
      return issues > 0
        ? {
            variant: 'destructive',
            label: `${issues} ${issues === 1 ? 'issue' : 'issues'}`,
          }
        : undefined;
    },
  },
  /* {
    id: 'advanced',
    label: 'Advanced',
    icon: Cog,
    Component: AdvancedSettingsTab,
    description: 'Automations and experimental options for the bot lifecycle.',
    navigation: {
      currentLabel: 'Advanced controls',
    },
  }, */
];

export const gridTabDescriptors: BotFormTabDescriptor[] = createTabDescriptors(
  gridTabConfig,
  {
    defaultPreviousLabel: (_, previous) => `Back: ${previous.label}`,
  }
);
