import React from 'react';

/**
 * Animated SVG icons for the Widget Browser
 * Uses CSS variables for theming support:
 * - Primary accent: var(--color-primary)
 * - Card background: var(--color-card)
 * - Muted elements: var(--color-muted)
 * - Muted foreground: var(--color-muted-foreground)
 */

interface WidgetIconProps {
  className?: string;
}

// CSS variable references for theming - using the same pattern as LogoIcon
const PRIMARY = 'var(--color-primary, #f97316)';
const CARD_BG = 'var(--color-card, #1a1a1a)';
const MUTED = 'var(--color-muted, #2a2a2a)';
const MUTED_FG = 'var(--color-muted-foreground, #64748b)';
const SURFACE = 'var(--color-inner-container, #2a2a2a)';

// Base styles for all icons
const iconBaseStyle = `
  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  @keyframes slideUp {
    0%, 100% { transform: translateY(2px); }
    50% { transform: translateY(-2px); }
  }
  @keyframes grow {
    0%, 100% { transform: scaleY(0.8); }
    50% { transform: scaleY(1); }
  }
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes blink {
    0%, 40%, 100% { opacity: 0.5; }
    20% { opacity: 1; }
  }
  @keyframes wave {
    0%, 100% { transform: translateY(0); }
    25% { transform: translateY(-3px); }
    75% { transform: translateY(3px); }
  }
  .animate-pulse-slow { animation: pulse 2s ease-in-out infinite; }
  .animate-slide { animation: slideUp 1.5s ease-in-out infinite; }
  .animate-grow { animation: grow 1.5s ease-in-out infinite; transform-origin: bottom; }
  .animate-rotate { animation: rotate 8s linear infinite; transform-origin: center; }
  .animate-blink { animation: blink 2s ease-in-out infinite; }
  .animate-wave-1 { animation: wave 1.5s ease-in-out infinite; animation-delay: 0s; }
  .animate-wave-2 { animation: wave 1.5s ease-in-out infinite; animation-delay: 0.2s; }
  .animate-wave-3 { animation: wave 1.5s ease-in-out infinite; animation-delay: 0.4s; }
`;

// Portfolio Value - Line chart with upward trend (BLUE)
export const PortfolioValueIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect x="12" y="60" width="56" height="2" rx="1" fill={MUTED} />
    <rect x="14" y="20" width="2" height="40" rx="1" fill={MUTED} />
    <path
      d="M18 52 L28 45 L38 48 L48 35 L58 28 L68 20"
      stroke="#3b82f6"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className="animate-pulse-slow"
    />
    <circle
      cx="68"
      cy="20"
      r="4"
      fill="#3b82f6"
      className="animate-pulse-slow"
    />
    <path
      d="M18 52 L28 45 L38 48 L48 35 L58 28 L68 20 L68 60 L18 60 Z"
      fill="url(#portfolioGradientBlue)"
      opacity="0.3"
    />
    <defs>
      <linearGradient id="portfolioGradientBlue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

// Profit - Bar chart with baseline, red below / green above (minimal animation)
export const ProfitIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    {/* Baseline */}
    <rect x="12" y="40" width="56" height="2" rx="1" fill={MUTED_FG} />
    {/* Green bars (above line) */}
    <rect x="16" y="26" width="8" height="14" rx="2" fill="#22c55e" />
    <rect x="28" y="30" width="8" height="10" rx="2" fill="#22c55e" />
    {/* Red bars (below line) */}
    <rect x="40" y="42" width="8" height="8" rx="2" fill="#ef4444" />
    {/* Green bar with slight animation at tip */}
    <rect x="52" y="22" width="8" height="18" rx="2" fill="#22c55e" />
    <rect
      x="52"
      y="20"
      width="8"
      height="4"
      rx="1"
      fill="#22c55e"
      className="animate-pulse-slow"
    />
    {/* Red bar */}
    <rect x="64" y="42" width="4" height="12" rx="1" fill="#ef4444" />
  </svg>
);

