/**
 * RedesignOverviewTab — Overview body for the redesigned backtest results
 * modal. Recreates the visual output of the prototype `overviewTab.jsx`
 * (KPI row, win-rate + profit-factor donuts, performance metrics list,
 * equity curve, deal P&L scatter) using the REAL design tokens and the
 * `BacktestViewModel` — no mock data, no prototype constants.
 *
 * Layout mirrors the prototype: a KPI row across the top, then a two-column
 * body — left column (donuts + performance metrics), right column (equity
 * curve + P&L distribution). Collapses to a single column on narrow widths.
 * Equity / scatter panels self-hide when their series are unavailable.
 *
 * The small `Kpi` and `Donut` atoms are recreated from the prototype
 * `modalShell.jsx` inline here (hand-rolled SVG donut for the thin-ring look)
 * so the Overview reads as a single self-contained tab. Borders are avoided
 * per DESIGN_SYSTEM §3 — surface contrast (bg-card vs bg-muted) carries the
 * separation; the only hairline is the metrics-list divider.
 */

import type React from 'react';

import { EquityChart } from '../charts';
import type { BacktestViewModel, DealVM } from '../viewModel';

// ── formatters (mirror the prototype's GX.fmt* helpers) ─────────────────────

const fmtUsd = (v: number, d = 2): string =>
  (v < 0 ? '-$' : '$') +
  Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

const fmtPct = (v: number, d = 2): string =>
  (v > 0 ? '+' : '') + v.toFixed(d) + '%';

const fmtDur = (h: number): string => {
  const days = Math.floor(h / 24);
  const hours = Math.round(h % 24);
  return (days ? `${days}d ` : '') + `${hours}h`;
};

// ── KPI tile ────────────────────────────────────────────────────────────────

type KpiTone = 'up' | 'down' | 'neutral';

interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  tone?: KpiTone;
  /** Larger value type for the headline (Net Result) tile. */
  big?: boolean;
  /** Quiet, fixed-width tile on the muted surface (deal-duration tiles). */
  grey?: boolean;
}

/**
 * Headline KPI tile. Sits on `bg-muted` (a same-level inset on the card-level
 * modal body) by default; the "down" tone tints the whole tile with a soft
 * loss wash. The `grey` flag is now only a sizing variant (the surface is
 * `bg-muted` either way). No borders — elevation + color carry it.
 */
const Kpi: React.FC<KpiProps> = ({
  label,
  value,
  sub,
  tone = 'neutral',
  big = false,
  grey = false,
}) => {
  const valueColor =
    tone === 'up'
      ? 'text-profit'
      : tone === 'down'
        ? 'text-loss'
        : 'text-foreground';

  // Surface: down → soft loss wash; otherwise the muted inset surface.
  const surface = tone === 'down' ? 'bg-loss/10' : 'bg-muted';

  return (
    <div
      className={`flex flex-col rounded-xl px-md py-sm ${surface} ${
        grey ? 'shrink-0 min-w-[150px]' : 'flex-1 min-w-[130px]'
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1.5 font-extrabold tabular-nums tracking-tight ${
          big ? 'text-2xl' : 'text-xl'
        } ${valueColor}`}
      >
        {value}
      </div>
      {sub != null && (
        <div className="mt-0.5 text-xs tabular-nums text-muted-foreground/70">
          {sub}
        </div>
      )}
    </div>
  );
};

// ── donut (win rate / profit factor) ────────────────────────────────────────

interface DonutSegment {
  value: number;
  /** A CSS color string referencing a real token, e.g. 'var(--color-profit)'. */
  color: string;
}

interface DonutProps {
  value: string;
  label: string;
  segments: DonutSegment[];
  size?: number;
}

/**
 * Hand-rolled thin-ring donut (matches the prototype's exact look). The track
 * is `bg-muted`; segments stroke the real profit/loss/muted tokens. Center
 * shows the headline value + a small label.
 */
const Donut: React.FC<DonutProps> = ({ value, label, segments, size = 150 }) => {
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;

  // Precompute each segment's fraction and its cumulative start offset (the
  // fraction of the circle that precedes it) as a pure reduce, so the render
  // below is a side-effect-free map — no mutation of an outer variable.
  const arcs = segments.reduce<
    Array<DonutSegment & { frac: number; start: number }>
  >((acc, s) => {
    const frac = s.value / total;
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].frac : 0;
    acc.push({ ...s, frac, start });
    return acc;
  }, []);

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="color-mix(in oklch, var(--color-foreground) 10%, transparent)"
        strokeWidth="12"
      />
      {arcs.map((s, i) => {
        const dash = s.frac * circ;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-s.start * circ}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
      <text
        x={cx}
        y={cy - 1}
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="var(--color-foreground)"
        className="tabular-nums"
      >
        {value}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontSize="10.5"
        fill="var(--color-muted-foreground)"
      >
        {label}
      </text>
    </svg>
  );
};

