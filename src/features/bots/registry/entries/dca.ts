import { dcaModule } from '@/features/bots/modules/dcaModule';
import {
  DCA_BOT_TYPE_ID,
  DCA_LEGACY_IDS,
} from '@/features/bots/constants/botTypeIds';
import { registerBotModule } from '../BotTypeRegistry';

export {
  DCA_CREATE_WIDGETS,
  DCA_EDIT_WIDGETS,
  DCA_CREATE_LAYOUTS,
  DCA_EDIT_LAYOUTS,
} from './dca.presets';

export { DCA_BOT_TYPE_ID, DCA_LEGACY_IDS };

export function registerDcaBotType() {
  registerBotModule(dcaModule, { setAsDefault: true });
  return dcaModule;
}
