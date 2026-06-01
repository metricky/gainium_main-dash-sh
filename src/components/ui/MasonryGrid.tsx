import React from 'react';

export interface MasonryGridProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Minimum width for each item in pixels
   * @default 280
   */
  minItemWidth?: number;
  /**
   * Maximum width for each item in pixels (optional)
   * @default undefined (uses 1fr)
   */
  maxItemWidth?: number;
  /**
   * Gap between grid items
   * @default "1rem"
   */
  gap?: string;
  /**
   * Whether to use dense packing to fill gaps
   * @default false
   */
  dense?: boolean;
  /**
   * Custom breakpoints for different item sizes
   */
  breakpoints?: {
    sm?: number; // Container width breakpoint
    md?: number;
    lg?: number;
    xl?: number;
    minWidth?: {
      sm?: number; // Min item width at breakpoint
      md?: number;
      lg?: number;
      xl?: number;
    };
  };
}

/**
 * MasonryGrid component that creates a responsive masonry-like layout
 * using CSS Grid with auto-fit and minmax for optimal space utilization
 * without gaps between items.
 */
export const MasonryGrid: React.FC<MasonryGridProps> = ({
  children,
  className = '',
  minItemWidth = 280,
  maxItemWidth,
  gap = '1rem',
  dense = false,
  breakpoints,
}) => {
  // Generate responsive grid template columns
  const getGridTemplateColumns = () => {
    const maxWidth = maxItemWidth ? `${maxItemWidth}px` : '1fr';
    return `repeat(auto-fit, minmax(${minItemWidth}px, ${maxWidth}))`;
  };

  // Generate container query classes if breakpoints are provided
  const generateContainerClasses = () => {
    if (!breakpoints) return '';

    const classes: string[] = [];

    // Generate container query classes for different breakpoints
    Object.entries(breakpoints).forEach(([key, value]) => {
      if (key !== 'minWidth' && typeof value === 'number') {
        const minWidth =
          breakpoints.minWidth?.[key as keyof typeof breakpoints.minWidth];
        if (minWidth) {
          classes.push(
            `@[${value}px]:grid-cols-[repeat(auto-fit,minmax(${minWidth}px,1fr))]`
          );
        }
      }
    });

    return classes.join(' ');
  };

  const containerClasses = generateContainerClasses();

  return (
    <div className="@container">
      <div
        className={`grid ${containerClasses} ${gap ? `gap-[${gap}]` : ''} ${
          dense ? 'grid-auto-flow-dense' : ''
        } ${className}`}
        style={{
          gridTemplateColumns: getGridTemplateColumns(),
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MasonryGrid;
