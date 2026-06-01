import { createContext, useContext } from 'react';

import { BotTypesEnum } from '@/types';

/**
 * Bot types the all-strategies panel supports. Curated presets exist
 * for DCA / Combo / Grid; the panel is hidden for other bot types
 * (hedge etc.). Kept as a local alias so this context doesn't depend
 * on the cloud-only curated-presets hooks.
 */
export type AllStrategiesPanelBotType =
  | BotTypesEnum.dca
  | BotTypesEnum.combo
  | BotTypesEnum.grid;

export interface AllStrategiesPanelState {
  open: boolean;
  botType: AllStrategiesPanelBotType | null;
}

export interface AllStrategiesPanelContextValue {
  state: AllStrategiesPanelState;
  openPanel: (botType: AllStrategiesPanelBotType) => void;
  closePanel: () => void;
}

export const AllStrategiesPanelContext =
  createContext<AllStrategiesPanelContextValue | null>(null);

export const useAllStrategiesPanel = (): AllStrategiesPanelContextValue => {
  const ctx = useContext(AllStrategiesPanelContext);
  if (!ctx) {
    return {
      state: { open: false, botType: null },
      openPanel: () => {},
      closePanel: () => {},
    };
  }
  return ctx;
};
