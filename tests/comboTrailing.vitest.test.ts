import { test, expect } from 'vitest';
import type { ReactElement } from 'react';

import { TrailingBadge } from '@/components/trades/TrailingBadge';
import { comboDealToOpenTrade } from '@/lib/utils/comboDealToOpenTrade';
import type { ComboDeal } from '@/hooks/useComboDeals';

// Inspect the real component's Tooltip props without mounting its portal.
const badge = (level: number, levelUnit: 'price' | 'percent' = 'percent') =>
  TrailingBadge({ mode: 'ttp', level, levelUnit, quoteAsset: 'USDT' }) as
    | ReactElement<{ tooltip: string }>
    | null;

for (const level of [266.3, 0, -12.5]) {
  test(`Combo TTP renders its signed profit floor ${level}%`, () => {
    const result = badge(level);
    expect(result).not.toBeNull();
    expect(result?.props.tooltip).toContain(`${level}%`);
    expect(result?.props.tooltip).toContain('highest deal-profit percentage');
    expect(result?.props.tooltip).not.toContain('USDT');
  });

  test(`Combo deal mapping preserves trailing floor ${level}%`, () => {
    const deal = {
      _id: 'combo-trailing',
      botId: 'combo-bot',
      status: 'open',
      strategy: 'LONG',
      symbol: { symbol: 'NEARUSDT', baseAsset: 'NEAR', quoteAsset: 'USDT' },
      settings: { futures: true, coinm: false, leverage: 50 },
      usage: { current: { base: 0, quote: 20 } },
      trailingMode: 'ttp',
      trailingLevel: level,
    } as unknown as ComboDeal;
    const trade = comboDealToOpenTrade(deal);
    expect(trade.type).toBe('Combo');
    expect(trade.trailingMode).toBe('ttp');
    expect(trade.trailingLevel).toBe(level);
    expect(trade.symbol).toBe(deal.symbol.symbol);
  });
}

test('DCA trailing still requires a positive price and names its quote asset', () => {
  expect(badge(0, 'price')).toBeNull();
  expect(badge(-1, 'price')).toBeNull();
  expect(badge(123.5, 'price')?.props.tooltip).toContain('123.5 USDT');
});

test('missing activation or invalid levels do not claim trailing protection', () => {
  expect(TrailingBadge({ level: 10, levelUnit: 'percent' })).toBeNull();
  expect(TrailingBadge({ mode: 'ttp', levelUnit: 'percent' })).toBeNull();
  expect(badge(Number.NaN)).toBeNull();
  expect(badge(Number.POSITIVE_INFINITY)).toBeNull();
});
