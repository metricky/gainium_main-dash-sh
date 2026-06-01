import type {
  BotTypeConfig,
  BotTypeModule,
  BotWidgetRegistry,
  BotWidgetLayoutMap,
  BotActionDescriptor,
} from '../types';
import type { BotExperienceDescriptor } from '@/features/bots/catalog/types';
import type { BotWidgetType } from '@/components/widgets/bots';

export interface LegacyBotWidgetDefaults {
  createWidgetTypes: BotWidgetType[];
  editWidgetTypes: BotWidgetType[];
  layoutPresets?: {
    create?: BotWidgetLayoutMap;
    edit?: BotWidgetLayoutMap;
  };
}

export interface LegacyBotRegistryConfig {
  defaults: LegacyBotWidgetDefaults;
  widgets: BotWidgetRegistry;
  actions?: BotActionDescriptor[];
  featureFlags?: Record<string, boolean>;
  metadata?: Record<string, unknown>;
}

export const createLegacyBotModule = (
  descriptor: BotExperienceDescriptor,
  legacy: LegacyBotRegistryConfig
): BotTypeModule => {
  const featureFlags = {
    ...(legacy.featureFlags ?? {}),
    ...(descriptor.featureFlags ?? {}),
  };

  const metadata = {
    ...(legacy.metadata ?? {}),
    ...(descriptor.metadata ?? {}),
  };

  const actions: BotActionDescriptor[] = [
    ...(descriptor.actions ?? []),
    ...(legacy.actions ?? []),
  ];

  const config: BotTypeConfig = {
    id: descriptor.id,
    label: descriptor.label,
    ...(descriptor.description !== undefined && {
      description: descriptor.description,
    }),
    ...(descriptor.legacyIds !== undefined && {
      legacyIds: descriptor.legacyIds,
    }),
    defaults: legacy.defaults,
    widgets: legacy.widgets,
    ...(actions.length > 0 && { actions }),
    ...(Object.keys(featureFlags).length > 0 && { featureFlags }),
    ...(Object.keys(metadata).length > 0 && { metadata }),
  };

  const module: BotTypeModule = {
    id: descriptor.id,
    config,
    ...(descriptor.form !== undefined && { form: descriptor.form }),
    ...(descriptor.adapters !== undefined && { adapters: descriptor.adapters }),
  };

  const hasFeatureFlags = Object.keys(featureFlags).length > 0;
  const hasMetadataExtras = Object.keys(metadata).length > 0;

  if (hasFeatureFlags || hasMetadataExtras) {
    module.metadata = {
      ...(hasFeatureFlags && { featureFlags }),
      ...(hasMetadataExtras && { extras: metadata }),
    };
  }

  return module;
};