// ── card + metric row primitives ────────────────────────────────────────────

interface PanelProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A titled inner panel on the `bg-card` modal body. Uses `bg-muted`
 * (surface-muted) for the panel surface — the same-level inner-fill token —
 * so the panels read as insets distinct from the card-level body in BOTH
 * themes (muted is 0.955 vs the white body in light mode, and 0.245 — darker —
 * vs the 0.205 card body in dark mode). Surface contrast carries the
 * separation; no border, per DESIGN_SYSTEM §3.
 */
const Panel: React.FC<PanelProps> = ({ title, className, children }) => (
  <div className={`flex flex-col rounded-xl bg-muted p-md ${className ?? ''}`}>
    <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </div>
    {children}
  </div>
);

interface MetricRowProps {
  k: string;
  v: string | number;
  tone?: KpiTone;
}

const MetricRow: React.FC<MetricRowProps> = ({ k, v, tone = 'neutral' }) => {
  const color =
    tone === 'up'
      ? 'text-profit'
      : tone === 'down'
        ? 'text-loss'
        : 'text-foreground';
  return (
    <div className="flex items-center justify-between py-[5px]">
      <span className="text-sm text-muted-foreground">{k}</span>
      <span className={`text-sm font-bold tabular-nums ${color}`}>{v}</span>
    </div>
  );
};

// ── deal P&L distribution scatter ───────────────────────────────────────────

interface ScatterProps {
  deals: DealVM[];
  width: number;
  height: number;
}

/**
 * Deal P&L distribution scatter — one dot per deal, x = close/start time,
 * y = pnl %. Zero line solid, ±yMax dashed. Profit/loss colored from the real
 * tokens. Pure inline SVG, ported from the prototype's `Scatter`.
 */
const Scatter: React.FC<ScatterProps> = ({ deals, width, height }) => {
  const pad = { t: 10, r: 10, b: 18, l: 30 };
  const GRID = 'color-mix(in oklch, var(--color-foreground) 8%, transparent)';
  const AXIS = 'var(--color-muted-foreground)';

  const xs = deals.map((d) => d.closeTime ?? d.startTime);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const ys = deals.map((d) => d.pnlPerc);
  const yMax = Math.max(1, ...ys.map(Math.abs));

  const x = (t: number): number =>
    pad.l + ((width - pad.l - pad.r) * (t - xMin)) / (xMax - xMin || 1);
  const y = (v: number): number =>
    pad.t + (height - pad.t - pad.b) * (1 - (v + yMax) / (2 * yMax));

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {[-yMax, 0, yMax].map((tk, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            x2={width - pad.r}
            y1={y(tk)}
            y2={y(tk)}
            stroke={GRID}
            strokeDasharray={tk === 0 ? '0' : '3 3'}
          />
          <text
            x={pad.l - 5}
            y={y(tk) + 3}
            textAnchor="end"
            fontSize="9.5"
            fill={AXIS}
            className="tabular-nums"
          >
            {tk.toFixed(1)}%
          </text>
        </g>
      ))}
      {deals.map((d, i) => (
        <circle
          key={i}
          cx={x(d.closeTime ?? d.startTime)}
          cy={y(d.pnlPerc)}
          r="5"
          fill={d.pnlPerc >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'}
          opacity="0.85"
        />
      ))}
    </svg>
  );
};

// ── Overview body ────────────────────────────────────────────────────────────

export interface RedesignOverviewTabProps {
  vm: BacktestViewModel;
}

/**
 * Overview tab body. Renders the KPI row, win-rate + profit-factor donuts,
 * performance-metrics list, equity curve, and deal P&L distribution scatter,
 * all sourced from the `BacktestViewModel`.
 */
