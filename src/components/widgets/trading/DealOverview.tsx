/* eslint-disable react-refresh/only-export-components */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyEnum, type DCAGrid, type DCAOrderTypeEnum } from '@/types';
import { exampleOrdersStore } from '@/utils/bots/dca/example-orders';
import type { ColumnDef } from '@tanstack/react-table';
import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { DataTable } from '../../ui/data-table/data-table';
import DealOverviewGraphCompact from './DealOverviewGraphCompact';

export interface DealOverviewProps {
  widgetId?: string;
}

interface DealOrderRow {
  id: string;
  number: number;
  price: number;
  side: string;
  quantity: string;
  type: DCAOrderTypeEnum | string;
  priceDeviation: string;
  avgPrice: number | undefined;
  requiredPrice: number | undefined;
  requiredPricePercent: string;
  totalBase: number | undefined;
  totalQuote: number | undefined;
  note: string;
}

const trimTrailingZeros = (value: string): string =>
  value.includes('.') ? value.replace(/\.?0+$/, '') : value;

export interface TotalFundsContext {
  strategy?: StrategyEnum | string;
  futures?: boolean;
  coinm?: boolean;
  baseAsset?: string;
  quoteAsset?: string;
}

// "Total Funds" tile value. Funds are deposited in the base coin for
// spot short and coin-M futures, so those show the base figure with
// the base symbol; everything else keeps the quote figure with `$`.
export const formatTotalFunds = (
  summary: { totalCapital: number; totalCapitalBase: number },
  ctx: TotalFundsContext
): string => {
  const useBase = ctx.futures
    ? Boolean(ctx.coinm)
    : ctx.strategy === StrategyEnum.short;

  if (useBase) {
    const amount = summary.totalCapitalBase || 0;
    const abs = Math.abs(amount);
    const decimals = abs >= 1000 ? 2 : abs >= 1 ? 4 : 8;
    return `${trimTrailingZeros(amount.toFixed(decimals))} ${ctx.baseAsset ?? 'Base'}`;
  }

  return `$${(summary.totalCapital || 0).toFixed(2)}`;
};

