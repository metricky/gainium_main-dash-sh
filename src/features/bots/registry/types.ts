import type { ComponentType, ReactElement, ReactNode } from 'react';

import type { BotFormMode } from '@/contexts/bots/form/BotFormProvider';
import type { BotFormTabDescriptor } from '@/features/bots/widgets/BotForm/types';
import type { BotWidgetType } from '../../../components/widgets/bots';
export type { BotWidgetType } from '../../../components/widgets/bots';
import type { RefreshBalancesResult } from '@/hooks/bots/base/useBotFormMutations';
import type { BotFormData } from '@/types/bots/form';

export interface BotWidgetLayoutBreakpoint {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BotWidgetLayoutPreset {
  mobile: BotWidgetLayoutBreakpoint;
  tablet: BotWidgetLayoutBreakpoint;
  desktop: BotWidgetLayoutBreakpoint;
}

export type BotWidgetLayoutMap = Partial<
  Record<BotWidgetType, BotWidgetLayoutPreset>
>;

export type BotWidgetComponent = (
  props: { widgetId: string } & Record<string, unknown>
) => ReactElement | null;

export interface BotActionDescriptor {
  id: string;
  label: string;
  description?: string;
  component?: ComponentType<Record<string, unknown>>;
  onTrigger?: () => Promise<unknown> | unknown;
  icon?: ReactNode;
  category?: 'primary' | 'secondary' | 'danger';
}

export interface BotTypeFactories {
  createDefaultFormState?: () => Record<string, unknown>;
  mapFormToBackend?: (form: Record<string, unknown>) => unknown;
  mapBackendToForm?: (payload: unknown) => Record<string, unknown>;
}

export interface BotWidgetRegistry {
  form?: BotWidgetComponent;
  chart?: BotWidgetComponent;
  analytics?: BotWidgetComponent;
  [key: string]: BotWidgetComponent | undefined;
}

export interface BotTypeConfig {
  id: string;
  label: string;
  description?: string;
  legacyIds?: string[];
  defaults: {
    createWidgetTypes: BotWidgetType[];
    editWidgetTypes: BotWidgetType[];
    layoutPresets?: {
      create?: BotWidgetLayoutMap;
      edit?: BotWidgetLayoutMap;
    };
  };
  widgets: BotWidgetRegistry;
  factories?: BotTypeFactories;
  actions?: BotActionDescriptor[];
  featureFlags?: Record<string, boolean>;
  metadata?: Record<string, unknown>;
}

export interface BotTypeFormContract {
  /**
   * Returns pre-populated form data overrides for a given mode.
   * The return value is merged on top of shared defaults supplied by the form kernel.
   */
  getInitialState?: (mode: BotFormMode) => Partial<BotFormData>;
  /**
   * Tab descriptors to render for the bot type. When omitted, defaults from the base module are used.
   */
  tabs?: BotFormTabDescriptor[];
  /**
   * Optional override to fetch balances. Allows modules to plug custom refresh logic per bot type.
   */
  refreshBalances?: (options: {
    exchangeUUID: string;
  }) => Promise<RefreshBalancesResult> | RefreshBalancesResult;
}

export interface BotTypeModuleAdapters {
  mapBackendToForm?: (payload: unknown) => Partial<BotFormData>;
  mapFormToBackend?: (form: BotFormData) => Record<string, unknown>;
}

export interface BotTypeModuleMetadata {
  /**
   * Feature flags toggled on a per-bot basis (merged with registry defaults).
   */
  featureFlags?: Record<string, boolean>;
  /**
   * Arbitrary metadata passed downstream (e.g., experimental toggles, widget presets).
   */
  extras?: Record<string, unknown>;
}

export interface BotTypeModule {
  /**
   * Unique identifier of the bot type handled by this module.
   */
  id: string;
  /**
   * Legacy or shell config registered with the widget layout system.
   */
  config: BotTypeConfig;
  /**
   * Form-specific hooks (tabs, default state) exposed by the module.
   */
  form?: BotTypeFormContract;
  /**
   * Mapping utilities to translate between backend payloads and form data.
   */
  adapters?: BotTypeModuleAdapters;
  /**
   * Supplemental metadata merged into the registry entry.
   */
  metadata?: BotTypeModuleMetadata;
}
