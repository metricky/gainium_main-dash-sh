import { test, expect } from '@playwright/test';

import { toExchangeCandleSymbol } from '@/utils/exchangeUtils';
import { ExchangeEnum } from '@/types/exchange.types';

/**
 * `toExchangeCandleSymbol` is applied at the `requestCandles` chokepoint so
 * every candle consumer hits KuCoin's API with the dashed native symbol
 * ("BTC-USDT"). The legacy -> redesign rewrite dropped this, so KuCoin spot
 * backtests / market-stats fetches were sending the concatenated "BTCUSDT"
 * and getting 400100 "Unsupported trading pair".
 */
test.describe('toExchangeCandleSymbol', () => {
  test('KuCoin spot concatenated pairs become dashed native', () => {
    expect(toExchangeCandleSymbol(ExchangeEnum.kucoin, 'BTCUSDT')).toBe(
      'BTC-USDT'
    );
    expect(toExchangeCandleSymbol(ExchangeEnum.paperKucoin, 'ETHUSDC')).toBe(
      'ETH-USDC'
    );
  });

  test('already-dashed KuCoin symbols pass through (chart datafeed)', () => {
    expect(toExchangeCandleSymbol(ExchangeEnum.kucoin, 'BTC-USDT')).toBe(
      'BTC-USDT'
    );
  });

  test('other exchanges pass the concatenated pair through unchanged', () => {
    expect(toExchangeCandleSymbol(ExchangeEnum.binance, 'BTCUSDT')).toBe(
      'BTCUSDT'
    );
    expect(toExchangeCandleSymbol(ExchangeEnum.bybit, 'BTCUSDT')).toBe(
      'BTCUSDT'
    );
    // KuCoin futures use contract symbols, not BASE-QUOTE — left untouched.
    expect(toExchangeCandleSymbol(ExchangeEnum.kucoinLinear, 'BTCUSDT')).toBe(
      'BTCUSDT'
    );
  });

  test('unsplittable KuCoin symbol falls back to the input', () => {
    // No recognizable quote suffix → return as-is rather than emit "FOO-".
    expect(toExchangeCandleSymbol(ExchangeEnum.kucoin, 'FOOBAR')).toBe(
      'FOOBAR'
    );
  });
});
