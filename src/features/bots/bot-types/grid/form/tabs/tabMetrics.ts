import type { BotFormTabId } from '@/contexts/bots/form/BotFormProvider';

const GRID_TAB_FIELD_MAP: Partial<Record<BotFormTabId, readonly string[]>> = {
  basic: ['name', 'exchange', 'pairs', 'initialPrice', 'initialPriceFrom'],
  'grid-budget': ['budget', 'useOrderInAdvance', 'ordersInAdvance'],
  'grid-range': [
    'topPrice',
    'lowPrice',
    'priceRange',
    'levels',
    'gridStep',
    'sellDisplacement',
    'useStartPrice',
    'startPrice',
  ],
  strategy: [
    'profitCurrency',
    'orderFixedIn',
    'futures',
    'coinm',
    'marginType',
    'leverage',
  ],
  'take-profit': [
    'tpSl',
    'tpPerc',
    'tpTopPrice',
    'tpSlLimit',
    'tpSlAction',
    'tpSlCondition',
  ],
  'stop-loss': [
    'sl',
    'slPerc',
    'slLowPrice',
    'slLimit',
    'slAction',
    'slCondition',
  ],
  advanced: ['prioritize', 'askToReset', 'webhookUrl', 'notes'],
};

const FIELD_TO_TAB = new Map<string, BotFormTabId>();

for (const [tabId, fields] of Object.entries(GRID_TAB_FIELD_MAP)) {
  if (!fields) {
    continue;
  }

  const typedId = tabId as BotFormTabId;
  fields.forEach((field) => {
    FIELD_TO_TAB.set(field, typedId);
  });
}

export const countGridTabErrors = (
  errors: Record<string, string>,
  tabId: BotFormTabId
): number => {
  let count = 0;

  for (const field of Object.keys(errors)) {
    const mappedTab = FIELD_TO_TAB.get(field) ?? 'advanced';
    if (mappedTab === tabId) {
      count += 1;
    }
  }

  return count;
};