// Hook for deal overview data - shared between standalone and subtab views
export const useDealOverviewData = () => {
  const [orders, setOrders] = useState<DCAGrid[]>([]);

  useEffect(() => {
    const unsubscribe = exampleOrdersStore.subscribe((incomingOrders) => {
      setOrders(incomingOrders);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Transform DCAGrid orders to table rows
  const tableData = useMemo<DealOrderRow[]>(() => {
    return orders
      .filter((order) => !order.hide)
      .map((order, index) => {
        const requiredPricePercent =
          order.requiredPrice && order.price
            ? `${((order.requiredPrice / order.price - 1) * 100).toFixed(2)}%`
            : '';

        // Extract base and quote assets from pair (e.g., "BTC/USDT" -> base: BTC, quote: USDT)
        const [baseAsset = '', quoteAsset = ''] = order.pair.split('/');

        // Format quantity with both quote value and base value
        const quoteValue = order.qty * order.price;
        const quantity = `${quoteValue.toFixed(8)} ${quoteAsset} (${order.qty.toFixed(8)} ${baseAsset})`;

        return {
          id: order.id,
          number: index + 1,
          price: order.price,
          side: order.side,
          quantity,
          type: order.type || 'Smart order',
          priceDeviation: order.priceDeviation || '',
          avgPrice: order.avgPrice,
          requiredPrice: order.requiredPrice,
          requiredPricePercent,
          totalBase: order.base,
          totalQuote: order.quote,
          note: order.note || '',
        };
      });
  }, [orders]);

  // Transform data for the graph component
  const graphData = useMemo(() => {
    return orders
      .filter((order) => !order.hide)
      .map((order, index) => {
        const quoteValue = order.qty * order.price;
        const requiredPricePercent =
          order.requiredPrice && order.price
            ? ((order.requiredPrice / order.price - 1) * 100).toFixed(2)
            : '0';

        return {
          number: index + 1,
          price: order.price,
          side: order.side,
          quantity: quoteValue,
          type: order.type || 'Smart order',
          priceDeviation: order.priceDeviation,
          avgPrice: order.avgPrice,
          requiredPrice: order.requiredPrice,
          requiredPricePercent,
          totalBase: order.base,
          totalQuote: order.quote,
        };
      });
  }, [orders]);

  const summary = useMemo(() => {
    const entryTypes = ['Start order', 'DCA order', 'Smart order'];
    const buyOrders = graphData.filter((o) => entryTypes.includes(o.type));
    if (buyOrders.length === 0) {
      return {
        coverage: '0.00',
        avgDownPower: '0.00',
        totalCapital: 0,
        totalCapitalBase: 0,
      };
    }

    const referencePrice = buyOrders[0].price;
    const lastBuy = buyOrders[buyOrders.length - 1];

    const coverage =
      lastBuy && referencePrice
        ? Math.abs(
            ((lastBuy.price - referencePrice) / referencePrice) * 100
          ).toFixed(2)
        : '0.00';

    const lastBuyAvgPrice = lastBuy?.avgPrice;
    const avgDownPower =
      lastBuyAvgPrice && referencePrice
        ? Math.abs(
            ((lastBuyAvgPrice - referencePrice) / referencePrice) * 100
          ).toFixed(2)
        : '0.00';

    // For DCA-only flows the cumulative `totalQuote` on the last buy
    // order already represents the full capital commitment. Combo bots
    // additionally reserve funds for minigrid (`Grid` type) orders that
    // sit alongside each DCA/base order — those aren't reflected in any
    // single DCA row's cumulative `totalQuote`. Detect combo by the
    // presence of grid-type buy orders in the store and add their
    // notional cost so "Total funds" matches what's actually deployed.
    const baseCapital =
      lastBuy?.totalQuote || buyOrders[0]?.totalQuote || 0;
    const minigridCapital = graphData
      .filter(
        (o) =>
          o.type === 'Grid' &&
          o.side === 'BUY' &&
          typeof o.quantity === 'number' &&
          Number.isFinite(o.quantity)
      )
      .reduce((acc, o) => acc + (o.quantity as number), 0);
    const totalCapital = baseCapital + minigridCapital;

    // Base-currency equivalent of the cumulative capital. Spot short
    // bots deposit the base coin they sell, so the funds tile shows
    // this instead of the quote figure (minigrid base isn't tracked
    // separately, so combo short slightly under-reports — DCA short,
    // the common case, is exact).
    const totalCapitalBase =
      lastBuy?.totalBase || buyOrders[0]?.totalBase || 0;

    return { coverage, avgDownPower, totalCapital, totalCapitalBase };
  }, [graphData]);

  return { orders, tableData, graphData, summary };
};

// Standalone Graph component for subtab use
export interface DealOverviewGraphTabProps {
  className?: string;
  /** Forwarded to the compact graph so it can expand to a larger min-height */
  full?: boolean;
  /** When false, hides TP overlay lines/labels in the compact graph */
  showTpLines?: boolean;
  /** When true, shows indicator mode notice and min % separation labels */
  indicatorMode?: boolean;
  /** Fallback TP % when orders have no requiredPricePercent */
  fallbackTpPercent?: number;
}

export const DealOverviewGraphTab: React.FC<DealOverviewGraphTabProps> = ({
  className,
  full = false,
  showTpLines = true,
  indicatorMode = false,
  fallbackTpPercent,
}) => {
  const { graphData } = useDealOverviewData();

  return (
    <div className={className}>
      <DealOverviewGraphCompact
        orders={graphData}
        full={full}
        showTpLines={showTpLines}
        indicatorMode={indicatorMode}
        fallbackTpPercent={fallbackTpPercent}
      />
    </div>
  );
};

// Standalone Table component for subtab use
export interface DealOverviewTableTabProps {
  widgetId?: string;
  className?: string;
}

export const DealOverviewTableTab: React.FC<DealOverviewTableTabProps> = ({
  widgetId = 'deal-overview-table',
  className,
}) => {
  const { tableData } = useDealOverviewData();

  const columns = useMemo<ColumnDef<DealOrderRow>[]>(
    () => [
      {
        accessorKey: 'number',
        header: 'Number',
        size: 80,
        cell: ({ row }) => (
          <div className="font-medium">{row.original.number}</div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">{row.original.price.toFixed(8)}</div>
        ),
      },
      {
        accessorKey: 'side',
        header: 'Side',
        size: 80,
        cell: ({ row }) => {
          const isBuy = row.original.side === 'BUY';
          return (
            <Badge
              variant={isBuy ? 'success' : 'destructive'}
              className="font-semibold"
            >
              {row.original.side}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        size: 200,
        cell: ({ row }) => (
          <div className="font-mono text-xs">{row.original.quantity}</div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        size: 120,
        cell: ({ row }) => <div>{row.original.type}</div>,
      },
      {
        accessorKey: 'priceDeviation',
        header: 'Price deviation',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">{row.original.priceDeviation}</div>
        ),
      },
      {
        accessorKey: 'avgPrice',
        header: 'Average price',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">
            {row.original.avgPrice?.toFixed(8) || ''}
          </div>
        ),
      },
      {
        accessorKey: 'requiredPrice',
        header: 'Required price to close deal',
        size: 180,
        cell: ({ row }) => (
          <div className="font-mono">
            {row.original.requiredPrice?.toFixed(8) || ''}
          </div>
        ),
      },
      {
        accessorKey: 'requiredPricePercent',
        header: 'Required price to close deal in %',
        size: 200,
        cell: ({ row }) => (
          <div className="font-mono">{row.original.requiredPricePercent}</div>
        ),
      },
      {
        accessorKey: 'totalBase',
        header: 'Total base',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">
            {row.original.totalBase?.toFixed(8) || ''}
          </div>
        ),
      },
      {
        accessorKey: 'totalQuote',
        header: 'Total quote',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">
            {row.original.totalQuote?.toFixed(8) || ''}
          </div>
        ),
      },
      {
        accessorKey: 'note',
        header: 'Note',
        size: 150,
        cell: ({ row }) => <div>{row.original.note}</div>,
      },
    ],
    []
  );

  return (
    <div className={className}>
      <DataTable
        columns={columns}
        data={tableData}
        tableId={widgetId}
        enableGlobalFilter={false}
        enableColumnFilters={false}
        enableSorting={false}
        enableColumnVisibility={false}
        showPagination={false}
        className="h-full"
      />
    </div>
  );
};

// Original DealOverview component with tabs
const DealOverview: React.FC<DealOverviewProps> = ({
  widgetId = 'deal-overview',
}) => {
  const { graphData, tableData } = useDealOverviewData();

  const columns = useMemo<ColumnDef<DealOrderRow>[]>(
    () => [
      {
        accessorKey: 'number',
        header: 'Number',
        size: 80,
        cell: ({ row }) => (
          <div className="font-medium">{row.original.number}</div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">{row.original.price.toFixed(8)}</div>
        ),
      },
      {
        accessorKey: 'side',
        header: 'Side',
        size: 80,
        cell: ({ row }) => {
          const isBuy = row.original.side === 'BUY';
          return (
            <Badge
              variant={isBuy ? 'success' : 'destructive'}
              className="font-semibold"
            >
              {row.original.side}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        size: 200,
        cell: ({ row }) => (
          <div className="font-mono text-xs">{row.original.quantity}</div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        size: 120,
        cell: ({ row }) => <div>{row.original.type}</div>,
      },
      {
        accessorKey: 'priceDeviation',
        header: 'Price deviation',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">{row.original.priceDeviation}</div>
        ),
      },
      {
        accessorKey: 'avgPrice',
        header: 'Average price',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">
            {row.original.avgPrice?.toFixed(8) || ''}
          </div>
        ),
      },
      {
        accessorKey: 'requiredPrice',
        header: 'Required price to close deal',
        size: 180,
        cell: ({ row }) => (
          <div className="font-mono">
            {row.original.requiredPrice?.toFixed(8) || ''}
          </div>
        ),
      },
      {
        accessorKey: 'requiredPricePercent',
        header: 'Required price to close deal in %',
        size: 200,
        cell: ({ row }) => (
          <div className="font-mono">{row.original.requiredPricePercent}</div>
        ),
      },
      {
        accessorKey: 'totalBase',
        header: 'Total base',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">
            {row.original.totalBase?.toFixed(8) || ''}
          </div>
        ),
      },
      {
        accessorKey: 'totalQuote',
        header: 'Total quote',
        size: 120,
        cell: ({ row }) => (
          <div className="font-mono">
            {row.original.totalQuote?.toFixed(8) || ''}
          </div>
        ),
      },
      {
        accessorKey: 'note',
        header: 'Note',
        size: 150,
        cell: ({ row }) => <div>{row.original.note}</div>,
      },
    ],
    []
  );

  return (
    <Card className="h-full flex flex-col gap-0">
      <CardHeader className="shrink-0">
        <CardTitle className="text-base font-semibold">Deal Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="graph" className="h-full">
          <TabsList className="px-4">
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>

          <div className="p-sm h-full">
            <TabsContent value="graph" className="h-full">
              <div className="h-full">
                {/* Use the compact graph directly in this overview instance */}
                <DealOverviewGraphCompact orders={graphData} />
              </div>
            </TabsContent>
            <TabsContent value="table" className="h-full">
              <div className="h-full">
                <DataTable
                  columns={columns}
                  data={tableData}
                  tableId={widgetId}
                  enableGlobalFilter={false}
                  enableColumnFilters={false}
                  enableSorting={false}
                  enableColumnVisibility={false}
                  showPagination={false}
                  className="h-full"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DealOverview;
