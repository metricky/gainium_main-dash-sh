import logger from '@/lib/loggerInstance';

/**
 * Map order type to human-readable name
 * Copied from main-dash to ensure consistency with backend
 */
export const mapOrderName = (
  typeOrder: string | undefined,
  sl: boolean = false
): string => {
  if (!typeOrder) {
    return 'Unknown order';
  }
  switch (typeOrder) {
    case 'dealStart':
      return 'Base order';
    case 'dealTP':
      return sl ? 'SL order' : 'TP order';
    case 'dealRegular':
      return 'DCA order';
    case 'swap':
      return 'Start order';
    case 'regular':
      return 'Regular order';
    case 'stop':
      return 'Stop order';
    case 'stab':
      return 'Stabilization order';
    case 'dealGrid':
      return 'Combo grid order';
    case 'fee':
      return 'Fee order';
    case 'rebalance':
      return 'Rebalance order';
    case 'br':
      // "br" likely stands for "break" or "breakout" order type
      // This is not in the GraphQL schema enum but appears in backend data
      logger.warn('[mapOrderName] Unknown order type "br" encountered');
      return 'Breakout order';
    case 'split':
      return 'Split order';
    case 'liquidation':
      return 'Liquidation order';
    default:
      // Log unknown order types for debugging
      if (typeOrder && typeOrder !== '') {
        logger.warn(`[mapOrderName] Unknown order type: "${typeOrder}"`);
      }
      return typeOrder || 'Unknown order';
  }
};

/**
 * Check if an order ID is a ROA (Add funds) order
 * ROA orders have specific ID patterns
 */
export const isRoaOrder = (orderId: string): boolean => {
  return (
    orderId.includes('D-ROA') || orderId.startsWith('4b1c2ba2186cBCDEDROA')
  );
};

/**
 * Get full order type label including add/reduce funds annotations
 * @param typeOrder - The order type code
 * @param sl - Whether this is a stop loss order
 * @param orderId - The order ID (to check for ROA pattern)
 * @param reduceFundsId - If present, this is a reduce funds order
 * @param isRealOrder - If true, this is an actual order (vs projected order)
 */
export const getOrderTypeLabel = (
  typeOrder: string | undefined,
  sl: boolean = false,
  orderId?: string,
  reduceFundsId?: string,
  isRealOrder: boolean = true
): string => {
  const baseName = mapOrderName(typeOrder, sl);

  // For real orders, check for add/reduce funds annotations
  if (isRealOrder) {
    if (orderId && isRoaOrder(orderId) && typeOrder === 'dealRegular') {
      return `${baseName} (Add funds order)`;
    }
    if (reduceFundsId) {
      return `${baseName} (Reduce funds order)`;
    }
  }

  return baseName;
};
