import { createElement } from 'react';

import BotFormWidget from '@/features/bots/widgets/BotForm/BotFormWidget';
import {
  DCA_CREATE_WIDGETS,
  DCA_EDIT_WIDGETS,
  DCA_CREATE_LAYOUTS,
  DCA_EDIT_LAYOUTS,
} from '@/features/bots/registry/entries/dca.presets';
import { dcaTabDescriptors } from '@/features/bots/bot-types/dca/form/tabs';
import { mapBotSettingsToFormData } from '@/mappers/bots/dca/map-bot-settings-to-form-data';
import { mapFormDataToPayload } from '@/mappers/bots/dca/map-form-data-to-payload';
import type {
  BotWidgetComponent,
  BotActionDescriptor,
} from '@/features/bots/registry';
import { DCA_FORM_DEFAULTS } from '@/contexts/bots/form/formDefaults';
import type { BotFormMode } from '@/contexts/bots/form/BotFormProvider';
import type { BotFormData, ExchangeBotForm } from '@/types/bots/form';
import { DEFAULT_EXPERIMENTAL_TOGGLES } from '@/utils/bots/dca/experimental-toggles';
import type { BotExperienceDescriptor } from '@/features/bots/catalog/types';
import {
  createLegacyBotModule,
  type LegacyBotRegistryConfig,
} from '@/features/bots/registry/legacy/createLegacyBotModule';
/* import {
  DCA_BOT_TYPE_ID,
  DCA_LEGACY_IDS,
} from '@/features/bots/constants/botTypeIds'; */
import { BotTypesEnum, type BotVars } from '@/types';

/* export { DCA_BOT_TYPE_ID, DCA_LEGACY_IDS }; */

const FormWidget: BotWidgetComponent = (props) =>
  createElement(BotFormWidget, {
    ...props,
    botType: BotTypesEnum.dca,
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
  advancedIndicators: true,
  futuresTrading: true,
  riskRewardTab: true,
  botControllerTab: true,
  experimentalTab: true,
};

const metadata = {
  version: 'modular-shell',
  formTabs: dcaTabDescriptors,
  features: {
    experimentalFeeOrder: true,
    experimentalAutoRebalancing: true,
    experimentalRemainderFullAmount: true,
    experimentalAdaptiveClose: true,
  },
  settingsImportExport: {
    entryPoint: 'widget-options',
    variant: 'dialog',
  },
  experimentalToggles: DEFAULT_EXPERIMENTAL_TOGGLES,
} as const;

const legacyConfig: LegacyBotRegistryConfig = {
  defaults: {
    createWidgetTypes: DCA_CREATE_WIDGETS,
    editWidgetTypes: DCA_EDIT_WIDGETS,
    layoutPresets: {
      create: DCA_CREATE_LAYOUTS,
      edit: DCA_EDIT_LAYOUTS,
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
  dca: { ...DCA_FORM_DEFAULTS },
});

export const dcaExperience: BotExperienceDescriptor = {
  id: BotTypesEnum.dca,
  label: 'DCA Bot',
  description: 'Dollar-cost averaging bots for spot and futures trading.',
  legacyIds: [BotTypesEnum.dca],
  featureFlags,
  metadata,
  actions,
  form: {
    getInitialState: resolveInitialState,
    tabs: dcaTabDescriptors,
  },
  adapters: {
    mapBackendToForm: (payload: unknown) =>
      mapBotSettingsToFormData(BotTypesEnum.dca, payload, { debug: false })
        .formData,
    mapFormToBackend: (
      form: BotFormData,
      vars: BotVars | undefined | null,
      exchange: ExchangeBotForm | undefined | null
    ) => {
      const data =
        mapFormDataToPayload(form, { mode: 'edit' }, vars, exchange)
          .updatePayload ?? {};
      const d = {
        ...data,
        ordersCount: data.ordersCount ? `${data.ordersCount}` : '',
        activeOrdersCount: data.activeOrdersCount
          ? `${data.activeOrdersCount}`
          : '',
      };
      return d;
    },
  },
};

export const dcaModule = createLegacyBotModule(dcaExperience, legacyConfig);
