import { createElement } from 'react';

import BotFormWidget from '@/features/bots/widgets/BotForm/BotFormWidget';
import { dcaTabDescriptors } from '@/features/bots/bot-types/dca/form/tabs';
import {
  COMBO_CREATE_WIDGETS,
  COMBO_EDIT_WIDGETS,
  COMBO_CREATE_LAYOUTS,
  COMBO_EDIT_LAYOUTS,
} from '@/features/bots/registry/entries/combo.presets';
import { mapBotSettingsToFormData } from '@/mappers/bots/dca/map-bot-settings-to-form-data';
import { mapFormDataToPayload } from '@/mappers/bots/dca/map-form-data-to-payload';
import type {
  BotWidgetComponent,
  BotActionDescriptor,
} from '@/features/bots/registry';
/* import { COMBO_FORM_DEFAULTS } from '@/contexts/bots/form/formDefaults'; */
/* import type { BotFormMode } from '@/contexts/bots/form/BotFormProvider'; */
import type { BotFormData, ExchangeBotForm } from '@/types/bots/form';
import { BotTypesEnum, /* ComboTpBase, */ type BotVars } from '@/types';
import { DEFAULT_EXPERIMENTAL_TOGGLES } from '@/utils/bots/dca/experimental-toggles';
import type { BotExperienceDescriptor } from '@/features/bots/catalog/types';
import {
  createLegacyBotModule,
  type LegacyBotRegistryConfig,
} from '@/features/bots/registry/legacy/createLegacyBotModule';
import type { BotFormMode } from '@/contexts/bots/form/BotFormProvider';
import { COMBO_FORM_DEFAULTS } from '@/contexts/bots/form/formDefaults';
/* import {
  COMBO_BOT_TYPE_ID,
  COMBO_LEGACY_IDS,
} from '@/features/bots/constants/botTypeIds'; */

const FormWidget: BotWidgetComponent = (props) =>
  createElement(BotFormWidget, {
    ...props,
    botType: BotTypesEnum.combo,
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
  riskRewardTab: false,
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
  tpSlOrdering: {
    takeProfit: 5,
    stopLoss: 6,
  },
  settingsImportExport: {
    entryPoint: 'widget-options',
    variant: 'dialog',
  },
  experimentalToggles: DEFAULT_EXPERIMENTAL_TOGGLES,
} as const;

const legacyConfig: LegacyBotRegistryConfig = {
  defaults: {
    createWidgetTypes: COMBO_CREATE_WIDGETS,
    editWidgetTypes: COMBO_EDIT_WIDGETS,
    layoutPresets: {
      create: COMBO_CREATE_LAYOUTS,
      edit: COMBO_EDIT_LAYOUTS,
    },
  },
  widgets: {
    form: FormWidget,
  },
  actions,
  featureFlags,
  metadata,
};

/* const fallbackComboValue = <T>(candidate: T | undefined, fallback: T): T =>
  candidate === undefined || candidate === null || candidate === ''
    ? fallback
    : candidate;

const coerceBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return fallback;
};

const coerceComboTpBase = (
  value: unknown,
  fallback: ComboTpBase
): ComboTpBase => {
  if (typeof value === 'string') {
    if (value === ComboTpBase.filled || value === ComboTpBase.full) {
      return value;
    }
  }

  return fallback;
}; */

/* const resolveComboState = (
  draft: Partial<BotFormData>,
  _mode: BotFormMode
): Partial<BotFormData> => {
  const merged: Partial<BotFormData> = {
    ...draft,
    combo: { ...COMBO_FORM_DEFAULTS },
  };

  return {
    ...merged,
    combo: {
      ...COMBO_FORM_DEFAULTS,
      ...merged.combo,
      comboActiveMinigrids: fallbackComboValue(
        merged.combo?.comboActiveMinigrids,
        COMBO_FORM_DEFAULTS.comboActiveMinigrids ?? '1'
      ),
      comboSmartGridsCount: fallbackComboValue(
        merged.combo?.comboSmartGridsCount,
        COMBO_FORM_DEFAULTS.comboSmartGridsCount ?? '6'
      ),
      comboTpLimit: coerceBoolean(
        merged.combo?.comboTpLimit,
        coerceBoolean(COMBO_FORM_DEFAULTS.comboTpLimit, true)
      ),
      comboSlLimit: coerceBoolean(
        merged.combo?.comboSlLimit,
        coerceBoolean(COMBO_FORM_DEFAULTS.comboSlLimit, false)
      ),
      comboTpBase: coerceComboTpBase(
        merged.combo?.comboTpBase,
        coerceComboTpBase(COMBO_FORM_DEFAULTS.comboTpBase, ComboTpBase.filled)
      ),
      baseGridLevels: fallbackComboValue(
        merged.combo?.baseGridLevels,
        COMBO_FORM_DEFAULTS.baseGridLevels ?? '5'
      ),
      baseStep: fallbackComboValue(
        merged.combo?.baseStep,
        COMBO_FORM_DEFAULTS.baseStep ?? '5'
      ),
      tpPerc: fallbackComboValue(
        merged.combo?.tpPerc,
        COMBO_FORM_DEFAULTS.tpPerc ?? '5'
      ),
      slPerc: fallbackComboValue(
        merged.combo?.slPerc,
        COMBO_FORM_DEFAULTS.slPerc ?? '-25'
      ),
      useDca: true,
      useMulti: coerceBoolean(merged.combo?.useMulti, true),
    },
  };
}; */

const resolveInitialState = (_mode: BotFormMode): Partial<BotFormData> => ({
  combo: { ...COMBO_FORM_DEFAULTS },
});

export const comboExperience: BotExperienceDescriptor = {
  id: BotTypesEnum.combo,
  label: 'Combo Bot',
  description:
    'Combo bots for advanced trading strategies combining DCA with additional features.',
  legacyIds: [BotTypesEnum.combo],
  featureFlags,
  metadata,
  actions,
  form: {
    getInitialState: resolveInitialState,
    tabs: dcaTabDescriptors,
  },
  adapters: {
    mapBackendToForm: (payload: unknown) => {
      /* const { formData } = */ return mapBotSettingsToFormData(
        BotTypesEnum.combo,
        payload
      ).formData;
      /* console.log(
        'Mapping backend to form for combo bot:',
        formData,
        resolveComboState(formData, 'edit')
      );
      return resolveComboState(formData, 'edit'); */
    },
    mapFormToBackend: (
      form: BotFormData,
      vars: BotVars | undefined | null,
      exchange: ExchangeBotForm | undefined | null
    ) => {
      /* const normalizedForm: BotFormData = resolveComboState(
        form,
        'edit'
      ) as BotFormData; */
      const data =
        mapFormDataToPayload(
          /* normalizedForm */ form,
          { mode: 'edit' },
          vars,
          exchange
        ).updatePayload ?? {};
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

export const comboModule = createLegacyBotModule(comboExperience, legacyConfig);
