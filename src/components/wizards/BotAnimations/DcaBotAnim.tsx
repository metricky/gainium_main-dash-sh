import React from 'react';
import {
  DESTRUCTIVE,
  PRIMARY,
  SUCCESS,
  dotPopValues,
  type AnimCycle,
  type Props,
} from './shared';

/* DCA — 3 standing orders + AVG line + TP line all visible from start.
   Price descends, PAUSES 0.5s at each fill so AVG & TP step down and a
   green dot pops (each bigger than the last). Recovery hits TP → red dot + $.

   Cycle (10s, fractions of cycle):
     0.00       : initial state (TP red top, AVG at entry, 3 standing DCA orders, entry dot)
     0.05–0.18  : price descends from entry to DCA 1
     0.18–0.23  : PAUSE — DCA 1 fills: line off, green dot pops (r5), AVG↓, TP↓
     0.23–0.33  : price descends to DCA 2
     0.33–0.38  : PAUSE — DCA 2 fills, dot (r7), AVG↓, TP↓
     0.38–0.48  : price descends to DCA 3
     0.48–0.53  : PAUSE — DCA 3 fills, dot (r9), AVG↓, TP↓
     0.53–0.60  : price dips to bottom
     0.60–0.70  : price recovers up to (now lowered) TP
     0.70–0.75  : PAUSE — TP hits: line off, red dot + $ flash
     0.75–0.93  : hold settled state
     0.93–1.00  : fade out, reset                                              */

const DCA_CYCLE = '10s';
const DCA_FADE_OUT = 0.93;
const DCA_RESET = 0.96;
const DCA_ANIM: AnimCycle = {
  cycle: DCA_CYCLE,
  fadeOut: DCA_FADE_OUT,
  reset: DCA_RESET,
};

const ENTRY_X = 14;
const ENTRY_Y = 35;
const TP_X = 310;

const DCA_X = [78, 132, 184] as const;
const DCA_Y = [70, 100, 135] as const;
const DCA_R = [5, 7, 9] as const;
const DCA_T = [0.18, 0.33, 0.48] as const;

const TP_Y_STEPS = [20, 38, 56, 74] as const;
const AVG_Y_STEPS = [ENTRY_Y, 52, 70, 88] as const;
const STEP_KEYTIMES = `0; ${DCA_T[0]}; ${DCA_T[1]}; ${DCA_T[2]}; 0.96`;

const TP_FILL_T = 0.7;

const consumeAt = (hideT: number) => ({
  values: '1; 0; 1',
  keyTimes: `0; ${hideT}; ${DCA_RESET}`,
});

