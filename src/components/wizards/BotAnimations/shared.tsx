/* eslint-disable react-refresh/only-export-components */
import React from 'react';

/* Shared utilities and primitives for the bot wizard animations.
   Each bot animation (DCA / Grid / Combo) lives in its own file and pulls
   from here so the three can be edited in parallel without conflicts.

   All three animations use the same 320×180 viewBox so they line up in the
   wizard. SMIL `<animate>` elements drive SVG attribute animation — they
   work natively on attributes like y1/y2/r/opacity without the
   `transform-box: fill-box` quirks CSS transforms on SVG nodes have. */

export type Props = {
  className?: string;
  title?: string;
};

export const PRIMARY = 'var(--color-primary, oklch(0.705 0.187 47.6))';
export const SUCCESS = 'var(--color-success, oklch(0.627 0.17 149.21))';
export const DESTRUCTIVE = 'var(--color-destructive, oklch(0.48 0.1976 29.23))';

/** Animation cycle config used by the shared PendingLine / FillDot components. */
export type AnimCycle = { cycle: string; fadeOut: number; reset: number };

/** Build a fill-dot radius timeline: stays 0, pops to peak at `t`,
    settles to `settled`, holds until fadeOut, shrinks to 0, stays. */
export const dotPopValues = (
  t: number,
  peak: number,
  settled: number,
  c: AnimCycle
) => ({
  values: `0; 0; ${peak}; ${settled}; ${settled}; 0; 0`,
  keyTimes: `0; ${t}; ${t + 0.025}; ${t + 0.05}; ${c.fadeOut}; ${c.reset}; 1`,
});

/** Build a single opacity timeline that handles show, hide, and reappear cases.
    Two separate <animate> elements on the same attribute don't both apply —
    SMIL only honors one, which would cause buy/sell lines to superimpose. */
export const lineOpacity = (
  showFrom: number | undefined,
  hideAt: number | undefined,
  reappearAt: number | undefined,
  c: AnimCycle
) => {
  if (showFrom !== undefined && hideAt !== undefined) {
    return { values: '0; 1; 0', keyTimes: `0; ${showFrom}; ${hideAt}` };
  }
  if (showFrom !== undefined) {
    return { values: '0; 1; 0', keyTimes: `0; ${showFrom}; ${c.fadeOut}` };
  }
  if (hideAt !== undefined && reappearAt !== undefined) {
    return { values: '1; 0; 1', keyTimes: `0; ${hideAt}; ${reappearAt}` };
  }
  if (hideAt !== undefined) {
    return { values: '1; 0; 1', keyTimes: `0; ${hideAt}; ${c.reset}` };
  }
  return { values: '1; 0; 1', keyTimes: `0; ${c.fadeOut}; ${c.reset}` };
};

/** A standing limit-order line: dashed colored line with a small label.
    Driven by the cycle config and optional show/hide/reappear timings. */
export const PendingLine: React.FC<{
  y: number;
  color: string;
  label: string;
  showFrom?: number;
  hideAt?: number;
  reappearAt?: number;
  anim: AnimCycle;
}> = ({ y, color, label, showFrom, hideAt, reappearAt, anim }) => {
  const op = lineOpacity(showFrom, hideAt, reappearAt, anim);
  const initialOpacity = showFrom !== undefined ? 0 : 1;
  return (
    <g>
      <line
        x1="10"
        x2="310"
        y1={y}
        y2={y}
        stroke={color}
        strokeWidth="1.25"
        strokeDasharray="5 4"
        strokeOpacity="0.85"
        opacity={initialOpacity}
      >
        <animate
          attributeName="opacity"
          dur={anim.cycle}
          repeatCount="indefinite"
          calcMode="discrete"
          values={op.values}
          keyTimes={op.keyTimes}
        />
      </line>
      <text
        x="16"
        y={y - 3}
        fontSize="8"
        fontWeight="700"
        fill={color}
        fillOpacity="0.9"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        opacity={initialOpacity}
      >
        {label}
        <animate
          attributeName="opacity"
          dur={anim.cycle}
          repeatCount="indefinite"
          calcMode="discrete"
          values={op.values}
          keyTimes={op.keyTimes}
        />
      </text>
    </g>
  );
};

/** Smooth-fade variant of PendingLine — used when an order needs to fade IN
    instantly but fade OUT gradually (e.g. Combo's minigrid lines that
    participate in the closing transition). */
export const SmoothPendingLine: React.FC<{
  y: number;
  color: string;
  label: string;
  showFrom: number;
  hideAt: number;
  hideEnd: number;
  cycle: string;
}> = ({ y, color, label, showFrom, hideAt, hideEnd, cycle }) => {
  const values = '0; 0; 1; 1; 0; 0';
  const keyTimes = `0; ${Math.max(0, showFrom - 0.005)}; ${showFrom}; ${hideAt}; ${hideEnd}; 1`;
  return (
    <g>
      <line
        x1="10"
        x2="310"
        y1={y}
        y2={y}
        stroke={color}
        strokeWidth="1.25"
        strokeDasharray="5 4"
        strokeOpacity="0.85"
        opacity={0}
      >
        <animate
          attributeName="opacity"
          dur={cycle}
          repeatCount="indefinite"
          values={values}
          keyTimes={keyTimes}
        />
      </line>
      <text
        x="16"
        y={y - 3}
        fontSize="8"
        fontWeight="700"
        fill={color}
        fillOpacity="0.9"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        opacity={0}
      >
        {label}
        <animate
          attributeName="opacity"
          dur={cycle}
          repeatCount="indefinite"
          values={values}
          keyTimes={keyTimes}
        />
      </text>
    </g>
  );
};

/** An order-fill marker: solid colored dot with halo, optional $ glyph. */
export const FillDot: React.FC<{
  x: number;
  y: number;
  color: string;
  t: number;
  showDollar?: boolean;
  anim: AnimCycle;
}> = ({ x, y, color, t, showDollar, anim }) => {
  const halo = dotPopValues(t, showDollar ? 18 : 13, showDollar ? 13 : 9, anim);
  const solid = dotPopValues(t, showDollar ? 12 : 7, showDollar ? 9 : 5, anim);
  return (
    <g>
      <circle cx={x} cy={y} r="0" fill={color} fillOpacity="0.3">
        <animate
          attributeName="r"
          dur={anim.cycle}
          repeatCount="indefinite"
          values={halo.values}
          keyTimes={halo.keyTimes}
        />
      </circle>
      <circle cx={x} cy={y} r="0" fill={color}>
        <animate
          attributeName="r"
          dur={anim.cycle}
          repeatCount="indefinite"
          values={solid.values}
          keyTimes={solid.keyTimes}
        />
      </circle>
      {showDollar && (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          fontWeight="800"
          fill="white"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          opacity="0"
        >
          $
          <animate
            attributeName="opacity"
            dur={anim.cycle}
            repeatCount="indefinite"
            calcMode="discrete"
            values="0; 1; 0"
            keyTimes={`0; ${t + 0.03}; ${anim.fadeOut}`}
          />
        </text>
      )}
    </g>
  );
};
