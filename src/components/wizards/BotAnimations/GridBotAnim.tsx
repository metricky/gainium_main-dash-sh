import React from 'react';
import {
  DESTRUCTIVE,
  FillDot,
  PRIMARY,
  PendingLine,
  SUCCESS,
  type AnimCycle,
  type Props,
} from './shared';

/* GRID — standing BUY/SELL orders with grid-cycling behavior:
   when a BUY fills, a new SELL is placed ABOVE; when a SELL fills, a
   new BUY is placed BELOW (real grid-bot behavior — filled orders are
   not replaced at the same price).

   Cycle (12s, fractions of cycle):
     0.00       : initial (2 SELLs above, START dot, 2 BUYs below)
     0.05–0.16  : descend START → BUY 1
     0.16–0.21  : PAUSE — BUY 1 fills (green dot) + NEW SELL @ y=90 appears
     0.21–0.30  : descend BUY 1 → BUY 2
     0.30–0.35  : PAUSE — BUY 2 fills + NEW SELL @ y=120 appears
     0.35–0.42  : bottom dip
     0.42–0.46  : ascend → SELL @ y=120 (NEW)
     0.46–0.50  : PAUSE — fills (red+$) + NEW BUY @ y=150 appears
     0.50–0.54  : ascend → SELL @ y=90 (NEW)
     0.54–0.58  : PAUSE — fills + NEW BUY appears below price
     0.58–0.64  : ascend → SELL @ y=60 (ORIG)
     0.64–0.68  : PAUSE — fills + NEW BUY appears
     0.68–0.78  : ascend → SELL @ y=30 (ORIG)
     0.78–0.82  : PAUSE — fills + NEW BUY appears
     0.82–0.88  : settled state
     0.88–0.96  : fade out, reset                                              */

const GRID_CYCLE = '12s';
const GRID_FADE_OUT = 0.92;
const GRID_RESET = 0.96;
const GRID_ANIM: AnimCycle = {
  cycle: GRID_CYCLE,
  fadeOut: GRID_FADE_OUT,
  reset: GRID_RESET,
};

const GRID_START_X = 15;

// 5 evenly-spaced grid levels, 30 units apart (top → bottom).
const Y_SELL_30 = 30; // original SELL — visible from start
const Y_SELL_60 = 60; // original SELL — visible from start
const Y_SELL_90 = 90; // NEW SELL — appears after BUY 1 fills
const Y_START = 90; // initial price position (same y as Y_SELL_90, but disjoint in time)
const Y_BUY_1 = 120;
const Y_BUY_2 = 150;

const ORIG_BUY = [
  { y: Y_BUY_1, x: 75, fillT: 0.16 },
  { y: Y_BUY_2, x: 130, fillT: 0.3 },
];

const SELL_FILLS = [
  { y: Y_BUY_1, x: 199, fillT: 0.46, appearT: 0.32 }, // NEW — appears after BUY 2 fills
  { y: Y_SELL_90, x: 220, fillT: 0.54, appearT: 0.18 }, // NEW — appears after BUY 1 fills
  { y: Y_SELL_60, x: 250, fillT: 0.64 }, // ORIG — visible from start
  { y: Y_SELL_30, x: 290, fillT: 0.78 }, // ORIG — visible from start
];

const NEW_BUYS = [
  { y: Y_BUY_2, appearT: 0.48 },
  { y: Y_BUY_1, appearT: 0.56 },
  { y: Y_SELL_90, appearT: 0.66 },
  { y: Y_SELL_60, appearT: 0.8 },
];

export const GridBotAnim: React.FC<Props> = ({
  className,
  title = 'Grid bot',
}) => (
  <svg
    viewBox="0 0 320 180"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title}
  >
    {/* Original BUYs — visible from start, consumed when price hits */}
    {ORIG_BUY.map((b, i) => (
      <PendingLine
        key={`o-buy-${i}`}
        y={b.y}
        color={SUCCESS}
        label="BUY"
        hideAt={b.fillT}
        anim={GRID_ANIM}
      />
    ))}

    {/* Initial price marker (orange) — hidden as soon as price starts moving */}
    <circle cx={GRID_START_X} cy={Y_START} r="3.5" fill={PRIMARY}>
      <animate
        attributeName="opacity"
        dur={GRID_CYCLE}
        repeatCount="indefinite"
        calcMode="discrete"
        values="1; 0; 1"
        keyTimes={`0; 0.06; ${GRID_RESET}`}
      />
    </circle>

    {/* SELL ladder — always above price.
        Two ORIG SELLs visible from start; the lowest (y=90) appears after BUY 1 fills. */}
    {SELL_FILLS.map((s, i) => (
      <PendingLine
        key={`sell-${i}`}
        y={s.y}
        color={DESTRUCTIVE}
        label="SELL"
        showFrom={s.appearT}
        hideAt={s.fillT}
        anim={GRID_ANIM}
      />
    ))}

    {/* NEW BUYs — appear below price after each SELL fills */}
    {NEW_BUYS.map((b, i) => (
      <PendingLine
        key={`n-buy-${i}`}
        y={b.y}
        color={SUCCESS}
        label="BUY"
        showFrom={b.appearT}
        anim={GRID_ANIM}
      />
    ))}

    {/* Price line: smooth descent through 2 BUYs → bottom dip → ascent touching 3 SELLs. */}
    <path
      d={`M ${GRID_START_X} ${Y_START}
          C 35 100, 55 112, 75 ${Y_BUY_1}
          S 115 144, 130 ${Y_BUY_2}
          S 156 158, 165 156
          S 215 100, 220 ${Y_SELL_90}
          S 240 70, 250 ${Y_SELL_60}
          S 280 40, 290 ${Y_SELL_30}
          L 310 24`}
      stroke={PRIMARY}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="366"
      strokeDashoffset="366"
    >
      {/* Offsets measured via path.getPointAtLength so price stops AT each level:
            start=366, BUY1=300, BUY2=237, BOTTOM=201,
            SELL@120=150, SELL@90=116, SELL@60=72, SELL@30=22, END=0 */}
      <animate
        attributeName="stroke-dashoffset"
        dur={GRID_CYCLE}
        repeatCount="indefinite"
        values="366; 366; 300; 300; 237; 237; 201; 150; 150; 116; 116; 72; 72; 22; 22; 0; 0"
        keyTimes="0; 0.05; 0.16; 0.21; 0.30; 0.35; 0.42; 0.46; 0.50; 0.54; 0.58; 0.64; 0.68; 0.78; 0.82; 0.88; 1"
      />
      <animate
        attributeName="opacity"
        dur={GRID_CYCLE}
        repeatCount="indefinite"
        values="0; 1; 1; 0; 0"
        keyTimes={`0; 0.05; ${GRID_FADE_OUT}; ${GRID_RESET}; 1`}
      />
    </path>

    {/* Green BUY fill dots */}
    {ORIG_BUY.map((b, i) => (
      <FillDot
        key={`buy-dot-${i}`}
        x={b.x}
        y={b.y}
        color={SUCCESS}
        t={b.fillT}
        anim={GRID_ANIM}
      />
    ))}

    {/* Red SELL fill dots with $ at each SELL the price hits on the way up */}
    {SELL_FILLS.map((s, i) => (
      <FillDot
        key={`sell-dot-${i}`}
        x={s.x}
        y={s.y}
        color={DESTRUCTIVE}
        t={s.fillT}
        showDollar
        anim={GRID_ANIM}
      />
    ))}
  </svg>
);