// Accumulated Profit - Stacked area chart (GREEN)
export const AccumulatedProfitIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <path
      d="M12 60 L12 55 L25 45 L38 50 L51 35 L64 30 L68 28 L68 60 Z"
      fill="#22c55e"
      opacity="0.4"
    />
    <path
      d="M12 60 L12 50 L25 42 L38 46 L51 32 L64 26 L68 24"
      stroke="#22c55e"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      className="animate-pulse-slow"
    />
    <circle
      cx="64"
      cy="26"
      r="3"
      fill="#22c55e"
      className="animate-pulse-slow"
    />
  </svg>
);

// Bot Status - Status indicators (green/red circles)
export const BotStatusIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    {/* Status grid */}
    <rect x="14" y="16" width="24" height="24" rx="4" fill={SURFACE} />
    <circle
      cx="26"
      cy="28"
      r="8"
      fill="#22c55e"
      className="animate-pulse-slow"
    />

    <rect x="42" y="16" width="24" height="24" rx="4" fill={SURFACE} />
    <circle cx="54" cy="28" r="8" fill="#22c55e" />

    <rect x="14" y="44" width="24" height="24" rx="4" fill={SURFACE} />
    <circle cx="26" cy="56" r="8" fill="#ef4444" />

    <rect x="42" y="44" width="24" height="24" rx="4" fill={SURFACE} />
    <circle cx="54" cy="56" r="8" fill="#22c55e" />

    {/* Status indicators - small dots */}
    <circle cx="34" cy="20" r="2" fill="#22c55e" />
    <circle cx="62" cy="20" r="2" fill="#22c55e" />
    <circle cx="34" cy="48" r="2" fill="#ef4444" />
    <circle cx="62" cy="48" r="2" fill="#22c55e" />
  </svg>
);

// Bot Stats Advanced - Dashboard with metrics
export const BotStatsAdvancedIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect
      x="12"
      y="16"
      width="24"
      height="20"
      rx="3"
      stroke={PRIMARY}
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="44"
      y="16"
      width="24"
      height="20"
      rx="3"
      stroke="#3a3a3a"
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="12"
      y="44"
      width="24"
      height="20"
      rx="3"
      stroke="#3a3a3a"
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="44"
      y="44"
      width="24"
      height="20"
      rx="3"
      stroke={PRIMARY}
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M16 30 L20 24 L24 28 L28 20 L32 26"
      stroke={PRIMARY}
      strokeWidth="2"
      strokeLinecap="round"
      className="animate-pulse-slow"
    />
    <rect x="48" y="22" width="16" height="3" rx="1" fill={MUTED_FG} />
    <rect x="48" y="28" width="10" height="3" rx="1" fill={MUTED_FG} />
    <circle
      cx="24"
      cy="54"
      r="7"
      stroke={MUTED_FG}
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M24 50 L24 54 L27 56"
      stroke={MUTED_FG}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M50 58 L54 52 L58 55 L62 48"
      stroke={PRIMARY}
      strokeWidth="2"
      strokeLinecap="round"
      className="animate-pulse-slow"
    />
  </svg>
);

// Latest Orders - List with transactions
export const LatestOrdersIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect x="14" y="18" width="52" height="12" rx="3" fill={SURFACE} />
    <circle cx="24" cy="24" r="4" fill="#22c55e" />
    <rect x="32" y="22" width="28" height="4" rx="1" fill={MUTED} />
    <rect
      x="14"
      y="34"
      width="52"
      height="12"
      rx="3"
      fill={SURFACE}
      className="animate-slide"
    />
    <circle cx="24" cy="40" r="4" fill="#ef4444" />
    <rect x="32" y="38" width="24" height="4" rx="1" fill={MUTED} />
    <rect x="14" y="50" width="52" height="12" rx="3" fill={SURFACE} />
    <circle
      cx="24"
      cy="56"
      r="4"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <rect x="32" y="54" width="20" height="4" rx="1" fill={MUTED} />
  </svg>
);

