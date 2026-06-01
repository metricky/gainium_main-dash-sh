import { createContext, useContext } from 'react';
import type { BotExperienceDescriptor } from '@/features/bots/catalog/types';

export interface BotFormRegistryContextValue {
  botExperience: BotExperienceDescriptor;
  widgetId: string;
}

export const BotFormRegistryContext = createContext<
  BotFormRegistryContextValue | undefined
>(undefined);

export const useBotFormRegistryContext = (): BotFormRegistryContextValue => {
  const context = useContext(BotFormRegistryContext);

  if (!context) {
    throw new Error(
      'useBotFormRegistryContext must be used within a BotFormRegistryContext provider'
    );
  }

  return context;
};
