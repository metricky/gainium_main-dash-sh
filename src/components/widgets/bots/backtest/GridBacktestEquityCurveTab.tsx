import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import CustomTooltip from '@/components/charts/CustomTooltip';
import { math } from '@/lib/utils/math';
import type { GRIDBacktestingResultHistory, ValueChangeHistory } from '@/types';

interface GridBacktestEquityCurveTabProps {
  backtest: GRIDBacktestingResultHistory;
}

export function GridBacktestEquityCurveTab({
  backtest,
}: GridBacktestEquityCurveTabProps) {
  const initialBalance = useMemo(
    () => +(backtest.financial?.initialBalances ?? 0),
    [backtest.financial?.initialBalances]
  );

  /**
   * Down-sample values if there are more than 1 000 points, exactly
   * matching the main-dash logic.
   */
  const valuesForEquity = useMemo(() => {
    let values = [...(backtest.values ?? [])].sort((a, b) => a.time - b.time);
    if (values.length > 1000) {
      const factor = 10 * Math.floor(values.length / 1000);
      const left = Math.floor(values.length / factor);
      values = [...Array(left)].reduce(
        (acc: ValueChangeHistory[], _v: unknown, i: number) => {
          const point = values[i * factor];
          if (point) acc.push(point);
          return acc;
        },
        [] as ValueChangeHistory[]
      );
    }
    return values;
  }, [backtest.values]);

  /**
   * Build the equity data series, including buy-and-hold overlay
   * when available (same approach as main-dash).
   */
  const equityData = useMemo(() => {
    if (!valuesForEquity.length) return [];

    // Build a lookup for buy-and-hold values
    const buyAndHoldSorted = [...(backtest.buyAndHoldEquity ?? [])].sort(
      (a, b) => b.time - a.time
    );

    return valuesForEquity.map((d) => {
      const equity = math.round(initialBalance + +d.value, 8);
      const bh =
        buyAndHoldSorted.find((b) => b.time === d.time) ??
        buyAndHoldSorted.find((b) => b.time < d.time);
      return {
        time: d.time,
        equity,
        ...(bh ? { buyAndHold: bh.value } : {}),
      };
    });
  }, [valuesForEquity, backtest.buyAndHoldEquity, initialBalance]);

  const hasBuyAndHold = useMemo(
    () => equityData.some((d) => typeof d.buyAndHold === 'number'),
    [equityData]
  );

  const isProfit = useMemo(() => {
    if (!equityData.length) return true;
    return (
      equityData[equityData.length - 1].equity >= (equityData[0]?.equity ?? 0)
    );
  }, [equityData]);

  if (!equityData.length) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        No equity data available for this backtest
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden p-md">
      <ResponsiveContainer width="100%" height={420}>
        <AreaChart data={equityData}>
          <defs>
            <linearGradient id="gridEquityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={
                  isProfit
                    ? 'var(--color-profit, #22c55e)'
                    : 'var(--color-loss, #ef4444)'
                }
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={
                  isProfit
                    ? 'var(--color-profit, #22c55e)'
                    : 'var(--color-loss, #ef4444)'
                }
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            strokeOpacity={0.08}
            vertical={false}
          />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v: number) =>
              new Date(v).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            }
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={60}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(math.round(v, 2))
            }
          />
          <Tooltip
            content={
              <CustomTooltip
                labelFormatter={(label: unknown) =>
                  new Date(Number(label)).toLocaleString()
                }
              />
            }
          />
          <Area
            dataKey="equity"
            name="Value"
            type="monotone"
            stroke={
              isProfit
                ? 'var(--color-profit, #22c55e)'
                : 'var(--color-loss, #ef4444)'
            }
            strokeWidth={2}
            fill="url(#gridEquityGradient)"
            dot={false}
            isAnimationActive={false}
          />
          {hasBuyAndHold && (
            <Area
              dataKey="buyAndHold"
              name="Buy & Hold"
              type="monotone"
              stroke="var(--color-chart-3, rgba(66, 165, 245, 0.6))"
              strokeWidth={1.5}
              fill="none"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