export const DcaBotAnim: React.FC<Props> = ({
  className,
  title = 'DCA bot',
}) => (
  <svg
    viewBox="0 0 320 180"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title}
  >
    {/* faint horizontal grid */}
    <g
      stroke="currentColor"
      strokeOpacity="0.10"
      strokeWidth="1"
      strokeDasharray="2 4"
    >
      <line x1="10" y1="30" x2="310" y2="30" />
      <line x1="10" y1="80" x2="310" y2="80" />
      <line x1="10" y1="130" x2="310" y2="130" />
    </g>

    {/* TP line (red dashed) — steps down with each DCA fill, disappears when hit */}
    <g>
      <line
        x1="10"
        x2="310"
        y1={TP_Y_STEPS[0]}
        y2={TP_Y_STEPS[0]}
        stroke={DESTRUCTIVE}
        strokeWidth="1.5"
        strokeDasharray="6 4"
        strokeOpacity="0.9"
      >
        <animate
          attributeName="y1"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          calcMode="discrete"
          values={TP_Y_STEPS.join('; ') + `; ${TP_Y_STEPS[0]}`}
          keyTimes={STEP_KEYTIMES}
        />
        <animate
          attributeName="y2"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          calcMode="discrete"
          values={TP_Y_STEPS.join('; ') + `; ${TP_Y_STEPS[0]}`}
          keyTimes={STEP_KEYTIMES}
        />
        <animate
          attributeName="opacity"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          calcMode="discrete"
          values={consumeAt(TP_FILL_T).values}
          keyTimes={consumeAt(TP_FILL_T).keyTimes}
        />
      </line>
      <text
        fontSize="10"
        fontWeight="700"
        fill={DESTRUCTIVE}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        x="16"
        y={TP_Y_STEPS[0] - 4}
      >
        TP
        <animate
          attributeName="y"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          calcMode="discrete"
          values={
            TP_Y_STEPS.map((y) => y - 4).join('; ') + `; ${TP_Y_STEPS[0] - 4}`
          }
          keyTimes={STEP_KEYTIMES}
        />
        <animate
          attributeName="opacity"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          calcMode="discrete"
          values={consumeAt(TP_FILL_T).values}
          keyTimes={consumeAt(TP_FILL_T).keyTimes}
        />
      </text>
    </g>

    {/* AVG line (orange dashed) — steps down with each fill, persists past TP */}
    <g>
      <line
        x1="10"
        x2="310"
        y1={AVG_Y_STEPS[0]}
        y2={AVG_Y_STEPS[0]}
        stroke={PRIMARY}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        strokeOpacity="0.75"
      >
        <animate
          attributeName="y1"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          calcMode="discrete"
          values={AVG_Y_STEPS.join('; ') + `; ${AVG_Y_STEPS[0]}`}
          keyTimes={STEP_KEYTIMES}
        />
        <animate
          attributeName="y2"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          calcMode="discrete"
          values={AVG_Y_STEPS.join('; ') + `; ${AVG_Y_STEPS[0]}`}
          keyTimes={STEP_KEYTIMES}
        />
      </line>
      <text
        fontSize="9"
        fontWeight="600"
        fill={PRIMARY}
        fillOpacity="0.85"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        x="16"
        y={AVG_Y_STEPS[0] - 3}
      >
        AVG
        <animate
          attributeName="y"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          calcMode="discrete"
          values={
            AVG_Y_STEPS.map((y) => y - 3).join('; ') + `; ${AVG_Y_STEPS[0] - 3}`
          }
          keyTimes={STEP_KEYTIMES}
        />
      </text>
    </g>

    {/* 3 standing DCA order lines (green dashed) — disappear when filled */}
    {DCA_Y.map((y, i) => {
      const consume = consumeAt(DCA_T[i]);
      return (
        <g key={`order-${i}`}>
          <line
            x1="10"
            x2="310"
            y1={y}
            y2={y}
            stroke={SUCCESS}
            strokeWidth="1.25"
            strokeDasharray="5 4"
            strokeOpacity="0.85"
          >
            <animate
              attributeName="opacity"
              dur={DCA_CYCLE}
              repeatCount="indefinite"
              calcMode="discrete"
              values={consume.values}
              keyTimes={consume.keyTimes}
            />
          </line>
          <text
            x="16"
            y={y - 3}
            fontSize="8"
            fontWeight="600"
            fill={SUCCESS}
            fillOpacity="0.9"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            DCA {i + 1}
            <animate
              attributeName="opacity"
              dur={DCA_CYCLE}
              repeatCount="indefinite"
              calcMode="discrete"
              values={consume.values}
              keyTimes={consume.keyTimes}
            />
          </text>
        </g>
      );
    })}

    {/* Initial entry marker — visible from start */}
    <circle cx={ENTRY_X} cy={ENTRY_Y} r="3.5" fill={SUCCESS}>
      <animate
        attributeName="opacity"
        dur={DCA_CYCLE}
        repeatCount="indefinite"
        calcMode="discrete"
        values="1; 0; 1"
        keyTimes={`0; ${DCA_FADE_OUT}; ${DCA_RESET}`}
      />
    </circle>

    {/* Price line: descends from entry, PAUSES at each fill, dips, recovers to TP.
        Offsets measured via path.getPointAtLength so price stops AT each level. */}
    <path
      d={`M ${ENTRY_X} ${ENTRY_Y}
          Q 45 50 ${DCA_X[0]} ${DCA_Y[0]}
          Q ${(DCA_X[0] + DCA_X[1]) / 2} 88 ${DCA_X[1]} ${DCA_Y[1]}
          Q ${(DCA_X[1] + DCA_X[2]) / 2} 122 ${DCA_X[2]} ${DCA_Y[2]}
          Q 200 148 215 152
          Q 260 130 ${TP_X} ${TP_Y_STEPS[3]}`}
      stroke={PRIMARY}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="357"
      strokeDashoffset="357"
    >
      <animate
        attributeName="stroke-dashoffset"
        dur={DCA_CYCLE}
        repeatCount="indefinite"
        values="357; 357; 285; 285; 222; 222; 160; 160; 124; 0; 0; 0; 0"
        keyTimes="0; 0.05; 0.18; 0.23; 0.33; 0.38; 0.48; 0.53; 0.60; 0.70; 0.75; 0.93; 1"
      />
      <animate
        attributeName="opacity"
        dur={DCA_CYCLE}
        repeatCount="indefinite"
        values="0; 1; 1; 0; 0"
        keyTimes={`0; 0.05; ${DCA_FADE_OUT}; ${DCA_RESET}; 1`}
      />
    </path>

    {/* Green fill dots — pop at each DCA fill, each bigger than the last */}
    {DCA_Y.map((y, i) => {
      const cx = DCA_X[i];
      const t = DCA_T[i];
      const r = DCA_R[i];
      const halo = dotPopValues(t, r * 2.4, r * 1.8, DCA_ANIM);
      const solid = dotPopValues(t, r * 1.4, r, DCA_ANIM);
      return (
        <g key={`fill-${i}`}>
          <circle cx={cx} cy={y} r="0" fill={SUCCESS} fillOpacity="0.3">
            <animate
              attributeName="r"
              dur={DCA_CYCLE}
              repeatCount="indefinite"
              values={halo.values}
              keyTimes={halo.keyTimes}
            />
          </circle>
          <circle cx={cx} cy={y} r="0" fill={SUCCESS}>
            <animate
              attributeName="r"
              dur={DCA_CYCLE}
              repeatCount="indefinite"
              values={solid.values}
              keyTimes={solid.keyTimes}
            />
          </circle>
        </g>
      );
    })}

    {/* Red TP fill dot + $ — pops when price reaches TP */}
    <g>
      <circle
        cx={TP_X - 4}
        cy={TP_Y_STEPS[3]}
        r="0"
        fill={DESTRUCTIVE}
        fillOpacity="0.3"
      >
        <animate
          attributeName="r"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          values="0; 0; 22; 16; 16; 0; 0"
          keyTimes={`0; ${TP_FILL_T}; ${TP_FILL_T + 0.025}; ${TP_FILL_T + 0.05}; ${DCA_FADE_OUT}; ${DCA_RESET}; 1`}
        />
      </circle>
      <circle cx={TP_X - 4} cy={TP_Y_STEPS[3]} r="0" fill={DESTRUCTIVE}>
        <animate
          attributeName="r"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          values="0; 0; 14; 11; 11; 0; 0"
          keyTimes={`0; ${TP_FILL_T}; ${TP_FILL_T + 0.025}; ${TP_FILL_T + 0.05}; ${DCA_FADE_OUT}; ${DCA_RESET}; 1`}
        />
      </circle>
      <text
        x={TP_X - 4}
        y={TP_Y_STEPS[3]}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="800"
        fill="white"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        opacity="0"
      >
        $
        <animate
          attributeName="opacity"
          dur={DCA_CYCLE}
          repeatCount="indefinite"
          calcMode="discrete"
          values="0; 1; 0"
          keyTimes={`0; ${TP_FILL_T + 0.04}; ${DCA_FADE_OUT}`}
        />
      </text>
    </g>
  </svg>
);
