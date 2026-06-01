import React from 'react';
import {
  DESTRUCTIVE,
  FillDot,
  PRIMARY,
  PendingLine,
  SUCCESS,
  SmoothPendingLine,
  type AnimCycle,
  type Props,
} from './shared';

/* COMBO — "minigrid" bot. Each DCA fill activates a TP minigrid above it.
   When each minigrid SELL fills, a NEW BUY is placed ONE GRID LEVEL BELOW
   (real grid-bot behavior — filled orders are not replaced at the same price).
   When the minigrid completes, the BUYs fade out and the DCA restores smoothly.
   The 3 ORIGINAL SELLs at top are decorative context (not filled in this cycle).

   Layout (top → bottom, 20-unit grid):
     y=15, 35, 55  : 3 ORIG SELLs (top of chart)
     y=75, 95, 115 : 3 NEW SELLs (minigrid, appears after DCA fills)
     y=90          : START dot (middle of chart, hidden once price moves)
     y=95, 115, 135: NEW BUYs (each one grid level below the SELL that fired)
     y=170         : DCA (bottom)

   Cycle (12s):
     0.00       : initial (3 ORIG SELLs at top, START in middle, DCA bottom)
     0.04–0.16  : price descends from START down to DCA (substantial descent)
     0.16–0.22  : PAUSE — DCA fills (green dot), 3 NEW SELLs appear above
     0.22–0.27  : bottom dip, start ascent
     0.27–0.34  : ascend to NEW SELL @ y=115
     0.34–0.39  : PAUSE — fill (red+$), BUY @ y=135 appears (one level below)
     0.39–0.46  : ascend to NEW SELL @ y=95
     0.46–0.51  : PAUSE — fill, BUY @ y=115 appears
     0.51–0.58  : ascend to NEW SELL @ y=75
     0.58–0.64  : PAUSE — fill, BUY @ y=95 appears (minigrid complete!)
     0.66–0.74  : DCA fades back in (price line stays visible through this)
     0.66–0.74  : NEW BUYs fade out (cycle's queued-buys clear)
     0.85–0.92  : price line + fill dots fade out (separate from DCA fade-in)
     0.92–1.00  : full reset                                                   */

const COMBO_CYCLE = '12s';
// PERSIST is for the ORIG SELLs and the (restored) DCA — they stick around.
const COMBO_PERSIST: AnimCycle = {
  cycle: COMBO_CYCLE,
  fadeOut: 0.92,
  reset: 0.96,
};
// PRICE_FADE controls the price line and the fill dots — fades AFTER DCA restores,
// not during, so the journey stays visible while DCA re-appears.
const COMBO_PRICE_FADE: AnimCycle = {
  cycle: COMBO_CYCLE,
  fadeOut: 0.85,
  reset: 0.92,
};

const COMBO_ORIG_SELL_Y = [15, 35, 55] as const;

const COMBO_DCA = { y: 170, x: 75, fillT: 0.16 };
const COMBO_START_Y = 90; // middle of viewBox

const COMBO_NEW_SELLS = [
  { y: 115, x: 140, fillT: 0.34, appearT: 0.2 },
  { y: 95, x: 170, fillT: 0.46, appearT: 0.2 },
  { y: 75, x: 200, fillT: 0.58, appearT: 0.2 },
];

// NEW BUYs appear ONE GRID LEVEL BELOW the SELL that filled
const COMBO_NEW_BUYS = [
  { y: 135, showFrom: 0.36 },
  { y: 115, showFrom: 0.48 },
  { y: 95, showFrom: 0.6 },
];

const COMBO_MINIGRID_DONE = 0.66; // moment minigrid completes — BUYs start fading, DCA starts restoring
const COMBO_RESTORE_DONE = 0.74; // moment DCA fully restored

/** DCA line for Combo — custom smooth-fade animation:
    visible from start → fast hide on fill → smooth fade-in on restore. */
const ComboDcaLine: React.FC = () => {
  const values = '1; 1; 0; 0; 1; 1';
  const keyTimes = `0; ${COMBO_DCA.fillT - 0.005}; ${COMBO_DCA.fillT}; ${COMBO_MINIGRID_DONE}; ${COMBO_RESTORE_DONE}; 1`;
  return (
    <g>
      <line
        x1="10"
        x2="310"
        y1={COMBO_DCA.y}
        y2={COMBO_DCA.y}
        stroke={SUCCESS}
        strokeWidth="1.25"
        strokeDasharray="5 4"
        strokeOpacity="0.85"
      >
        <animate
          attributeName="opacity"
          dur={COMBO_CYCLE}
          repeatCount="indefinite"
          values={values}
          keyTimes={keyTimes}
        />
      </line>
      <text
        x="16"
        y={COMBO_DCA.y - 3}
        fontSize="8"
        fontWeight="700"
        fill={SUCCESS}
        fillOpacity="0.9"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        DCA
        <animate
          attributeName="opacity"
          dur={COMBO_CYCLE}
          repeatCount="indefinite"
          values={values}
          keyTimes={keyTimes}
        />
      </text>
    </g>
  );
};

