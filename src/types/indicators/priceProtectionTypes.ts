export const PRICE_PROTECTION_TYPE_VALUES = [
  'Price Based',
  'Event Based',
  'Market Based',
] as const;

export type PriceProtectionType = (typeof PRICE_PROTECTION_TYPE_VALUES)[number];

export const PRICE_PROTECTION_PRICE_VALUES = [
  'HH',
  'LH',
  'HL',
  'LL',
  'Any High',
  'Any Low',
] as const;

export const PRICE_PROTECTION_SWING_VALUES = [
  'SH',
  'SL',
  'WH',
  'WL',
  'anyH',
  'anyL',
] as const;

export const PRICE_PROTECTION_MARKET_VALUES = ['BullM', 'BearM'] as const;

export const PRICE_PROTECTION_EVENT_VALUES = [
  'SBullBoS',
  'SBearBoS',
  'SBullCHoCH',
  'SBearCHoCH',
  'SAnyBull',
  'SAnyBear',
  'IBullBoS',
  'IBearBoS',
  'IBullCHoCH',
  'IBearCHoCH',
  'IAnyBull',
  'IAnyBear',
  'BullAnyBoS',
  'BearAnyBoS',
  'BullAnyCHoCH',
  'BearAnyCHoCH',
] as const;

export type PriceProtectionValue =
  | (typeof PRICE_PROTECTION_PRICE_VALUES)[number]
  | (typeof PRICE_PROTECTION_SWING_VALUES)[number]
  | (typeof PRICE_PROTECTION_MARKET_VALUES)[number]
  | (typeof PRICE_PROTECTION_EVENT_VALUES)[number];

export const PRICE_PROTECTION_VALUE_GROUPS = {
  price: new Set(PRICE_PROTECTION_PRICE_VALUES),
  swing: new Set(PRICE_PROTECTION_SWING_VALUES),
  market: new Set(PRICE_PROTECTION_MARKET_VALUES),
  event: new Set(PRICE_PROTECTION_EVENT_VALUES),
} as const;

export const PRICE_PROTECTION_VALUE_LABELS: Record<
  PriceProtectionValue,
  string
> = {
  HH: 'Higher High',
  LH: 'Lower High',
  HL: 'Higher Low',
  LL: 'Lower Low',
  'Any High': 'Any Pivot High',
  'Any Low': 'Any Pivot Low',
  SH: 'Strong High',
  SL: 'Strong Low',
  WH: 'Weak High',
  WL: 'Weak Low',
  anyH: 'Any High (Weak/Strong)',
  anyL: 'Any Low (Weak/Strong)',
  BullM: 'Bullish Market Structure',
  BearM: 'Bearish Market Structure',
  SBullBoS: 'Swing Bullish Break of Structure',
  SBearBoS: 'Swing Bearish Break of Structure',
  SBullCHoCH: 'Swing Bullish Change of Character',
  SBearCHoCH: 'Swing Bearish Change of Character',
  SAnyBull: 'Swing Any Bullish',
  SAnyBear: 'Swing Any Bearish',
  IBullBoS: 'Internal Bullish Break of Structure',
  IBearBoS: 'Internal Bearish Break of Structure',
  IBullCHoCH: 'Internal Bullish Change of Character',
  IBearCHoCH: 'Internal Bearish Change of Character',
  IAnyBull: 'Internal Any Bullish',
  IAnyBear: 'Internal Any Bearish',
  BullAnyBoS: 'Any Bullish Break of Structure',
  BearAnyBoS: 'Any Bearish Break of Structure',
  BullAnyCHoCH: 'Any Bullish Change of Character',
  BearAnyCHoCH: 'Any Bearish Change of Character',
};
