import { createElement } from 'react';

import BotFormWidget from '@/features/bots/widgets/BotForm/BotFormWidget';
import { gridTabDescriptors } from '@/features/bots/bot-types/grid/form/tabs';
import {
  GRID_CREATE_WIDGETS,
  GRID_EDIT_WIDGETS,
  GRID_CREATE_LAYOUTS,
  GRID_EDIT_LAYOUTS,
  GRID_PRIMARY_DATA_WIDGET,
} from '@/features/bots/registry/entries/grid.presets';
import { mapGridBotSettingsToFormData } from '@/mappers/bots/grid/map-grid-bot-settings-to-form-data';
import { mapGridFormDataToPayload } from '@/mappers/bots/grid/map-grid-form-data-to-payload';
import type {
  BotWidgetComponent,
  BotActionDescriptor,
} from '@/features/bots/registry';
import { GRID_FORM_DEFAULTS } from '@/contexts/bots/form/formDefaults';
import type { BotFormMode } from '@/contexts/bots/form/BotFormProvider';
import type { BotFormData, ExchangeBotForm } from '@/types/bots/form';
import type { BotExperienceDescriptor } from '@/features/bots/catalog/types';
import {
  createLegacyBotModule,
  type LegacyBotRegistryConfig,
} from '@/features/bots/registry/legacy/createLegacyBotModule';
/* import {
  GRID_BOT_TYPE_ID,
  GRID_LEGACY_IDS,
} from '@/features/bots/constants/botTypeIds'; */
import { BotTypesEnum, type BotVars } from '@/types';

/* export { GRID_BOT_TYPE_ID, GRID_LEGACY_IDS }; */

const FormWidget: BotWidgetComponent = (props) =>
  createElement(BotFormWidget, {
    ...props,
    botType: BotTypesEnum.grid,
    terminal: false,
  });

const actions: BotActionDescriptor[] = [
  {
    id: 'delete-bot',
    label: 'Delete Bot',
    description: 'Permanently delete this bot and all its data',
    onTrigger: () => {
      // TODO: Implement delete action
    },
    category: 'danger',
  },
  {
    id: 'toggle-status',
    label: 'Change Status',
    description: 'Start or stop the bot',
    onTrigger: () => {
      // TODO: Implement status toggle action
    },
    category: 'primary',
  },
  {
    id: 'configure-webhook',
    label: 'Configure Webhook',
    description: 'Set up webhooks for bot events',
    onTrigger: () => {
      // TODO: Implement webhook configuration action
    },
    category: 'secondary',
  },
  {
    id: 'success-feedback',
    label: 'Success',
    description: 'Show success feedback after actions',
    onTrigger: () => {
      // TODO: Implement success feedback action
    },
    category: 'secondary',
  },
];

const featureFlags = {
  multiPairTrading: true,
  advancedIndicators: false,
  futuresTrading: true,
  riskRewardTab: false,
  botControllerTab: true,
  experimentalTab: false,
};

const metadata = {
  version: 'modular-shell',
  formTabs: gridTabDescriptors,
  modules: {
    data: '@/features/bots/bot-types/grid/data',
    monitoring: '@/features/bots/bot-types/grid/widgets',
    backtesting: '@/features/bots/bot-types/grid/backtesting',
  },
  widgets: {
    primaryData: GRID_PRIMARY_DATA_WIDGET,
    notes: 'notes',
  },
  settingsImportExport: {
    entryPoint: 'widget-options',
    variant: 'dialog',
  },
} as const;

const legacyConfig: LegacyBotRegistryConfig = {
  defaults: {
    createWidgetTypes: GRID_CREATE_WIDGETS,
    editWidgetTypes: GRID_EDIT_WIDGETS,
    layoutPresets: {
      create: GRID_CREATE_LAYOUTS,
      edit: GRID_EDIT_LAYOUTS,
    },
  },
  widgets: {
    form: FormWidget,
  },
  actions,
  featureFlags,
  metadata,
};

const resolveInitialState = (_mode: BotFormMode): Partial<BotFormData> => ({
  grid: { ...GRID_FORM_DEFAULTS },
});
export const gridExperience: BotExperienceDescriptor = {
  id: BotTypesEnum.grid,
  label: 'Grid Bot',
  description:
    'Grid trading bots for automated buy/sell orders at predefined price levels.',
  legacyIds: [BotTypesEnum.grid],
  featureFlags,
  metadata,
  actions,
  form: {
    getInitialState: resolveInitialState,
    tabs: gridTabDescriptors,
  },
  adapters: {
    mapBackendToForm: (payload: unknown) => {
      const { formData } = mapGridBotSettingsToFormData(payload);

      return {
        ...formData,
        type: BotTypesEnum.grid,
        useDca: false,
      };
    },
    mapFormToBackend: (
      form: BotFormData,
      vars: BotVars | undefined | null,
      exchange: ExchangeBotForm | undefined | null
    ) => {
      const normalizedForm: BotFormData = {
        ...form,
        type: BotTypesEnum.grid,
      };
      const data = mapGridFormDataToPayload(
        normalizedForm,
        {
          mode: 'edit',
        },
        vars,
        exchange
      ).updatePayload;
      if (!data) {
        throw new Error('Failed to map form data to payload');
      }
      const d = {
        ...data,
      };
      return d;
    },
  },
};

export const gridModule = createLegacyBotModule(gridExperience, legacyConfig);
