/**
 * Hedge bot — chart panel.
 *
 * Renders TradingViewChart for the *active* leg. Each leg owns its own
 * pair and exchange — the chart reflects whichever leg is mounted, and
 * symbol picks via the TradingView widget land on that leg's formData
 * only (the other leg's pair is unaffected). The active-leg publisher
 * inside the leg's BotFormWidget supplies `activeLegPair`,
 * `activeLegExchangeUUID`, and a writer the chart calls on pick.
 *
 * Subscribes to `exampleOrdersStore` so the active leg's estimated
 * orders draw on the chart as horizontal lines, the same way the
 * single-bot edit page does.
 */
import { useEffect, useMemo, useState } from 'react';

import TradingViewChart from '@/components/widgets/shared/TradingViewChart/TradingViewChart';
import {
  useExchangesFromContext,
  useTradingPairsFromContext,
} from '@/contexts/ExchangeDataContext';
import { useHedgeBotForm } from '@/contexts/bots/form/HedgeBotFormProvider';
import type { ChartOrderLine, DCAGrid, Symbols } from '@/types';
import { exampleOrdersStore } from '@/utils/bots/dca/example-orders';

export const HedgeChartPanel: React.FC = () => {
  const { activeLegPair, activeLegExchangeUUID, chartSymbolWriterRef } =
    useHedgeBotForm();
  const { pairsByExchange } = useTradingPairsFromContext();
  const { data: exchangesData } = useExchangesFromContext();

  const [exampleOrders, setExampleOrders] = useState<DCAGrid[]>([]);
  useEffect(() => {
    const unsubscribe = exampleOrdersStore.subscribe((incoming) => {
      setExampleOrders(incoming);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const orders: ChartOrderLine[] = useMemo(
    () =>
      exampleOrders
        .filter((o) => !o.hide && !o.note)
        .map((o) => ({
          ...o,
          side: o.side.toLowerCase(),
          label: o.label ?? o.type,
          greyLabel: o.grey ? (o.greyLabel ?? 'Smart order') : undefined,
          noLabel: false,
          isDraggable: o.grey ? false : !!o.draggable,
          ...(o.grey ? { color: '#94a3b8' } : {}),
        })),
    [exampleOrders]
  );

  const exchange = useMemo(() => {
    if (!activeLegExchangeUUID) return undefined;
    const match = exchangesData?.data?.exchanges?.find(
      (e) => e.uuid === activeLegExchangeUUID
    );
    return match?.provider;
  }, [activeLegExchangeUUID, exchangesData?.data?.exchanges]);

  const exchangeSymbols: Symbols[] = useMemo(() => {
    if (!exchange) return [];
    const pairs = pairsByExchange?.[exchange];
    if (!pairs) return [];
    // TradingPair (from useTradingPairs) and Symbols (chart's expected
    // shape) are nearly identical except for `maxOrders` — the picker
    // doesn't use that field, so we fill it in defensively.
    return pairs.map((p) => ({
      ...p,
      maxOrders: 0,
      crossAvailable: p.crossAvailable ?? false,
    })) as Symbols[];
  }, [exchange, pairsByExchange]);

  if (!exchange || !activeLegPair) {
    return (
      <div className="flex h-full items-center justify-center p-md text-sm text-muted-foreground">
        Pick an exchange and pair in the active leg to render the chart.
      </div>
    );
  }

  return (
    <TradingViewChart
      symbol={`${activeLegPair}@${exchange}`}
      availableSymbols={exchangeSymbols}
      orders={orders}
      setOnChangeSymbol={(s) => chartSymbolWriterRef.current?.(s.pair)}
      widgetId={`hedge-chart-${exchange}`}
    />
  );
};

export default HedgeChartPanel;
