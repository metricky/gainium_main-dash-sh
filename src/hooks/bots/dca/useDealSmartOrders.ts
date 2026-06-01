import { useTradingPairsFromContext } from '@/contexts/ExchangeDataContext';
import { useUsdRate } from '@/hooks/useUsdRate';
import { useUserFees } from '@/hooks/useUserFeesService';
import logger from '@/lib/loggerInstance';
import {
  BotOrderSideEnum,
  DCAOrderTypeEnum,
  StrategyEnum,
  type Asset,
  type DCABotSettings,
  type DCADeals,
  type DCAGrid,
  type Symbols,
} from '@/types';
import type { ViewOrder } from '@/types/bots';
import {
  createComboOrders,
  createDCAOrders,
  defaultContext,
  type ExampleOrdersStoreContext,
} from '@/utils/bots/dca/example-orders-core';
import { useBalanceStore } from '@/stores/live/balanceStore';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * A smart order is a `ViewOrder` shaped projected (not-yet-placed) ladder
 * level. The `__smart` marker lets the table render it as a "Smart order /
 * NEW" row distinct from real exchange orders.
 */
export type SmartViewOrder = ViewOrder & { __smart: true };

export interface UseDealSmartOrdersParams {
  /** Bot whose settings seed the ladder (merged with the deal's own settings). */
  bot: { settings?: DCABotSettings; exchangeUUID?: string } | null | undefined;
  /** The raw deal (NOT the lossy TradeDetails). */
  deal: DCADeals | null | undefined;
  /** Real placed orders for this deal — used for the legacy price bound + dedup. */
  pendingOrders: ViewOrder[];
  /** Real filled/cancelled orders for this deal — used for dedup (the bug fix). */
  completedOrders: ViewOrder[];
  /** Combo bots project grid levels instead of DCA levels. */
  isCombo?: boolean;
  /** Master switch (e.g. selected deal id matches). */
  enabled?: boolean;
}

export interface UseDealSmartOrdersResult {
  /** Projected rows for the orders table. */
  smartOrders: SmartViewOrder[];
  /** Projected grey levels for the price chart (grey:true → renders grey). */
  smartChartOrders: DCAGrid[];
  strategy: StrategyEnum;
}

const EMPTY: UseDealSmartOrdersResult = {
  smartOrders: [],
  smartChartOrders: [],
  strategy: StrategyEnum.long,
};

/**
 * Computes the projected "smart order" ladder for an active deal, mirroring
 * legacy `main-dash` (`useDCAPage.getChartOrders`):
 *
 *  1. Build the FULL DCA/combo ladder client-side from the deal's merged
 *     settings + `initialPrice` (legacy calls `createOrders(..., all=true)`).
 *  2. Keep only the levels the bot has NOT placed yet — for a long deal,
 *     those strictly below the lowest pending real DCA order (mirror for
 *     short), bounded by the stop-loss line.
 *  3. **Dedupe against real placed/filled orders by price.** Legacy does NOT
 *     do this, which is why it shows a "Smart order" and a "FILLED" row at the
 *     same price; we drop the projected level when a real order already sits
 *     there.
 */