// Screener - Grid with data
export const ScreenerIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect x="12" y="16" width="56" height="8" rx="2" fill={SURFACE} />
    <rect x="14" y="18" width="12" height="4" rx="1" fill={PRIMARY} />
    <rect x="28" y="18" width="12" height="4" rx="1" fill={MUTED} />
    <rect x="42" y="18" width="12" height="4" rx="1" fill={MUTED} />
    <rect x="56" y="18" width="10" height="4" rx="1" fill={MUTED} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect
          x="14"
          y={28 + i * 10}
          width="10"
          height="6"
          rx="1"
          fill={MUTED_FG}
        />
        <rect
          x="28"
          y={28 + i * 10}
          width="10"
          height="6"
          rx="1"
          fill={i === 1 ? '#22c55e' : i === 2 ? '#ef4444' : '#3a3a3a'}
        />
        <rect x="42" y={28 + i * 10} width="8" height="6" rx="1" fill={MUTED} />
        <rect
          x="56"
          y={28 + i * 10}
          width="10"
          height="6"
          rx="1"
          fill={i === 0 ? PRIMARY : MUTED}
          className={i === 0 ? 'animate-pulse-slow' : ''}
        />
      </g>
    ))}
  </svg>
);

// Portfolio Allocation - Pie chart
export const PortfolioAllocationIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <circle
      cx="40"
      cy="40"
      r="22"
      stroke="#3a3a3a"
      strokeWidth="6"
      fill="none"
    />
    <path
      d="M40 18 A22 22 0 0 1 62 40"
      stroke={PRIMARY}
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
      className="animate-pulse-slow"
    />
    <path
      d="M62 40 A22 22 0 0 1 40 62"
      stroke="#22c55e"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M40 62 A22 22 0 0 1 25 26"
      stroke="#3b82f6"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="40" cy="40" r="10" fill={CARD_BG} />
    <text
      x="40"
      y="44"
      fontSize="10"
      fill={PRIMARY}
      textAnchor="middle"
      fontWeight="bold"
    >
      %
    </text>
  </svg>
);

// Portfolio Balances - List with coins
export const PortfolioBalancesIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <circle
      cx="24"
      cy="24"
      r="8"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <text
      x="24"
      y="28"
      fontSize="10"
      fill="#fff"
      textAnchor="middle"
      fontWeight="bold"
    >
      ₿
    </text>
    <rect x="38" y="20" width="24" height="4" rx="1" fill={MUTED} />
    <rect x="38" y="26" width="16" height="3" rx="1" fill="#22c55e" />
    <circle cx="24" cy="44" r="8" fill="#3b82f6" />
    <text
      x="24"
      y="48"
      fontSize="10"
      fill="#fff"
      textAnchor="middle"
      fontWeight="bold"
    >
      Ξ
    </text>
    <rect x="38" y="40" width="20" height="4" rx="1" fill={MUTED} />
    <rect x="38" y="46" width="14" height="3" rx="1" fill="#ef4444" />
    <circle cx="24" cy="60" r="6" fill={MUTED_FG} />
    <rect x="38" y="58" width="18" height="3" rx="1" fill={MUTED} />
  </svg>
);

// Coin Chart - Candlestick chart (reduced movement, no orange)
export const CoinChartIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect x="12" y="60" width="56" height="2" rx="1" fill={MUTED} />
    {/* Candlesticks - static with subtle pulse on last one */}
    <g>
      <rect x="18" y="28" width="1" height="24" fill="#22c55e" />
      <rect x="16" y="32" width="6" height="12" rx="1" fill="#22c55e" />
    </g>
    <g>
      <rect x="30" y="24" width="1" height="28" fill="#ef4444" />
      <rect x="28" y="28" width="6" height="16" rx="1" fill="#ef4444" />
    </g>
    <g>
      <rect x="42" y="20" width="1" height="32" fill="#22c55e" />
      <rect x="40" y="24" width="6" height="20" rx="1" fill="#22c55e" />
    </g>
    <g>
      <rect x="54" y="30" width="1" height="20" fill="#ef4444" />
      <rect x="52" y="34" width="6" height="10" rx="1" fill="#ef4444" />
    </g>
    <g className="animate-pulse-slow">
      <rect x="64" y="22" width="1" height="30" fill="#22c55e" />
      <rect x="62" y="26" width="6" height="18" rx="1" fill="#22c55e" />
    </g>
  </svg>
);

