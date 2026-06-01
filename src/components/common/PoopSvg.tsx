import type { FC } from 'react';

// viewBox canvas: x -10 → 82 (w=92), y -20 → 96 (h=116)
// overflow:visible handles animated elements that stray outside
const VB_W = 92;
const VB_H = 116;

const SVG_STYLE = `
  /* ── Smell lines ── */
  @keyframes smellRise1 {
    0%   { transform: translate(0,0) scaleX(1);          opacity: 0.6; }
    100% { transform: translate(-5px,-42px) scaleX(0.55); opacity: 0; }
  }
  @keyframes smellRise2 {
    0%   { transform: translate(0,0) scaleX(1);         opacity: 0.6; }
    100% { transform: translate(4px,-38px) scaleX(1.35); opacity: 0; }
  }
  @keyframes smellRise3 {
    0%   { transform: translate(0,0) scaleX(1);           opacity: 0.6; }
    100% { transform: translate(-3px,-40px) scaleX(0.72); opacity: 0; }
  }

  /* ── Flies ── */
  @keyframes fly1 {
    0%   { transform: translate(0,0) rotate(0deg); }
    25%  { transform: translate(13px,-11px) rotate(25deg); }
    50%  { transform: translate(-7px,-19px) rotate(-18deg); }
    75%  { transform: translate(11px,-7px) rotate(12deg); }
    100% { transform: translate(0,0) rotate(0deg); }
  }
  @keyframes fly2 {
    0%   { transform: translate(0,0) rotate(0deg); }
    25%  { transform: translate(-15px,-13px) rotate(-22deg); }
    50%  { transform: translate(9px,-21px) rotate(18deg); }
    75%  { transform: translate(-11px,-5px) rotate(-12deg); }
    100% { transform: translate(0,0) rotate(0deg); }
  }
  @keyframes fly3 {
    0%   { transform: translate(0,0) rotate(0deg); }
    33%  { transform: translate(19px,-17px) rotate(28deg); }
    66%  { transform: translate(-11px,-11px) rotate(-22deg); }
    100% { transform: translate(0,0) rotate(0deg); }
  }

  /* ── Body wobble ── */
  @keyframes bodyWobble {
    0%, 100% { transform: rotate(-1.5deg) translateX(-1px); }
    50%      { transform: rotate(1.5deg) translateX(1px); }
  }

  /* ── Eyes: blink (left) & wink (right) ── */
  @keyframes eyeBlink {
    0%, 87%, 100% { transform: scaleY(1); }
    91%, 95%      { transform: scaleY(0.05); }
  }
  @keyframes eyeWink {
    0%, 57% { transform: scaleY(1); }
    62%, 68% { transform: scaleY(0.05); }
    73%, 100% { transform: scaleY(1); }
  }

  /* ── Pupils: look left → centre → right → down-left → centre ── */
  @keyframes lookAround {
    0%, 8%    { transform: translate(0,0); }
    13%, 26%  { transform: translate(-2.5px,0.5px); }
    31%, 44%  { transform: translate(0,0); }
    49%, 62%  { transform: translate(2.5px,0.5px); }
    67%, 80%  { transform: translate(0,0); }
    83%, 91%  { transform: translate(-1.5px,1.8px); }
    96%, 100% { transform: translate(0,0); }
  }

  /* ── Mouth ── */
  @keyframes normalSmile {
    0%, 34%  { opacity: 1; }
    41%, 60% { opacity: 0; }
    67%, 100%{ opacity: 1; }
  }
  @keyframes bigSmile {
    0%, 34%  { opacity: 0; }
    41%, 60% { opacity: 1; }
    67%, 100%{ opacity: 0; }
  }
`;

export interface PoopSvgProps {
  /** Display width in px. Height is calculated to preserve aspect ratio. */
  size?: number;
}

