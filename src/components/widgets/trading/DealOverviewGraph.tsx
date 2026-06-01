import { StatsBoxes } from '@/components/ui/StatsBoxes';
import {
  DollarSign,
  Layers,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface DealOverviewGraphProps {
  orders: Array<{
    number: number;
    price: number;
    side: string;
    quantity: number;
    type: string;
    priceDeviation?: string | null;
    avgPrice: number | undefined;
    requiredPrice: number | undefined;
    requiredPricePercent: string;
    totalBase: number | undefined;
    totalQuote: number | undefined;
  }>;
}

const ENTRY_TYPES = ['Start order', 'DCA order', 'Smart order'];

const DealOverviewGraph: React.FC<DealOverviewGraphProps> = ({ orders }) => {
  const buyOrders = useMemo(() => {
    // Use order type to classify: entry/DCA orders vs exit orders.
    // For SHORT strategy, entry orders have side='SELL', so filtering by side alone breaks.
    return orders.filter((o) => ENTRY_TYPES.includes(o.type));
  }, [orders]);

  const {
    maxPrice,
    priceRange,
    maxQuote,
    totalCapital,
    incrementalMap,
    referencePrice,
    maxDeviation,
    minDeviation,
  } = useMemo(() => {
    if (orders.length === 0) {
      return {
        maxPrice: 0,
        minPrice: 0,
        priceRange: 0,
        maxQuote: 0,
        totalCapital: 0,
        incrementalMap: new Map<number, number>(),
        referencePrice: 0,
        maxDeviation: 0,
        minDeviation: 0,
      };
    }

    // Calculate price range across ALL orders (including TP/SL)
    const allPrices = orders.map((o) => o.price);
    const max = Math.max(...allPrices);
    const min = Math.min(...allPrices);
    const range = max - min;
    const buyQuotes = buyOrders.map((o) => o.totalQuote || 0);
    const maxQ = buyQuotes.length > 0 ? Math.max(...buyQuotes) : 0;

    // Reference price is the first buy order (entry point)
    const referencePrice = buyOrders.length > 0 ? buyOrders[0].price : max;

    // Total capital is the last cumulative totalQuote on DCA (BUY) orders
    const totalCapital =
      buyOrders[buyOrders.length - 1]?.totalQuote || maxQ || 0;

    // Build incremental capital map per order number (actual order size, not cumulative)
    const incrementalMap = new Map<number, number>();

    // For BUY orders, use incremental capital
    let prev = 0;
    buyOrders.forEach((o) => {
      const curr = o.totalQuote || 0;
      const inc = Math.max(0, curr - prev);
      incrementalMap.set(o.number as number, inc);
      prev = curr;
    });

    const totalBaseAccumulated = buyOrders.reduce(
      (sum, order) => sum + (order.totalBase || 0),
      0
    );

    // For exit orders (TP/SL), mimic the full position size so SL represents total exposure
    orders
      .filter((o) => !ENTRY_TYPES.includes(o.type))
      .forEach((order) => {
        incrementalMap.set(order.number as number, totalBaseAccumulated);
      });

    // Calculate max and min deviations from reference price (as whole numbers)
    const maxDev = Math.ceil(((max - referencePrice) / referencePrice) * 100);
    const minDev = Math.floor(((min - referencePrice) / referencePrice) * 100);

    return {
      maxPrice: max,
      minPrice: min,
      priceRange: range,
      maxQuote: maxQ,
      totalCapital,
      incrementalMap,
      referencePrice,
      maxDeviation: maxDev,
      minDeviation: minDev,
    };
  }, [orders, buyOrders]);

  // Position based on deviation from reference price mapped to the scale range
  const getYPosition = (price: number) => {
    const totalRange = maxDeviation - minDeviation;
    if (totalRange === 0) return 50;
    const deviation = ((price - referencePrice) / referencePrice) * 100;
    // Map deviation to Y position (maxDeviation at top = 0%, minDeviation at bottom = 100%)
    return ((maxDeviation - deviation) / totalRange) * 100;
  };

  // Dynamic height based on number of orders - minimum 400px, add 100px per order for proper spacing
  type OrderType = DealOverviewGraphProps['orders'][number];
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    order: OrderType;
    x: number;
    y: number;
  } | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<{
    left: number;
    top: number;
    placement: 'right' | 'left';
  } | null>(null);

  useLayoutEffect(() => {
    // If no tooltip data -> hide tooltip
    if (!tooltipData) {
      setTooltipStyle(null);
      return;
    }

    const offset = 12;

    // If tooltip element is not mounted yet, set a provisional position near mouse
    if (!tooltipRef.current) {
      const provisionalLeft = Math.min(
        window.innerWidth - 8,
        tooltipData.x + offset
      );
      const provisionalTop = Math.max(
        8,
        Math.min(tooltipData.y - 40, window.innerHeight - 8)
      );

      // Only set a provisional style if there's not already one to avoid flashing
      setTooltipStyle(
        (prev) =>
          prev ?? {
            left: provisionalLeft,
            top: provisionalTop,
            placement: 'right',
          }
      );
      return;
    }

    // If mounted, measure and compute final placement
    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();

    const spaceRight = window.innerWidth - tooltipData.x - offset;
    const placeRight = spaceRight >= rect.width + 8;
    const left = placeRight
      ? tooltipData.x + offset
      : Math.max(8, tooltipData.x - offset - rect.width);

    let top = tooltipData.y - rect.height / 2;
    top = Math.max(8, Math.min(top, window.innerHeight - rect.height - 8));

    setTooltipStyle({ left, top, placement: placeRight ? 'right' : 'left' });
  }, [tooltipData]);

  const dynamicHeight = Math.max(400, orders.length * 100);

  if (buyOrders.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        No buy orders to display
      </div>
    );
  }
  return (
    <div className="w-full h-full overflow-auto p-md">
      <div
        className="flex flex-col"
        style={{ minHeight: `${dynamicHeight + 200}px` }}
      >
        {/* Key Metrics */}
        <div className="mb-6 shrink-0">
          <StatsBoxes
            boxes={[
              {
                title: 'Coverage Depth',
                value:
                  priceRange > 0
                    ? `${((priceRange / maxPrice) * 100).toFixed(2)}%`
                    : '0%',
                icon: <TrendingDown className="w-4 h-4" />,
              },
              {
                title: 'Total Capital',
                value: `$${maxQuote.toFixed(2)}`,
                icon: <DollarSign className="w-4 h-4" />,
              },
              {
                title: 'DCA Orders',
                value: buyOrders.length.toString(),
                icon: <Layers className="w-4 h-4" />,
              },
              {
                title: 'Strategy Type',
                value: priceRange / maxPrice > 0.06 ? 'Deep' : 'Shallow',
                icon: <Target className="w-4 h-4" />,
              },
              {
                title: 'Avg Down Power',
                value: `${parseFloat(buyOrders[buyOrders.length - 1]?.requiredPricePercent || '0').toFixed(1)}%`,
                icon: <TrendingUp className="w-4 h-4" />,
              },
            ]}
          />
        </div>

        {/* Main Visualization */}
        <div className="flex gap-md" style={{ height: `${dynamicHeight}px` }}>
          {/* Price Scale - integer % deviations from reference (base order = 0%) */}
          <div className="w-24 relative shrink-0">
            <div className="absolute inset-0 flex flex-col justify-between">
              {(() => {
                // Generate all integer steps from maxDeviation down to minDeviation
                const steps: number[] = [];
                for (let d = maxDeviation; d >= minDeviation; d--) {
                  steps.push(d);
                }
                // Display all steps including 0
                return steps.map((dev) => {
                  const sign = dev > 0 ? '+' : '';
                  return (
                    <div
                      key={dev}
                      className="flex items-center justify-end gap-xs"
                    >
                      <span className="text-xs font-mono text-muted-foreground">
                        {sign}
                        {dev}%
                      </span>
                      <div className="w-2 h-px bg-border"></div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Price range indicator */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-linear-to-b from-green-500/20 via-yellow-500/20 to-red-500/20 rounded"></div>
          </div>

          {/* Pyramid Visualization */}
          <div
            className="flex-1 relative"
            style={{ height: `${dynamicHeight}px` }}
          >
            {/* Grid lines */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-border/30"
                  style={{ top: `${(i / 7) * 100}%` }}
                ></div>
              ))}
            </div>

            {/* Pyramid blocks (render all orders; DCA (BUY) blocks sized proportionally to incremental capital) */}
            <div className="absolute inset-0">
              {orders.map((order, _idx) => {
                const yPos = getYPosition(order.price);

                // Width proportional to capital share, capped at 80% to prevent overflow
                const orderCapital =
                  incrementalMap.get(order.number as number) || 0;
                const capitalShare =
                  totalCapital > 0 ? orderCapital / totalCapital : 0;
                // Max 80% width, no minimum to allow small orders to be visually small
                const width = Math.min(80, capitalShare * 100);

                // Fixed height for all boxes
                const heightPx = 36;
                const marginTopPx = heightPx / 2;

                // label uses the same 'type' as table (Start order, TP order, etc.)
                const label = order.type || `Order #${order.number}`;

                // Color based on order type: entry/DCA = profit, exit = loss
                const isBuy = ENTRY_TYPES.includes(order.type);
                const bgColor = isBuy
                  ? 'oklch(from var(--color-profit) l c h / 0.4)'
                  : 'oklch(from var(--color-loss) l c h / 0.4)';
                const borderColor = isBuy
                  ? 'oklch(from var(--color-profit) l c h / 0.6)'
                  : 'oklch(from var(--color-loss) l c h / 0.6)';
                const textColor = isBuy
                  ? 'var(--color-profit)'
                  : 'var(--color-loss)';
                const lineColor = isBuy
                  ? 'oklch(from var(--color-profit) l c h / 0.3)'
                  : 'oklch(from var(--color-loss) l c h / 0.3)';

                return (
                  <div
                    key={order.number}
                    className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-200 hover:scale-105 cursor-pointer group"
                    style={{
                      top: `${yPos}%`,
                      width: `${width}%`,
                      height: `${heightPx}px`,
                      marginTop: `-${marginTopPx}px`,
                    }}
                    onMouseEnter={(e) =>
                      setTooltipData({ order, x: e.clientX, y: e.clientY })
                    }
                    onMouseMove={(e) =>
                      setTooltipData((prev) =>
                        prev
                          ? { ...prev, x: e.clientX, y: e.clientY }
                          : { order, x: e.clientX, y: e.clientY }
                      )
                    }
                    onMouseLeave={() => setTooltipData(null)}
                  >
                    {/* Block */}
                    <div
                      className="h-full border-2 rounded-lg backdrop-blur flex items-center justify-center relative overflow-visible"
                      style={{
                        background: bgColor,
                        borderColor: borderColor,
                      }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>

                      {/* Content - centered but not constrained */}
                      <div className="relative z-10 text-center whitespace-nowrap leading-none">
                        <div
                          className="text-xs font-semibold"
                          style={{
                            color: textColor,
                          }}
                        >
                          {label}
                        </div>
                        <div className="text-sm font-bold">
                          $
                          {orderCapital > 0
                            ? orderCapital.toFixed(2)
                            : order.totalQuote?.toFixed(2) || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Connection line to left axis - single continuous line */}
                    <div
                      className="absolute right-full top-1/2 -translate-y-1/2 border-t"
                      style={{
                        width: '10000px',
                        right: '0px',
                        borderColor: lineColor,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Capital allocation indicator */}
            <div className="absolute right-0 top-0 bottom-0 w-20">
              <div className="h-full flex flex-col justify-end">
                {buyOrders.map((order, idx) => {
                  const prevQuote =
                    idx > 0 ? buyOrders[idx - 1].totalQuote || 0 : 0;
                  const height =
                    (((order.totalQuote || 0) - prevQuote) / maxQuote) * 100;

                  return (
                    <div
                      key={order.number}
                      className="bg-orange-500/30 border-l-4 border-orange-500 flex items-center justify-center text-xs font-bold"
                      style={{ height: `${height}%` }}
                    >
                      {height > 10 &&
                        `${(((order.totalQuote || 0) / maxQuote) * 100).toFixed(0)}%`}
                    </div>
                  );
                })}
              </div>
              <div className="text-center text-xs text-muted-foreground mt-2">
                Capital
                <br />
                Allocation
              </div>
            </div>
          </div>
        </div>
        {tooltipData
          ? createPortal(
              <div
                ref={tooltipRef}
                className="bg-popover border rounded-lg p-md text-xs shadow-xl pointer-events-none"
                style={{
                  position: 'fixed',
                  left:
                    tooltipStyle?.left ??
                    Math.min(window.innerWidth - 8, tooltipData.x + 12),
                  top:
                    tooltipStyle?.top ??
                    Math.max(
                      8,
                      Math.min(tooltipData.y - 40, window.innerHeight - 8)
                    ),
                  zIndex: 9999,
                  maxWidth: 320,
                }}
              >
                <div className="space-y-xs">
                  <div className="flex items-center justify-between gap-lg">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-mono">
                      ${tooltipData.order.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-lg">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono">
                      {tooltipData.order.quantity} USDT
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-lg">
                    <span className="text-muted-foreground">Cumulative:</span>
                    <span className="font-mono">
                      ${tooltipData.order.totalQuote?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-lg">
                    <span className="text-muted-foreground">Avg Price:</span>
                    <span className="font-mono">
                      ${tooltipData.order.avgPrice?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-lg">
                    <span className="text-muted-foreground">TP Target:</span>
                    <span className="font-mono text-green-400">
                      ${tooltipData.order.requiredPrice?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-lg">
                    <span className="text-muted-foreground">
                      Required change to TP in %
                    </span>
                    <span className="font-mono">
                      {tooltipData.order.requiredPricePercent
                        ? `${parseFloat(tooltipData.order.requiredPricePercent).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>,
              document.body
            )
          : null}
      </div>
    </div>
  );
};

export default DealOverviewGraph;
