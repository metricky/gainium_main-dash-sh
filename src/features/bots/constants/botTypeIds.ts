export const DCA_BOT_TYPE_ID = 'dca';
export const DCA_LEGACY_IDS = ['trading', 'trading-bot', 'dca-bot'];

export const COMBO_BOT_TYPE_ID = 'combo';
export const COMBO_LEGACY_IDS = ['combo-bot'];

export const GRID_BOT_TYPE_ID = 'grid';
export const GRID_LEGACY_IDS = ['grid-bot'];

export const HEDGE_BOT_TYPE_ID = 'hedge';
export const HEDGE_LEGACY_IDS = ['hedge-bot', 'hedge-dca-bot'];

export const HEDGE_DCA_BOT_TYPE_ID = 'hedge-dca';
export const HEDGE_DCA_LEGACY_IDS = ['hedge-dca-bot'];

export const HEDGE_COMBO_BOT_TYPE_ID = 'hedge-combo';
export const HEDGE_COMBO_LEGACY_IDS = ['hedge-combo-bot'];

type ReadonlyStringArray = readonly string[];

export type { ReadonlyStringArray as LegacyIdCollection };
