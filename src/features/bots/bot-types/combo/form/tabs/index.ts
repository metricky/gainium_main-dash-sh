import {
  AlertTriangle,
  BarChart3,
  Cog,
  Play,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import type { BotFormTabDescriptor } from '@/features/bots/widgets/BotForm/types';
import {
  createTabDescriptors,
  type TabDescriptorInput,
} from '@/features/bots/shared/tabs/createTabDescriptors';
import { BasicSettingsTab } from '@/features/bots/bot-types/dca/form/tabs/BasicSettingsTab';
import { StrategySettingsTab } from '@/features/bots/bot-types/dca/form/tabs/StrategySettingsTab';
import { DealStartSettingsTab } from '@/features/bots/bot-types/dca/form/tabs/DealStartSettingsTab';
import { DCASettingsTab } from '@/features/bots/bot-types/dca/form/tabs/DCASettingsTab';
import { TakeProfitSettingsTab } from '@/features/bots/bot-types/dca/form/tabs/TakeProfitSettingsTab';
import { StopLossSettingsTab } from '@/features/bots/bot-types/dca/form/tabs/StopLossSettingsTab';
import { RiskRewardSettingsTab } from '@/features/bots/bot-types/dca/form/tabs/RiskRewardSettingsTab';
import { AdvancedSettingsTab } from '@/features/bots/bot-types/dca/form/tabs/AdvancedSettingsTab';

const comboTabConfig: TabDescriptorInput[] = [
  {
    id: 'basic',
    label: 'Basic',
    icon: Settings,
    Component: BasicSettingsTab,
    description:
      'Exchange, pair mode, and capital inputs tailored for combo bots.',
    navigation: {
      previous: { id: 'basic' },
    },
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: Target,
    Component: StrategySettingsTab,
    description:
      'Trading direction, base order, and safety order logic for combo bots.',
  },
  {
    id: 'deal-start',
    label: 'Deal Start',
    icon: Play,
    Component: DealStartSettingsTab,
    description: 'Configure when combo deals start and how triggers behave.',
    tooltipUrl: '/help/price-filters',
  },
  {
    id: 'dca',
    label: 'Combo Grid',
    icon: TrendingDown,
    Component: DCASettingsTab,
    description:
      'Manage combo-specific smart grids, minigrids, and DCA spacing controls.',
    tooltipUrl: '/help/minigrids-dca',
  },
  {
    id: 'take-profit',
    label: 'Take Profit',
    icon: TrendingUp,
    Component: TakeProfitSettingsTab,
    description:
      'Configure take profit targets, combo limit/market execution, and TP bases.',
    tooltipUrl: '/help/multiple-take-profit-targets',
  },
  {
    id: 'stop-loss',
    label: 'Stop Loss',
    icon: AlertTriangle,
    Component: StopLossSettingsTab,
    description:
      'Stop loss placement, combo SL order type, and protective offsets.',
    tooltipUrl: '/help/multiple-stop-loss-targets',
  },
  {
    id: 'risk-reward',
    label: 'Risk/Reward',
    icon: BarChart3,
    Component: RiskRewardSettingsTab,
    description:
      'Risk versus reward analysis (available when enabled for the plan).',
    featureFlag: 'riskRewardTab',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Cog,
    Component: AdvancedSettingsTab,
    description: 'Automation, safety toggles, and experimental combo features.',
  },
];

export const comboTabDescriptors: BotFormTabDescriptor[] =
  createTabDescriptors(comboTabConfig);

export type { BotFormTabDescriptor } from '@/features/bots/widgets/BotForm/types';
