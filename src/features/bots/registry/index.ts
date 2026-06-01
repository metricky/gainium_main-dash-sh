export function ensureBotRegistryBootstrapped() {
  // No-op: registry is populated eagerly from the bot experience catalog.
}

export {
  registerBotType,
  resolveBotType,
  listBotTypes,
  setDefaultBotTypeId,
  getDefaultBotTypeId,
} from './BotTypeRegistry';
export * from './BotTypeRegistry';
export { registerDcaBotType } from './entries/dca';
export { registerComboBotType } from './entries/combo';
export { registerGridBotType } from './entries/grid';
/* export { registerHedgeBotType } from './entries/hedge';
export { registerHedgeDcaBotType } from './entries/hedge-dca';
export { registerHedgeComboBotType } from './entries/hedge-combo'; */
export {
  DCA_BOT_TYPE_ID,
  DCA_LEGACY_IDS,
  COMBO_BOT_TYPE_ID,
  COMBO_LEGACY_IDS,
  GRID_BOT_TYPE_ID,
  GRID_LEGACY_IDS,
  HEDGE_BOT_TYPE_ID,
  HEDGE_LEGACY_IDS,
  HEDGE_DCA_BOT_TYPE_ID,
  HEDGE_DCA_LEGACY_IDS,
  HEDGE_COMBO_BOT_TYPE_ID,
  HEDGE_COMBO_LEGACY_IDS,
} from '../constants/botTypeIds';