export const RedesignOverviewTab: React.FC<RedesignOverviewTabProps> = ({
  vm,
}) => {
  const profitFactorLabel =
    vm.profitFactor != null ? vm.profitFactor.toFixed(2) : '∞';

  // Equity-curve deal markers: place each closed deal at the equity index
  // whose timestamp is nearest (>=) the deal close time, for visual anchors.
  const equityDealMarkers =
    vm.hasEquityCurve && vm.hasDeals
      ? vm.dealList
          .filter((d) => d.closeTime != null)
          .map((d) => {
            const closeT = d.closeTime as number;
            let endIdx = vm.equity.findIndex((p) => p.t >= closeT);
            if (endIdx < 0) endIdx = vm.equity.length - 1;
            return { endIdx, out: d.out };
          })
      : null;

  return (
    <div className="flex h-full flex-col gap-md">
      {/* KPI row */}
      <div className="flex flex-wrap gap-sm">
        <Kpi
          label="Net Result"
          value={fmtPct(vm.netPerc)}
          sub={fmtUsd(vm.netUsd)}
          tone={vm.netPerc >= 0 ? 'up' : 'down'}
          big
        />
        <Kpi
          label="Avg Daily Return"
          value={fmtPct(vm.avgDailyPerc)}
          sub={fmtUsd(vm.avgDailyUsd)}
          tone={vm.avgDailyPerc >= 0 ? 'up' : 'down'}
        />
        <Kpi
          label="Max Equity DD"
          value={vm.maxDdPerc.toFixed(2) + '%'}
          sub={fmtUsd(vm.maxDdUsd)}
          tone="down"
        />
        <Kpi
          label="Profit Factor"
          value={profitFactorLabel}
          sub={`${vm.wins}W · ${vm.losses}L`}
        />
        <Kpi label="Max Deal Dur." value={fmtDur(vm.maxDealDurH)} grey />
        <Kpi label="Avg Deal Dur." value={fmtDur(vm.avgDealDurH)} grey />
      </div>

      {/* body: left (donuts + metrics) / right (equity + scatter) */}
      <div className="flex min-h-0 flex-1 flex-col gap-md lg:flex-row">
        {/* left column */}
        <div className="flex flex-1 flex-col gap-md">
          <div className="flex flex-col gap-md sm:flex-row">
            <Panel title="Win Rate" className="flex-1 items-center">
              <Donut
                value={`${vm.winRate.toFixed(0)}%`}
                label="Win Rate"
                // open deals are excluded so the green arc fraction matches
                // the centered win-rate = wins / (wins + losses)
                segments={[
                  { value: vm.wins, color: 'var(--color-profit)' },
                  { value: vm.losses, color: 'var(--color-loss)' },
                ]}
              />
            </Panel>
            <Panel title="Profit Factor" className="flex-1 items-center">
              <Donut
                value={profitFactorLabel}
                label="Profit Factor"
                segments={[
                  { value: vm.wins, color: 'var(--color-profit)' },
                  { value: vm.losses, color: 'var(--color-loss)' },
                ]}
              />
            </Panel>
          </div>
          <Panel title="Performance Metrics" className="flex-1">
            <MetricRow k="Deals" v={vm.deals} />
            <MetricRow k="Winners" v={vm.wins} tone="up" />
            <MetricRow k="Losers" v={vm.losses} tone="down" />
            <MetricRow k="Open" v={vm.open} />
            <div className="my-1.5 border-t border-border/60" />
            <MetricRow k="Sharpe Ratio" v={vm.sharpe.toFixed(3)} />
            <MetricRow k="Sortino Ratio" v={vm.sortino.toFixed(3)} />
            <MetricRow
              k="Annualized Return"
              v={vm.annualizedPerc != null ? fmtPct(vm.annualizedPerc) : '—'}
              tone={
                vm.annualizedPerc != null && vm.annualizedPerc >= 0
                  ? 'up'
                  : vm.annualizedPerc != null
                    ? 'down'
                    : 'neutral'
              }
            />
          </Panel>
        </div>

        {/* right column */}
        {(vm.hasEquityCurve || vm.hasDeals) && (
          <div className="flex flex-col gap-md lg:w-[540px] lg:shrink-0">
            {vm.hasEquityCurve && (
              <Panel title="Equity Curve" className="flex-[1.2]">
                <div className="mb-1.5 flex gap-md text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className="inline-block h-[2.5px] w-3"
                      style={{ background: 'var(--color-profit)' }}
                    />
                    Portfolio
                  </span>
                  {vm.hasBuyAndHold && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className="inline-block h-[2.5px] w-3"
                        style={{ background: 'var(--color-info)' }}
                      />
                      Buy &amp; Hold
                    </span>
                  )}
                </div>
                <EquityChart
                  data={vm.equity}
                  width={512}
                  height={188}
                  dealMarkers={equityDealMarkers}
                  showBH={vm.hasBuyAndHold}
                  className="w-full"
                />
              </Panel>
            )}
            {vm.hasDeals && (
              <Panel title="Deal P&L Distribution" className="flex-1">
                <Scatter deals={vm.dealList} width={512} height={150} />
              </Panel>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