// Treemap Market - Treemap grid
export const TreemapMarketIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect
      x="12"
      y="16"
      width="28"
      height="24"
      rx="2"
      fill="#22c55e"
      className="animate-pulse-slow"
    />
    <rect x="44" y="16" width="24" height="14" rx="2" fill={PRIMARY} />
    <rect x="44" y="34" width="24" height="6" rx="2" fill="#ef4444" />
    <rect x="12" y="44" width="14" height="20" rx="2" fill="#3b82f6" />
    <rect x="30" y="44" width="18" height="10" rx="2" fill="#8b5cf6" />
    <rect x="30" y="58" width="18" height="6" rx="2" fill={MUTED_FG} />
    <rect
      x="52"
      y="44"
      width="16"
      height="20"
      rx="2"
      fill="#22c55e"
      opacity="0.7"
    />
  </svg>
);

// Treemap Portfolio
export const TreemapPortfolioIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect
      x="12"
      y="16"
      width="32"
      height="28"
      rx="2"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <text
      x="28"
      y="34"
      fontSize="12"
      fill="#fff"
      textAnchor="middle"
      fontWeight="bold"
    >
      ₿
    </text>
    <rect x="48" y="16" width="20" height="16" rx="2" fill="#3b82f6" />
    <text x="58" y="28" fontSize="10" fill="#fff" textAnchor="middle">
      Ξ
    </text>
    <rect x="48" y="36" width="20" height="8" rx="2" fill={MUTED_FG} />
    <rect x="12" y="48" width="18" height="16" rx="2" fill="#22c55e" />
    <rect x="34" y="48" width="16" height="16" rx="2" fill="#8b5cf6" />
    <rect x="54" y="48" width="14" height="16" rx="2" fill="#ef4444" />
  </svg>
);

// Treemap Deals
export const TreemapDealsIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect x="12" y="16" width="24" height="20" rx="2" fill="#22c55e" />
    <text x="24" y="30" fontSize="8" fill="#fff" textAnchor="middle">
      +5%
    </text>
    <rect
      x="40"
      y="16"
      width="28"
      height="12"
      rx="2"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <rect x="40" y="32" width="28" height="8" rx="2" fill="#3b82f6" />
    <rect x="12" y="40" width="16" height="24" rx="2" fill="#ef4444" />
    <text x="20" y="56" fontSize="8" fill="#fff" textAnchor="middle">
      -2%
    </text>
    <rect x="32" y="40" width="20" height="14" rx="2" fill="#8b5cf6" />
    <rect x="32" y="58" width="20" height="6" rx="2" fill={MUTED_FG} />
    <rect
      x="56"
      y="44"
      width="12"
      height="20"
      rx="2"
      fill="#22c55e"
      opacity="0.7"
    />
  </svg>
);

// Fear & Greed Index - Gauge
export const FearGreedIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <path
      d="M20 50 A25 25 0 0 1 60 50"
      stroke="#3a3a3a"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M20 50 A25 25 0 0 1 32 30"
      stroke="#ef4444"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M32 30 A25 25 0 0 1 48 30"
      stroke={PRIMARY}
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
      className="animate-pulse-slow"
    />
    <path
      d="M48 30 A25 25 0 0 1 60 50"
      stroke="#22c55e"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="40" cy="50" r="4" fill={PRIMARY} />
    <line
      x1="40"
      y1="50"
      x2="50"
      y2="35"
      stroke={PRIMARY}
      strokeWidth="3"
      strokeLinecap="round"
      className="animate-pulse-slow"
    />
    <text
      x="40"
      y="66"
      fontSize="10"
      fill={PRIMARY}
      textAnchor="middle"
      fontWeight="bold"
    >
      72
    </text>
  </svg>
);