export function useDealSmartOrders({
  bot,
  deal,
  pendingOrders,
  completedOrders,
  isCombo = false,
  enabled = true,
}: UseDealSmartOrdersParams): UseDealSmartOrdersResult {
  const { pairsByExchange } = useTradingPairsFromContext();
  const allBalances = useBalanceStore((s) => s.balances);
  const { rate: usdRate } = useUsdRate();
  const { getCachedFee } = useUserFees();

  const mergedSettings = useMemo<DCABotSettings | null>(() => {
    if (!bot?.settings) return null;
    return { ...bot.settings, ...(deal?.settings ?? {}) } as DCABotSettings;
  }, [bot?.settings, deal?.settings]);

  const strategy = (mergedSettings?.strategy ??
    StrategyEnum.long) as StrategyEnum;

  // Resolve the rich Symbols object (precision + min/step) for the deal's pair.
  const symbol = useMemo<Symbols | null>(() => {
    if (!deal?.symbol || !pairsByExchange) return null;
    const dealExchange = String(deal.exchange ?? '').toUpperCase();
    const base = (deal.symbol.baseAsset ?? '').toUpperCase();
    const quote = (deal.symbol.quoteAsset ?? '').toUpperCase();
    for (const [exchangeName, pairs] of Object.entries(pairsByExchange)) {
      if (dealExchange && exchangeName.toUpperCase() !== dealExchange) continue;
      const match = pairs.find(
        (p) =>
          (p.baseAsset?.name ?? '').toUpperCase() === base &&
          (p.quoteAsset?.name ?? '').toUpperCase() === quote
      );
      if (match) return { ...match, maxOrders: 200 } as Symbols;
    }
    return null;
  }, [deal?.symbol, deal?.exchange, pairsByExchange]);

  const guardPass = Boolean(
    enabled &&
      deal &&
      deal.status === 'open' &&
      symbol &&
      mergedSettings &&
      (isCombo
        ? mergedSettings.comboUseSmartGrids
        : mergedSettings.useSmartOrders)
  );

  const balances = useMemo<Asset[]>(() => {
    if (!bot?.exchangeUUID) return [];
    return allBalances
      .filter((b) => b.exchangeUUID === bot.exchangeUUID && b.asset)
      .map((b) => ({
        asset: b.asset,
        free: `${b.free}`,
        locked: `${b.locked}`,
      }));
  }, [allBalances, bot?.exchangeUUID]);

  const [ladder, setLadder] = useState<DCAGrid[]>([]);
  // Key the async compute on the stable inputs that change the ladder.
  const computeKey = useMemo(() => {
    if (!guardPass || !deal || !mergedSettings || !symbol) return '';
    return JSON.stringify({
      id: deal._id,
      ip: deal.initialPrice,
      st: mergedSettings.strategy,
      step: mergedSettings.step,
      stepScale: mergedSettings.stepScale,
      vol: mergedSettings.volumeScale,
      oc: mergedSettings.ordersCount,
      os: mergedSettings.orderSize,
      bos: mergedSettings.baseOrderSize,
      ost: mergedSettings.orderSizeType,
      tp: mergedSettings.tpPerc,
      sl: mergedSettings.slPerc,
      ps: deal.settings?.orderSizePercQty,
      sym: symbol.pair,
      prec: symbol.priceAssetPrecision,
      usd: usdRate,
      combo: isCombo,
    });
  }, [guardPass, deal, mergedSettings, symbol, usdRate, isCombo]);

  const lastKeyRef = useRef<string>('');
  useEffect(() => {
    if (!guardPass || !mergedSettings || !symbol || !deal) {
      if (ladder.length) setLadder([]);
      lastKeyRef.current = '';
      return;
    }
    if (computeKey === lastKeyRef.current) return;
    lastKeyRef.current = computeKey;

    let cancelled = false;
    const userFee = getCachedFee(bot?.exchangeUUID ?? '', symbol.pair)?.maker;
    const context: ExampleOrdersStoreContext = {
      ...defaultContext,
      settings: mergedSettings,
      symbol,
      errors: {},
      botVars: null,
      inputLatestPrice: deal.initialPrice || 0,
      usdPrice: usdRate || 0,
      balances,
      breakpoints: deal.gridBreakpoints ?? [],
      tpSlTargetFilled: deal.tpSlTargetFilled ?? [],
      dcaArValues: deal.dynamicAr ?? [],
      percOrderSize: deal.settings?.orderSizePercQty ?? 0,
      userFee: typeof userFee === 'number' ? userFee : 0.001,
    };

    const run = isCombo ? createComboOrders : createDCAOrders;
    run({ all: true, noCheck: true }, context)
      .then((res) => {
        if (!cancelled) setLadder(res ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error('[useDealSmartOrders] ladder compute failed', err);
          setLadder([]);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeKey, guardPass]);

  const result = useMemo<UseDealSmartOrdersResult>(() => {
    if (!guardPass || !deal || !symbol || ladder.length === 0) return EMPTY;

    const isLong = strategy === StrategyEnum.long;
    const projType = isCombo ? DCAOrderTypeEnum.grid : DCAOrderTypeEnum.dca;

    // Lowest/highest pending real DCA order — the legacy bound.
    const pendingDcaPrices = pendingOrders
      .filter((o) => o.typeOrder === 'dealRegular')
      .map((o) => o.price)
      .filter((p) => p > 0);
    const boundPrice = isLong
      ? pendingDcaPrices.length
        ? Math.min(...pendingDcaPrices)
        : Infinity
      : pendingDcaPrices.length
      ? Math.max(...pendingDcaPrices)
      : 0;

    // Stop-loss line from the computed ladder (legacy uses the SL order price).
    const slPrice = ladder.find((o) => o.type === DCAOrderTypeEnum.sl)?.price;

    // Real order prices (placed + filled) for dedup — fixes the legacy
    // "smart order + filled order at same price" duplicate.
    const prec = symbol.priceAssetPrecision ?? 8;
    const roundP = (p: number) => Number(p.toFixed(prec));
    const realPrices = new Set(
      [...pendingOrders, ...completedOrders]
        .map((o) => o.price)
        .filter((p) => p > 0)
        .map(roundP)
    );

    const projected = ladder.filter((o) => {
      if (o.type !== projType) return false;
      if (o.hide || o.note) return false;
      if (!(o.price > 0) || !(o.qty > 0)) return false;
      // Only un-placed levels: beyond the lowest/highest pending real DCA.
      if (isLong ? !(o.price < boundPrice) : !(o.price > boundPrice)) {
        return false;
      }
      // Inside the stop loss.
      if (slPrice != null) {
        if (isLong ? !(o.price > slPrice) : !(o.price < slPrice)) return false;
      }
      // Dedup against real orders at the same price (the legacy bug fix).
      if (realPrices.has(roundP(o.price))) return false;
      return true;
    });

    const side = isLong ? BotOrderSideEnum.buy : BotOrderSideEnum.sell;
    const sideLower: 'buy' | 'sell' = isLong ? 'buy' : 'sell';
    const label = isCombo ? 'Combo grid order' : 'Smart order';

    const smartChartOrders: DCAGrid[] = projected.map((o) => ({
      ...o,
      side,
      grey: true,
      greyLabel: label,
    }));

    const smartOrders: SmartViewOrder[] = projected.map((o, i) => {
      const qty = o.qty;
      const price = o.price;
      return {
        __smart: true,
        id: `smart-${deal._id}-${i}-${roundP(price)}`,
        dealId: deal._id,
        type: sideLower,
        side: sideLower,
        status: 'pending',
        symbol: deal.symbol.symbol,
        baseAsset: deal.symbol.baseAsset,
        quoteAsset: deal.symbol.quoteAsset,
        amount: qty,
        price,
        filled: 0,
        remaining: qty,
        total: qty * price,
        createTime: new Date(0).toISOString(),
        executedQuantity: 0,
        executedPrice: 0,
        orderType: label,
        origQty: `${qty}`,
        executedQty: '0',
        typeOrder: isCombo ? 'dealGrid' : 'dealRegular',
        clientOrderId: '',
        time: 0,
      } as SmartViewOrder;
    });

    return { smartOrders, smartChartOrders, strategy };
  }, [
    guardPass,
    deal,
    symbol,
    ladder,
    strategy,
    isCombo,
    pendingOrders,
    completedOrders,
  ]);

  return result;
}
