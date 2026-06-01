import { forwardRef, type SVGProps } from 'react';

export interface BotTypeIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
}

const baseSvgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function makeIcon(displayName: string, render: () => React.ReactNode) {
  const Icon = forwardRef<SVGSVGElement, BotTypeIconProps>(function Icon(
    { size = 24, color, strokeWidth = 2, className, style, ...rest },
    ref
  ) {
    return (
      <svg
        ref={ref}
        {...baseSvgProps}
        width={size}
        height={size}
        strokeWidth={strokeWidth}
        className={className}
        style={color ? { color, ...style } : style}
        {...rest}
      >
        {render()}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}

// DCA — three descending entry dots ("average down") followed by a long
// up-right recovery diagonal that exits ABOVE the first entry, with a
// prominent lucide-style L arrowhead. Reads as "buy lower, exit higher."
export const DcaIcon = makeIcon('DcaIcon', () => (
  <>
    <path d="M4 8 L9 13 L14 18" />
    <path d="M14 18 L21 4" />
    <path d="M14 4 L21 4 L21 11" />
    <circle cx="4" cy="8" r="2.4" fill="currentColor" stroke="none" />
    <circle cx="9" cy="13" r="2.4" fill="currentColor" stroke="none" />
    <circle cx="14" cy="18" r="2.4" fill="currentColor" stroke="none" />
  </>
));

// GRID — 3 × 3 lattice of equal order markers. Each dot is an order at
// an evenly-spaced price step; the regular matrix reads unambiguously
// as "grid."
export const GridIcon = makeIcon('GridIcon', () => {
  const pts: Array<[number, number]> = [];
  for (const y of [5, 12, 19]) for (const x of [5, 12, 19]) pts.push([x, y]);
  return (
    <>
      {pts.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="1.9"
          fill="currentColor"
          stroke="none"
        />
      ))}
    </>
  );
});

// COMBO — the grid's 3 × 3 lattice with the DCA descending diagonal
// highlighted. Small dots = background grid orders, large dots = the
// DCA entry sequence chosen within that grid.
export const ComboIcon = makeIcon('ComboIcon', () => {
  const grid: Array<[number, number]> = [];
  for (const y of [5, 12, 19]) for (const x of [5, 12, 19]) grid.push([x, y]);
  const isDiag = (x: number, y: number) =>
    (x === 5 && y === 5) ||
    (x === 12 && y === 12) ||
    (x === 19 && y === 19);
  return (
    <>
      {grid.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={isDiag(cx, cy) ? 2.6 : 1.2}
          fill="currentColor"
          stroke="none"
          opacity={isDiag(cx, cy) ? 1 : 0.45}
        />
      ))}
      <path d="M5 5 L12 12 L19 19" opacity="0.6" />
    </>
  );
});

// TERMINAL — two OHLC candlesticks set well apart. Each wick is split
// into an upper and a lower segment so it stops at the body edges
// rather than crossing through the hollow body.
export const TerminalIcon = makeIcon('TerminalIcon', () => (
  <>
    {/* Bullish candle (left): hollow body, wicks above & below only */}
    <line x1="6" y1="2" x2="6" y2="6" />
    <line x1="6" y1="18" x2="6" y2="22" />
    <rect x="2.5" y="6" width="7" height="12" />
    {/* Bearish candle (right): filled body, wicks above & below */}
    <line x1="18" y1="4" x2="18" y2="9" />
    <line x1="18" y1="17" x2="18" y2="20" />
    <rect
      x="14.5"
      y="9"
      width="7"
      height="8"
      fill="currentColor"
    />
  </>
));

// HEDGE DCA — mirrored DCA legs across a horizontal pivot axis. Top
// half: descending long-DCA entries with an up-right exit arrow.
// Bottom half: mirrored short-DCA entries with a down-right exit arrow.
// The dashed pivot makes the long-vs-short opposition explicit.
export const HedgeDcaIcon = makeIcon('HedgeDcaIcon', () => (
  <>
    {/* Pivot axis */}
    <line
      x1="2"
      y1="12"
      x2="22"
      y2="12"
      strokeDasharray="2 2"
      opacity="0.55"
    />
    {/* LONG leg (top): descending entries + up-right L arrow */}
    <path d="M3 3 L8 6 L13 9" />
    <path d="M13 9 L21 3" />
    <path d="M15 3 L21 3 L21 9" />
    <circle cx="3" cy="3" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="8" cy="6" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="13" cy="9" r="1.7" fill="currentColor" stroke="none" />
    {/* SHORT leg (bottom): mirrored entries + down-right L arrow */}
    <path d="M3 21 L8 18 L13 15" />
    <path d="M13 15 L21 21" />
    <path d="M15 21 L21 21 L21 15" />
    <circle cx="3" cy="21" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="8" cy="18" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="13" cy="15" r="1.7" fill="currentColor" stroke="none" />
  </>
));

// HEDGE COMBO — Combo's 3 × 3 grid lattice with an X overlay of two
// crossing legs (the hedged long + short paths) instead of Combo's
// single descending diagonal. Structurally distinct from Hedge DCA:
// here the visual base is "grid + crossing legs," not mirrored DCA paths.
export const HedgeComboIcon = makeIcon('HedgeComboIcon', () => {
  const grid: Array<[number, number]> = [];
  for (const y of [5, 12, 19]) for (const x of [5, 12, 19]) grid.push([x, y]);
  const isCorner = (x: number, y: number) =>
    (x === 5 && y === 5) ||
    (x === 19 && y === 5) ||
    (x === 5 && y === 19) ||
    (x === 19 && y === 19) ||
    (x === 12 && y === 12);
  return (
    <>
      {/* Grid lattice (dim background) with corners + center emphasized */}
      {grid.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={isCorner(cx, cy) ? 2.2 : 1.2}
          fill="currentColor"
          stroke="none"
          opacity={isCorner(cx, cy) ? 1 : 0.45}
        />
      ))}
      {/* Crossing legs (the hedge X) through the grid */}
      <path d="M5 5 L19 19" opacity="0.7" />
      <path d="M5 19 L19 5" opacity="0.7" />
    </>
  );
});

// SIGNAL — WiFi-style broadcast fan: a receiver dot at the bottom with
// three concentric arcs above. Universal "incoming wireless signal /
// webhook trigger received."
export const SignalIcon = makeIcon('SignalIcon', () => (
  <>
    <circle cx="12" cy="19" r="2" fill="currentColor" stroke="none" />
    <path d="M8 15 A 5.5 5.5 0 0 1 16 15" />
    <path d="M5 12 A 9.5 9.5 0 0 1 19 12" />
    <path d="M2 9 A 13.5 13.5 0 0 1 22 9" />
  </>
));
