import type { ComponentType, ReactNode } from 'react';

import type { BotFormMode } from '@/contexts/bots/form/BotFormProvider';
import type { BotFormTabDescriptor } from '@/features/bots/widgets/BotForm/types';
import type { RefreshBalancesResult } from '@/hooks/bots/base/useBotFormMutations';
import type { BotFormData } from '@/types/bots/form';
import type {
  BotSettings,
  BotTypesEnum,
  BotVars,
  DCABotSettings,
  ExchangeInUser,
} from '@/types';

export type BotExperienceId = BotTypesEnum;

export interface BotExperienceActionDescriptor {
  id: string;
  label: string;
  description?: string;
  component?: ComponentType<Record<string, unknown>>;
  onTrigger?: () => Promise<unknown> | unknown;
  icon?: ReactNode;
  category?: 'primary' | 'secondary' | 'danger';
}

export interface BotExperienceFormContract {
  getInitialState?: (mode: BotFormMode) => Partial<BotFormData>;
  tabs?: BotFormTabDescriptor[];
  refreshBalances?: (options: {
    exchangeUUID: string;
  }) => Promise<RefreshBalancesResult> | RefreshBalancesResult;
}

export interface BotExperienceAdapters {
  mapBackendToForm?: (payload: unknown) => Partial<BotFormData>;
  mapFormToBackend?: (
    form: BotFormData,
    vars?: BotVars | undefined | null,
    exchange?: ExchangeInUser | undefined | null
  ) => Partial<DCABotSettings> | Partial<BotSettings>;
}

export interface BotExperienceMetadata {
  featureFlags?: Record<string, boolean>;
  extras?: Record<string, unknown>;
}

export interface BotExperienceDescriptor {
  id: BotExperienceId;
  label: string;
  description?: string;
  legacyIds?: BotExperienceId[];
  featureFlags?: Record<string, boolean>;
  metadata?: Record<string, unknown>;
  form?: BotExperienceFormContract;
  adapters?: BotExperienceAdapters;
  actions?: BotExperienceActionDescriptor[];
}
