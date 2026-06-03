import { test, expect } from '@playwright/test';

import { math } from '@/lib/utils/math';
import { ExchangeEnum } from '@/types/exchange.types';

/**
 * Parity tests for `getPrecisionFromDecimalString`, the faithful port of the
 * legacy `botUtils.getAssetPrecision` (main-dash/helper/botUtils.ts:53-79).
 * These lock the two regressions that crept into the redesign copy:
 *   1. the multi-zero branch must count `place` zeros (not `place - 1`)
 *   2. Kucoin/paperKucoin must keep trailing zeros after the significant digit
 */
test.describe('math.getPrecisionFromDecimalString', () => {
  test('multi-zero value without a literal 1 counts the significant place', () => {
    // 0.0003 needs 4 decimals. The off-by-one bug returned 3.
    expect(math.getPrecisionFromDecimalString('0.0003')).toBe(4);
    // place <= 1 short-circuit returns the index verbatim (legacy quirk,
    // unchanged by this fix): 0.3 -> 0, 0.03 -> 1.
    expect(math.getPrecisionFromDecimalString('0.3')).toBe(0);
    expect(math.getPrecisionFromDecimalString('0.03')).toBe(1);
  });

  test('Kucoin/paperKucoin keep trailing zeros after the significant digit', () => {
    // A Kucoin tick size like 0.00010000 encodes precision via trailing zeros:
    // non-Kucoin collapses to indexOf('1')+1 = 4, Kucoin preserves length = 8.
    expect(math.getPrecisionFromDecimalString('0.00010000')).toBe(4);
    expect(
      math.getPrecisionFromDecimalString('0.00010000', ExchangeEnum.kucoin)
    ).toBe(8);
    expect(
      math.getPrecisionFromDecimalString('0.00010000', ExchangeEnum.paperKucoin)
    ).toBe(8);
  });

  test('normal pair tick sizes resolve as before', () => {
    expect(math.getPrecisionFromDecimalString('0.001')).toBe(3);
    expect(math.getPrecisionFromDecimalString('0.0001')).toBe(4);
    expect(math.getPrecisionFromDecimalString('1')).toBe(0);
    // Non-Kucoin exchange takes the same branch as no exchange.
    expect(
      math.getPrecisionFromDecimalString('0.001', ExchangeEnum.binance)
    ).toBe(3);
    // Exponential notation (1e-7) is normalised first.
    expect(math.getPrecisionFromDecimalString('1e-7')).toBe(7);
  });
});
