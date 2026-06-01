import { registerBotModule } from '../BotTypeRegistry';

import { comboModule } from '@/features/bots/modules/comboModule';
import {
  COMBO_BOT_TYPE_ID,
  COMBO_LEGACY_IDS,
} from '@/features/bots/constants/botTypeIds';

export { COMBO_BOT_TYPE_ID, COMBO_LEGACY_IDS };

export {
  COMBO_CREATE_WIDGETS,
  COMBO_EDIT_WIDGETS,
  COMBO_CREATE_LAYOUTS,
  COMBO_EDIT_LAYOUTS,
} from './combo.presets';

export function registerComboBotType(options?: { setAsDefault?: boolean }) {
  registerBotModule(comboModule, options);
  return comboModule;
}