export const ComboBotAnim: React.FC<Props> = ({
  className,
  title = 'Combo bot',
}) => (
  <svg
    viewBox="0 0 320 180"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title}
  >
    {/* 3 ORIGINAL SELLs at top — decorative context (never filled in this cycle) */}
    {COMBO_ORIG_SELL_Y.map((y, i) => (
      <PendingLine
        key={`o-sell-${i}`}
        y={y}
        color={DESTRUCTIVE}
        label="SELL"
        anim={COMBO_PERSIST}
      />
    ))}

    {/* DCA — custom smooth fade-in on restore */}
    <ComboDcaLine />

    {/* Initial price marker (orange) — hidden once price starts moving */}
    <circle cx="14" cy={COMBO_START_Y} r="3.5" fill={PRIMARY}>
      <animate
        attributeName="opacity"
        dur={COMBO_CYCLE}
        repeatCount="indefinite"
        calcMode="discrete"
        values="1; 0; 1"
        keyTimes={`0; 0.06; ${COMBO_PERSIST.reset}`}
      />
    </circle>

    {/* NEW SELLs — appear after DCA fills, between DCA and ORIG SELLs */}
    {COMBO_NEW_SELLS.map((s, i) => (
      <SmoothPendingLine
        key={`n-sell-${i}`}
        y={s.y}
        color={DESTRUCTIVE}
        label="SELL"
        showFrom={s.appearT}
        hideAt={s.fillT}
        hideEnd={s.fillT + 0.005}
        cycle={COMBO_CYCLE}
      />
    ))}

    {/* NEW BUYs — appear ONE GRID LEVEL BELOW the SELL that just filled.
        All fade out together during minigrid-complete transition. */}
    {COMBO_NEW_BUYS.map((b, i) => (
      <SmoothPendingLine
        key={`n-buy-${i}`}
        y={b.y}
        color={SUCCESS}
        label="BUY"
        showFrom={b.showFrom}
        hideAt={COMBO_MINIGRID_DONE}
        hideEnd={COMBO_RESTORE_DONE}
        cycle={COMBO_CYCLE}
      />
    ))}

    {/* Price line: descend from middle (y=90) → DCA (y=170) → bottom dip → ascend
        through 3 minigrid SELLs. Explicit cubic curves (no S commands) so the
        reflected control points don't bulge the path out of the 0-180 viewBox. */}
    <path
      d={`M 14 ${COMBO_START_Y}
          C 35 100, 60 165, 75 ${COMBO_DCA.y}
          C 90 174, 100 175, 115 173
          C 125 170, 130 130, 140 ${COMBO_NEW_SELLS[0].y}
          C 150 100, 160 100, 170 ${COMBO_NEW_SELLS[1].y}
          C 185 85, 195 78, 200 ${COMBO_NEW_SELLS[2].y}`}
      stroke={PRIMARY}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="279"
      strokeDashoffset="279"
    >
      {/* Offsets measured via path.getPointAtLength so price stops AT each level:
            start=279, DCA=178, BOTTOM=138, NEW@115=75, NEW@95=37, NEW@75=0 */}
      <animate
        attributeName="stroke-dashoffset"
        dur={COMBO_CYCLE}
        repeatCount="indefinite"
        values="279; 279; 178; 178; 138; 75; 75; 37; 37; 0; 0; 0; 0"
        keyTimes="0; 0.04; 0.16; 0.22; 0.27; 0.34; 0.39; 0.46; 0.51; 0.58; 0.64; 0.85; 1"
      />
      {/* Price line stays visible through DCA restore (0.66-0.74). Fades only
          later (0.85-0.92), so the user sees the full price journey while
          DCA fades back in. */}
      <animate
        attributeName="opacity"
        dur={COMBO_CYCLE}
        repeatCount="indefinite"
        values="0; 0; 1; 1; 0; 0"
        keyTimes="0; 0.035; 0.04; 0.85; 0.92; 1"
      />
    </path>

    {/* Green DCA fill dot — fades with the price line, not with the DCA restore. */}
    <FillDot
      x={COMBO_DCA.x}
      y={COMBO_DCA.y}
      color={SUCCESS}
      t={COMBO_DCA.fillT}
      anim={COMBO_PRICE_FADE}
    />

    {/* Red SELL fill dots with $ at each minigrid SELL hit on ascent */}
    {COMBO_NEW_SELLS.map((s, i) => (
      <FillDot
        key={`sell-dot-${i}`}
        x={s.x}
        y={s.y}
        color={DESTRUCTIVE}
        t={s.fillT}
        showDollar
        anim={COMBO_PRICE_FADE}
      />
    ))}
  </svg>
);