const PoopSvg: FC<PoopSvgProps> = ({ size = 200 }) => {
  const h = Math.round(size * (VB_H / VB_W));

  return (
    <svg
      viewBox={`-10 -20 ${VB_W} ${VB_H}`}
      width={size}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="animated poop with flies"
      role="img"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <style>{SVG_STYLE}</style>

      {/* ── Smell wavy lines ── */}
      <path
        d="M22 24 Q17 17 22 10 Q27 3 22 -4"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.35"
        style={{
          animation: 'smellRise1 2.4s ease-in infinite',
          transformOrigin: '22px 24px',
        }}
      />
      <path
        d="M36 20 Q31 13 36 6 Q41 -1 36 -8"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.35"
        style={{
          animation: 'smellRise2 2.8s ease-in 0.35s infinite',
          transformOrigin: '36px 20px',
        }}
      />
      <path
        d="M50 24 Q45 17 50 10 Q55 3 50 -4"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.35"
        style={{
          animation: 'smellRise3 2.6s ease-in 0.85s infinite',
          transformOrigin: '50px 24px',
        }}
      />

      {/* ── Flies ── */}
      <g
        style={{
          animation: 'fly1 3s ease-in-out 0.2s infinite',
          transformOrigin: '14px 18px',
        }}
      >
        <ellipse
          cx="10"
          cy="16"
          rx="4.5"
          ry="2.5"
          fill="hsl(210 30% 72%)"
          opacity="0.8"
        />
        <ellipse
          cx="18"
          cy="16"
          rx="4.5"
          ry="2.5"
          fill="hsl(210 30% 72%)"
          opacity="0.8"
        />
        <circle cx="14" cy="18" r="2.8" fill="#111" />
      </g>
      <g
        style={{
          animation: 'fly2 3.4s ease-in-out 0.7s infinite',
          transformOrigin: '58px 14px',
        }}
      >
        <ellipse
          cx="54"
          cy="12"
          rx="4.5"
          ry="2.5"
          fill="hsl(210 30% 72%)"
          opacity="0.8"
        />
        <ellipse
          cx="62"
          cy="12"
          rx="4.5"
          ry="2.5"
          fill="hsl(210 30% 72%)"
          opacity="0.8"
        />
        <circle cx="58" cy="14" r="2.8" fill="#111" />
      </g>
      <g
        style={{
          animation: 'fly3 2.8s ease-in-out 1.3s infinite',
          transformOrigin: '8px 38px',
        }}
      >
        <ellipse
          cx="4"
          cy="36"
          rx="4.5"
          ry="2.5"
          fill="hsl(210 30% 72%)"
          opacity="0.8"
        />
        <ellipse
          cx="12"
          cy="36"
          rx="4.5"
          ry="2.5"
          fill="hsl(210 30% 72%)"
          opacity="0.8"
        />
        <circle cx="8" cy="38" r="2.8" fill="#111" />
      </g>

      {/* ── Poop body (wobbles as a unit) ── */}
      <g
        style={{
          animation: 'bodyWobble 3.2s ease-in-out infinite',
          transformOrigin: '36px 64px',
        }}
      >
        {/* Stacked tiers – bottom to top */}
        <ellipse cx="36" cy="84" rx="26" ry="9" fill="#4E2309" />
        <ellipse cx="36" cy="74" rx="21" ry="13" fill="#5C2B10" />
        <ellipse cx="36" cy="64" rx="16" ry="11" fill="#6B3418" />
        <ellipse cx="36" cy="55" rx="11" ry="9.5" fill="#7A4222" />
        <ellipse cx="36" cy="46" rx="7" ry="6.5" fill="#8B5030" />
        <ellipse cx="37" cy="40" rx="4.5" ry="4.5" fill="#975E3A" />
        <ellipse cx="37.5" cy="36.5" rx="3" ry="3" fill="#A06840" />

        {/* ── Left eye (blinks periodically) ── */}
        <g
          style={{
            animation: 'eyeBlink 4.5s ease-in-out 0.3s infinite',
            transformOrigin: '30px 62px',
          }}
        >
          <circle cx="30" cy="62" r="4.2" fill="white" />
          {/* left pupil – looks around */}
          <g
            style={{
              animation: 'lookAround 6s ease-in-out infinite',
              transformOrigin: '30px 62px',
            }}
          >
            <circle cx="31" cy="63" r="2.2" fill="#111" />
            <circle cx="31.9" cy="62.2" r="0.8" fill="white" />
          </g>
        </g>

        {/* ── Right eye (winks occasionally) ── */}
        <g
          style={{
            animation: 'eyeWink 9s ease-in-out 3s infinite',
            transformOrigin: '42px 62px',
          }}
        >
          <circle cx="42" cy="62" r="4.2" fill="white" />
          {/* right pupil – looks around */}
          <g
            style={{
              animation: 'lookAround 6s ease-in-out infinite',
              transformOrigin: '42px 62px',
            }}
          >
            <circle cx="43" cy="63" r="2.2" fill="#111" />
            <circle cx="43.9" cy="62.2" r="0.8" fill="white" />
          </g>
        </g>

        {/* Normal smile – fades out when big smile appears */}
        <path
          d="M27 69 Q36 75 45 69"
          stroke="#111"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          style={{ animation: 'normalSmile 6s ease-in-out 1s infinite' }}
        />
        {/* Big smile – cross-fades in during look-forward moments */}
        <path
          d="M24 68 Q36 80 48 68"
          stroke="#111"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          style={{
            animation: 'bigSmile 6s ease-in-out 1s infinite',
            opacity: 0,
          }}
        />

        {/* Rosy cheeks */}
        <ellipse
          cx="24"
          cy="68.5"
          rx="5.5"
          ry="3"
          fill="#c04030"
          opacity="0.28"
        />
        <ellipse
          cx="48"
          cy="68.5"
          rx="5.5"
          ry="3"
          fill="#c04030"
          opacity="0.28"
        />
      </g>
    </svg>
  );
};

export default PoopSvg;