// Indicator Heatmap - Grid heatmap with red to green gradient
export const IndicatorHeatmapIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <defs>
      <linearGradient id="heatmapGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="50%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
    </defs>
    {/* Red to green gradient cells */}
    {[0, 1, 2, 3].map((row) =>
      [0, 1, 2, 3].map((col) => {
        // Calculate color based on position (top-left red, bottom-right green)
        const position = (row + col) / 6; // 0 to 1
        const isCenter = row === 1 && col === 2;
        let color: string;
        if (position < 0.33) {
          color = '#ef4444'; // Red
        } else if (position < 0.5) {
          color = '#f97316'; // Orange
        } else if (position < 0.66) {
          color = '#eab308'; // Yellow
        } else {
          color = '#22c55e'; // Green
        }
        return (
          <rect
            key={`${row}-${col}`}
            x={14 + col * 14}
            y={16 + row * 14}
            width="12"
            height="12"
            rx="2"
            fill={color}
            opacity={isCenter ? 1 : 0.7}
            className={isCenter ? 'animate-pulse-slow' : ''}
          />
        );
      })
    )}
  </svg>
);

// Watchlist - Price list
export const WatchlistIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <circle
      cx="22"
      cy="22"
      r="6"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <rect x="34" y="18" width="20" height="4" rx="1" fill="#fff" />
    <rect x="34" y="24" width="12" height="3" rx="1" fill="#22c55e" />
    <path
      d="M60 18 L64 22 L60 26"
      stroke="#22c55e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="22" cy="42" r="6" fill="#3b82f6" />
    <rect x="34" y="38" width="18" height="4" rx="1" fill="#fff" />
    <rect x="34" y="44" width="10" height="3" rx="1" fill="#ef4444" />
    <path
      d="M60 38 L64 42 L60 46"
      stroke="#ef4444"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      style={{ transform: 'rotate(180deg)', transformOrigin: '62px 42px' }}
    />
    <circle cx="22" cy="60" r="5" fill={MUTED_FG} />
    <rect x="34" y="58" width="16" height="3" rx="1" fill={MUTED_FG} />
  </svg>
);

// Notes - Notepad
export const NotesIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect
      x="18"
      y="14"
      width="44"
      height="52"
      rx="4"
      stroke={PRIMARY}
      strokeWidth="2"
      fill="none"
    />
    <rect x="26" y="24" width="28" height="3" rx="1" fill={MUTED_FG} />
    <rect x="26" y="32" width="24" height="3" rx="1" fill={MUTED_FG} />
    <rect
      x="26"
      y="40"
      width="20"
      height="3"
      rx="1"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <rect x="26" y="48" width="26" height="3" rx="1" fill={MUTED_FG} />
    <rect x="26" y="56" width="16" height="3" rx="1" fill={MUTED_FG} />
    <circle cx="22" cy="26" r="2" fill={PRIMARY} />
    <circle cx="22" cy="34" r="2" fill={PRIMARY} />
    <circle cx="22" cy="42" r="2" fill={PRIMARY} />
  </svg>
);

// News RSS - News feed
export const NewsRSSIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect
      x="12"
      y="16"
      width="24"
      height="20"
      rx="3"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <rect x="40" y="16" width="28" height="4" rx="1" fill="#fff" />
    <rect x="40" y="24" width="24" height="3" rx="1" fill={MUTED_FG} />
    <rect x="40" y="30" width="20" height="3" rx="1" fill={MUTED_FG} />
    <rect x="12" y="42" width="56" height="2" rx="1" fill={MUTED} />
    <rect x="12" y="50" width="18" height="14" rx="2" fill="#3b82f6" />
    <rect x="34" y="50" width="34" height="3" rx="1" fill="#fff" />
    <rect x="34" y="56" width="28" height="2" rx="1" fill={MUTED_FG} />
    <rect x="34" y="60" width="22" height="2" rx="1" fill={MUTED_FG} />
  </svg>
);

