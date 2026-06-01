import React, { useEffect, useState } from 'react';

interface DualArcProgressGaugeProps {
  /** Progress percentage for outer arc (0-100) */
  outerPercentage: number;
  /** Progress percentage for inner arc (0-100) */
  innerPercentage: number;
  /** Label text to display below the percentage */
  label: string;
  /** Optional text to display in center (overrides calculated percentage) */
  centerText?: string;
  /** Size of the gauge in pixels */
  size?: number;
  /** Background color for the trail arc */
  trailColor?: string;
  /** Color for the progress arc (both arcs if no separate colors specified) */
  progressColor?: string;
  /** Color for the outer progress arc (overrides progressColor for outer arc) */
  outerProgressColor?: string;
  /** Color for the inner progress arc (overrides progressColor for inner arc) */
  innerProgressColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the progress on mount/change */
  animate?: boolean;
  /** Which percentage to display in center - 'outer', 'inner', 'average', or 'both' */
  displayMode?: 'outer' | 'inner' | 'average' | 'both';
  /** Whether to show the inner gauge */
  showInnerGauge?: boolean;
}

export const DualArcProgressGauge: React.FC<DualArcProgressGaugeProps> = ({
  outerPercentage,
  innerPercentage,
  label,
  centerText,
  size = 140,
  trailColor = 'rgba(137, 146, 163, 0.2)',
  progressColor = '#4ade80',
  outerProgressColor,
  innerProgressColor,
  className = '',
  animate = true,
  displayMode = 'average',
  showInnerGauge = true,
}) => {
  const [animatedOuterPercentage, setAnimatedOuterPercentage] = useState(
    animate ? 0 : outerPercentage
  );
  const [animatedInnerPercentage, setAnimatedInnerPercentage] = useState(
    animate ? 0 : innerPercentage
  );

  // Animation effect for outer arc
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimatedOuterPercentage(outerPercentage);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setAnimatedOuterPercentage(outerPercentage);
      return () => {}; // Return empty cleanup function
    }
  }, [outerPercentage, animate]);

  // Animation effect for inner arc
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimatedInnerPercentage(innerPercentage);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setAnimatedInnerPercentage(innerPercentage);
      return () => {}; // Return empty cleanup function
    }
  }, [innerPercentage, animate]);

  // SVG dimensions
  const viewBoxSize = 120;
  const center = viewBoxSize / 2;

  // Radii for the dual arcs - increased separation
  const outerRadius = 54; // Outer progress arc (thicker)
  const innerRadius = 40; // Inner progress arc (thinner) - more separation

  // Arc configuration - approximately 270° sweep starting from bottom left
  const startAngle = 135; // degrees
  const sweepAngle = 270; // degrees

  // Convert to radians and calculate end angle
  const startRad = (startAngle * Math.PI) / 180;
  const endAngle = startAngle + sweepAngle;
  const endRad = (endAngle * Math.PI) / 180;

  // Function to create SVG arc path
  const createArcPath = (radius: number): string => {
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = sweepAngle > 180 ? 1 : 0;

    return `M ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2}`;
  };

  // Calculate stroke-dasharray for progress animation for both arcs
  const outerArcLength = (sweepAngle / 360) * (2 * Math.PI * outerRadius);
  const outerProgressLength = (animatedOuterPercentage / 100) * outerArcLength;
  const outerGapLength = outerArcLength - outerProgressLength;

  const innerArcLength = (sweepAngle / 360) * (2 * Math.PI * innerRadius);
  const innerProgressLength = (animatedInnerPercentage / 100) * innerArcLength;
  const innerGapLength = innerArcLength - innerProgressLength;

  // Calculate responsive text and spacing based on size
  const getResponsiveSizes = (size: number) => {
    if (size <= 80) {
      return {
        percentageFontSize: Math.round(size * 0.26), // slightly smaller than before
        labelFontSize: Math.round(size * 0.15),
        labelPadding: Math.round(size * 0.025),
        marginTop: Math.round(size * 0.025),
      };
    } else if (size <= 120) {
      return {
        percentageFontSize: Math.round(size * 0.28),
        labelFontSize: Math.round(size * 0.15),
        labelPadding: Math.round(size * 0.04),
        marginTop: Math.round(size * 0.025),
      };
    } else if (size <= 160) {
      return {
        percentageFontSize: Math.round(size * 0.3),
        labelFontSize: Math.round(size * 0.15),
        labelPadding: Math.round(size * 0.04),
        marginTop: Math.round(size * 0.03),
      };
    } else {
      return {
        percentageFontSize: Math.round(size * 0.32),
        labelFontSize: Math.round(size * 0.15),
        labelPadding: Math.round(size * 0.04),
        marginTop: Math.round(size * 0.025),
      };
    }
  };

  const responsiveSizes = getResponsiveSizes(size);

  // Determine colors for each arc
  const finalOuterProgressColor = outerProgressColor || progressColor;
  const finalInnerProgressColor = innerProgressColor || progressColor; // Calculate display percentage based on mode
  const getDisplayPercentage = () => {
    // If centerText is provided, use it instead of calculated percentage
    if (centerText) {
      return centerText;
    }

    switch (displayMode) {
      case 'outer':
        return outerPercentage;
      case 'inner':
        return innerPercentage;
      case 'average':
        return (outerPercentage + innerPercentage) / 2;
      case 'both':
        return `${outerPercentage.toFixed(1)}% / ${innerPercentage.toFixed(1)}%`;
      default:
        return (outerPercentage + innerPercentage) / 2;
    }
  };

  const displayValue = getDisplayPercentage();

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center ${className}`}
      style={{
        width: size,
        height: size, // Remove extra height since label is inside now
      }}
    >
      <div
        className="relative inline-flex items-center justify-center"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="absolute"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
          }}
        >
          {/* Background trail arc (outer, thicker) */}
          <path
            d={createArcPath(outerRadius)}
            fill="none"
            stroke={trailColor}
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Background trail arc (inner, thinner) */}
          {showInnerGauge && (
            <path
              d={createArcPath(innerRadius)}
              fill="none"
              stroke={trailColor}
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}

          {/* Outer progress arc (thicker) */}
          <path
            d={createArcPath(outerRadius)}
            fill="none"
            stroke={finalOuterProgressColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${outerProgressLength} ${outerGapLength}`}
            style={{
              transition: animate
                ? 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'none',
            }}
          />

          {/* Inner progress arc (thinner) */}
          {showInnerGauge && (
            <path
              d={createArcPath(innerRadius)}
              fill="none"
              stroke={finalInnerProgressColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${innerProgressLength} ${innerGapLength}`}
              style={{
                transition: animate
                  ? 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  : 'none',
              }}
            />
          )}
        </svg>

        {/* Center percentage text */}
        <div
          className="absolute flex items-center justify-center z-10 font-semibold leading-none"
          style={{
            color: 'var(--foreground)',
            // eslint-disable-next-line spacing/no-hardcoded-font-size
            fontSize: `${responsiveSizes.percentageFontSize}px`,
          }}
        >
          {centerText
            ? centerText
            : typeof displayValue === 'string'
              ? displayValue
              : `${displayValue.toFixed(2)}%`}
        </div>

        {/* Label positioned right at the bottom arc opening */}
        <div
          className="absolute z-10 flex items-center justify-center"
          style={{
            bottom: `${size * 0.02}px`, // Position pushed down slightly (reduced from 0.1)
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="rounded-full font-medium"
            style={{
              backgroundColor: 'var(--color-card)',
              color: 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              padding: `${responsiveSizes.labelPadding}px ${responsiveSizes.labelPadding * 1.5}px`,
              // eslint-disable-next-line spacing/no-hardcoded-font-size
              fontSize: `${responsiveSizes.labelFontSize}px`,
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualArcProgressGauge;
