// Grid Bot Type Registry Entry

import { registerBotModule } from '../BotTypeRegistry';

import { gridModule } from '@/features/bots/modules/gridModule';
import {
  GRID_BOT_TYPE_ID,
  GRID_LEGACY_IDS,
} from '@/features/bots/constants/botTypeIds';

export { GRID_BOT_TYPE_ID, GRID_LEGACY_IDS };

export {
  GRID_CREATE_WIDGETS,
  GRID_EDIT_WIDGETS,
  GRID_CREATE_LAYOUTS,
  GRID_EDIT_LAYOUTS,
  GRID_PRIMARY_DATA_WIDGET,
} from './grid.presets';

export function registerGridBotType(options?: { setAsDefault?: boolean }) {
  registerBotModule(gridModule, options);
  return gridModule;
}