// Overview Quick Actions - Grid of actions
export const OverviewQuickActionsIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect
      x="14"
      y="16"
      width="24"
      height="24"
      rx="4"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <path
      d="M22 28 L30 28 M26 24 L26 32"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect x="42" y="16" width="24" height="24" rx="4" fill="#3b82f6" />
    <circle cx="54" cy="28" r="6" stroke="#fff" strokeWidth="2" fill="none" />
    <path
      d="M58 32 L62 36"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect x="14" y="44" width="24" height="24" rx="4" fill="#22c55e" />
    <path
      d="M20 56 L24 60 L32 52"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="42" y="44" width="24" height="24" rx="4" fill="#8b5cf6" />
    <rect
      x="50"
      y="52"
      width="8"
      height="8"
      rx="2"
      stroke="#fff"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

// Onboarding Steps - Checklist
export const OnboardingStepsIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <circle cx="24" cy="24" r="8" fill="#22c55e" />
    <path
      d="M20 24 L23 27 L28 21"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="38" y="20" width="28" height="4" rx="1" fill={MUTED_FG} />
    <rect x="38" y="26" width="20" height="3" rx="1" fill={MUTED} />
    <circle
      cx="24"
      cy="44"
      r="8"
      stroke={PRIMARY}
      strokeWidth="2"
      fill="none"
      className="animate-pulse-slow"
    />
    <text
      x="24"
      y="48"
      fontSize="10"
      fill={PRIMARY}
      textAnchor="middle"
      fontWeight="bold"
    >
      2
    </text>
    <rect x="38" y="40" width="24" height="4" rx="1" fill="#fff" />
    <rect x="38" y="46" width="18" height="3" rx="1" fill={MUTED} />
    <circle
      cx="24"
      cy="60"
      r="6"
      stroke={MUTED_FG}
      strokeWidth="2"
      fill="none"
    />
    <text x="24" y="63" fontSize="8" fill={MUTED_FG} textAnchor="middle">
      3
    </text>
    <rect x="38" y="58" width="20" height="3" rx="1" fill={MUTED_FG} />
  </svg>
);

// Categories Analysis - Categorized pie
export const CategoriesAnalysisIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <circle
      cx="32"
      cy="40"
      r="18"
      stroke="#3a3a3a"
      strokeWidth="4"
      fill="none"
    />
    <path
      d="M32 22 A18 18 0 0 1 50 40"
      stroke={PRIMARY}
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
      className="animate-pulse-slow"
    />
    <path
      d="M50 40 A18 18 0 0 1 32 58"
      stroke="#3b82f6"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M32 58 A18 18 0 0 1 14 40"
      stroke="#22c55e"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="54" y="24" width="4" height="4" rx="1" fill={PRIMARY} />
    <rect x="60" y="24" width="10" height="4" rx="1" fill={MUTED_FG} />
    <rect x="54" y="34" width="4" height="4" rx="1" fill="#3b82f6" />
    <rect x="60" y="34" width="8" height="4" rx="1" fill={MUTED_FG} />
    <rect x="54" y="44" width="4" height="4" rx="1" fill="#22c55e" />
    <rect x="60" y="44" width="12" height="4" rx="1" fill={MUTED_FG} />
  </svg>
);

// Market Cap Analysis - only animate the top caps
export const MarketCapAnalysisIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    {/* Static bar bodies */}
    <rect x="16" y="52" width="12" height="12" rx="2" fill={PRIMARY} />
    <rect x="34" y="38" width="12" height="26" rx="2" fill="#3b82f6" />
    <rect x="52" y="24" width="12" height="40" rx="2" fill="#22c55e" />
    {/* Animated top caps */}
    <rect
      x="16"
      y="48"
      width="12"
      height="4"
      rx="1"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <rect
      x="34"
      y="34"
      width="12"
      height="4"
      rx="1"
      fill="#3b82f6"
      style={{ animation: 'pulse 2s ease-in-out infinite 0.2s' }}
    />
    <rect
      x="52"
      y="20"
      width="12"
      height="4"
      rx="1"
      fill="#22c55e"
      style={{ animation: 'pulse 2s ease-in-out infinite 0.4s' }}
    />
    <text x="22" y="70" fontSize="6" fill="#fff" textAnchor="middle">
      S
    </text>
    <text x="40" y="70" fontSize="6" fill="#fff" textAnchor="middle">
      M
    </text>
    <text x="58" y="70" fontSize="6" fill="#fff" textAnchor="middle">
      L
    </text>
  </svg>
);

