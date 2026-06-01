import React from 'react';

export interface ResponsiveRowV2Props {
  children: React.ReactNode;
  className?: string;
  /**
   * Minimum width for each item in pixels
   * @default 280
   */
  minItemWidth?: number;
  /**
   * Maximum width for each item in pixels (optional)
   * If not provided, items will grow to fill available space
   */
  maxItemWidth?: number;
  /**
   * Gap between grid items
   * @default "1rem"
   */
  gap?: string;
  /**
   * Whether to use dense packing algorithm
   * @default false
   */
  dense?: boolean;
  /**
   * Responsive breakpoints for different minimum widths
   */
  breakpoints?: {
    sm?: { containerWidth: number; minItemWidth: number };
    md?: { containerWidth: number; minItemWidth: number };
    lg?: { containerWidth: number; minItemWidth: number };
    xl?: { containerWidth: number; minItemWidth: number };
  };
  /**
   * Alignment of items within the grid
   * @default "stretch"
   */
  itemAlignment?: 'start' | 'center' | 'end' | 'stretch';
}

/**
 * ResponsiveRowV2 component that creates a more flexible responsive layout
 * using CSS Grid with auto-fit and minmax for optimal space utilization.
 * This version eliminates gaps and provides better control over item sizing.
 */
export const ResponsiveRowV2: React.FC<ResponsiveRowV2Props> = ({
  children,
  className = '',
  minItemWidth = 280,
  maxItemWidth,
  gap = '1rem',
  dense = false,
  breakpoints,
  itemAlignment = 'stretch',
}) => {
  // Generate the base grid template columns
  const getGridTemplateColumns = () => {
    const maxWidth = maxItemWidth ? `${maxItemWidth}px` : '1fr';
    return `repeat(auto-fit, minmax(${minItemWidth}px, ${maxWidth}))`;
  };

  // Generate container query styles for breakpoints
  const generateBreakpointStyles = () => {
    if (!breakpoints) return {};

    const styles: Record<string, React.CSSProperties> = {};

    Object.entries(breakpoints).forEach(
      ([_key, { containerWidth, minItemWidth }]) => {
        const mediaQuery = `@container (min-width: ${containerWidth}px)`;
        const maxWidth = maxItemWidth ? `${maxItemWidth}px` : '1fr';

        styles[mediaQuery] = {
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, ${maxWidth}))`,
        };
      }
    );

    return styles;
  };

  const alignmentClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[itemAlignment];

  const breakpointStyles = generateBreakpointStyles();

  return (
    <div className="@container">
      <div
        className={`grid ${alignmentClass} ${
          dense ? 'grid-auto-flow-dense' : ''
        } ${className}`}
        style={{
          gridTemplateColumns: getGridTemplateColumns(),
          gap: gap,
          ...breakpointStyles,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ResponsiveRowV2;
