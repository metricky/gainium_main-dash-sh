export enum CloseConditionEnum {
  tp = 'tp',
  techInd = 'techInd',
  webhook = 'webhook',
  manual = 'manual',
  dynamicAr = 'dynamicAr',
}

export const closeConditionsMapSL = {
  [CloseConditionEnum.tp]: 'Percentage',
  [CloseConditionEnum.dynamicAr]: 'Dynamic AR',
  [CloseConditionEnum.techInd]: 'Technical indicators',
  [CloseConditionEnum.webhook]: 'Webhook',
};