// Performance Analysis - Up/down arrows
export const PerformanceAnalysisIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <path
      d="M24 20 L24 40 M18 26 L24 20 L30 26"
      stroke="#22c55e"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-slide"
    />
    <rect x="36" y="22" width="28" height="4" rx="1" fill="#22c55e" />
    <rect x="36" y="30" width="20" height="3" rx="1" fill={MUTED_FG} />
    <path
      d="M24 60 L24 40 M18 54 L24 60 L30 54"
      stroke="#ef4444"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'slideUp 1.5s ease-in-out infinite reverse' }}
    />
    <rect x="36" y="50" width="24" height="4" rx="1" fill="#ef4444" />
    <rect x="36" y="58" width="18" height="3" rx="1" fill={MUTED_FG} />
  </svg>
);

// Exchange Distribution - Pie chart
export const ExchangeDistributionIcon: React.FC<WidgetIconProps> = ({
  className,
}) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    {/* Pie chart slices */}
    <circle cx="40" cy="40" r="24" fill={MUTED} />
    {/* Large slice - orange (40%) */}
    <path
      d="M40 40 L40 16 A24 24 0 0 1 61.7 28 Z"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    {/* Medium slice - blue (30%) */}
    <path d="M40 40 L61.7 28 A24 24 0 0 1 55.8 58.5 Z" fill="#3b82f6" />
    {/* Small slice - green (20%) */}
    <path d="M40 40 L55.8 58.5 A24 24 0 0 1 24.2 58.5 Z" fill="#22c55e" />
    {/* Tiny slice - gray (10%) */}
    <path d="M40 40 L24.2 58.5 A24 24 0 0 1 40 16 Z" fill={MUTED_FG} />
    {/* Center hole for donut effect */}
    <circle cx="40" cy="40" r="10" fill={CARD_BG} />
  </svg>
);

// Metric Chart - Report chart
export const MetricChartIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect x="12" y="60" width="56" height="2" rx="1" fill={MUTED} />
    <rect x="14" y="16" width="2" height="44" rx="1" fill={MUTED} />
    <path
      d="M18 50 L28 42 L38 46 L48 30 L58 35 L68 22"
      stroke={PRIMARY}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      className="animate-pulse-slow"
    />
    <path
      d="M18 54 L28 50 L38 52 L48 44 L58 48 L68 40"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="68" cy="22" r="3" fill={PRIMARY} />
    <circle cx="68" cy="40" r="3" fill="#3b82f6" />
  </svg>
);

// Metric Table - Data table
export const MetricTableIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect
      x="12"
      y="16"
      width="56"
      height="10"
      rx="2"
      fill={PRIMARY}
      opacity="0.3"
    />
    <rect x="14" y="18" width="14" height="6" rx="1" fill={PRIMARY} />
    <rect x="32" y="18" width="14" height="6" rx="1" fill={PRIMARY} />
    <rect x="50" y="18" width="16" height="6" rx="1" fill={PRIMARY} />
    <rect x="12" y="28" width="56" height="1" fill={MUTED} />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect
          x="14"
          y={34 + i * 12}
          width="12"
          height="6"
          rx="1"
          fill={MUTED_FG}
        />
        <rect
          x="32"
          y={34 + i * 12}
          width={14 - i * 2}
          height="6"
          rx="1"
          fill={i === 0 ? '#22c55e' : i === 1 ? PRIMARY : '#ef4444'}
          className={i === 1 ? 'animate-pulse-slow' : ''}
        />
        <rect
          x="50"
          y={34 + i * 12}
          width="14"
          height="6"
          rx="1"
          fill={MUTED}
        />
      </g>
    ))}
  </svg>
);

