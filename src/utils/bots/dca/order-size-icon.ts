import type { BotFormData } from '@/types/bots/form';

// Resolves the coin-icon symbol shown inside an order-size input. The icon
// follows the selected currency reference (`orderSizeType`): base → base asset,
// quote/usd/% → quote asset. Shared by the Base Order Size input
// (StrategySettings) and the DCA order amount input (DcaOrderSizingControl) so
// the two icons react identically when the reference changes — previously only
// the DCA input updated.
export const resolveOrderSizeIconSymbol = (
  orderSizeType: BotFormData['dca']['orderSizeType'],
  baseAsset?: string,
  quoteAsset?: string
): string => {
  switch (orderSizeType) {
    case 'base':
      return baseAsset ?? 'BTC';
    case 'quote':
      return quoteAsset ?? 'USDT';
    case 'usd':
      return 'USDT';
    case 'percFree':
    case 'percTotal':
      return quoteAsset ?? 'USDT';
    default:
      return quoteAsset ?? 'USDT';
  }
};