// Histogram - Distribution bars
export const HistogramIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect x="12" y="60" width="56" height="2" rx="1" fill={MUTED} />
    <rect
      x="16"
      y="50"
      width="6"
      height="10"
      rx="1"
      fill={PRIMARY}
      opacity="0.5"
    />
    <rect
      x="24"
      y="40"
      width="6"
      height="20"
      rx="1"
      fill={PRIMARY}
      opacity="0.7"
    />
    <rect
      x="32"
      y="25"
      width="6"
      height="35"
      rx="1"
      fill={PRIMARY}
      className="animate-grow"
    />
    <rect
      x="40"
      y="30"
      width="6"
      height="30"
      rx="1"
      fill={PRIMARY}
      opacity="0.9"
    />
    <rect
      x="48"
      y="38"
      width="6"
      height="22"
      rx="1"
      fill={PRIMARY}
      opacity="0.7"
    />
    <rect
      x="56"
      y="48"
      width="6"
      height="12"
      rx="1"
      fill={PRIMARY}
      opacity="0.5"
    />
    <rect
      x="64"
      y="54"
      width="4"
      height="6"
      rx="1"
      fill={PRIMARY}
      opacity="0.3"
    />
  </svg>
);

// Scatter Plot - Dots pattern
export const ScatterIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect x="12" y="60" width="56" height="2" rx="1" fill={MUTED} />
    <rect x="14" y="16" width="2" height="44" rx="1" fill={MUTED} />
    <circle cx="25" cy="50" r="4" fill={PRIMARY} opacity="0.7" />
    <circle
      cx="32"
      cy="42"
      r="4"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <circle cx="40" cy="38" r="4" fill={PRIMARY} opacity="0.8" />
    <circle cx="48" cy="30" r="4" fill={PRIMARY} />
    <circle cx="55" cy="25" r="4" fill={PRIMARY} opacity="0.9" />
    <circle
      cx="62"
      cy="22"
      r="4"
      fill={PRIMARY}
      className="animate-pulse-slow"
    />
    <circle cx="28" cy="48" r="3" fill="#3b82f6" opacity="0.6" />
    <circle cx="45" cy="35" r="3" fill="#3b82f6" />
    <circle cx="58" cy="28" r="3" fill="#3b82f6" opacity="0.8" />
  </svg>
);

// Heatmap - Color grid
export const HeatmapIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    {[0, 1, 2, 3, 4].map((row) =>
      [0, 1, 2, 3, 4].map((col) => {
        // Create a gradient pattern from red to green based on position
        const position = (row * 5 + col) / 24;
        // Color gradient: red -> orange -> yellow -> green
        const color =
          position < 0.3
            ? '#ef4444'
            : position < 0.5
              ? '#f97316'
              : position < 0.7
                ? '#eab308'
                : '#22c55e';
        const isCenter = row === 2 && col === 2;
        return (
          <rect
            key={`${row}-${col}`}
            x={14 + col * 11}
            y={16 + row * 11}
            width="10"
            height="10"
            rx="2"
            fill={color}
            className={isCenter ? 'animate-pulse-slow' : ''}
          />
        );
      })
    )}
  </svg>
);

// Default/Fallback icon
export const DefaultWidgetIcon: React.FC<WidgetIconProps> = ({ className }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <style>{iconBaseStyle}</style>
    <rect width="80" height="80" rx="8" fill={CARD_BG} />
    <rect
      x="20"
      y="20"
      width="40"
      height="40"
      rx="6"
      stroke={PRIMARY}
      strokeWidth="2"
      fill="none"
      className="animate-pulse-slow"
    />
    <circle cx="40" cy="35" r="6" fill={PRIMARY} />
    <rect x="32" y="46" width="16" height="3" rx="1" fill={MUTED_FG} />
    <rect x="28" y="52" width="24" height="2" rx="1" fill={MUTED} />
  </svg>
);

// Export type for external use
export type { WidgetIconProps };
