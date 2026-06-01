import React from 'react';

export interface ResponsiveRowProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Breakpoints configuration for responsive columns
   * @default { base: 1, sm: 2, md: 3, lg: 4 }
   */
  breakpoints?: {
    base?: number; // Default columns (no breakpoint)
    sm?: number; // @[200px]: breakpoint
    md?: number; // @[400px]: breakpoint
    lg?: number; // @[600px]: breakpoint
    xl?: number; // @[800px]: breakpoint
  };
  /**
   * Gap between grid items
   * @default "gap-2"
   */
  gap?: string;
}

/**
 * ResponsiveRow component that adapts column count based on container width
 * Uses container queries (@container) to be responsive to the widget's width
 * rather than the viewport width
 *
 * The component automatically wraps itself in a container context to ensure
 * container queries work properly out of the box.
 */
export const ResponsiveRow: React.FC<ResponsiveRowProps> = ({
  children,
  className = '',
  breakpoints = { base: 1, sm: 2 },
  gap = 'gap-2',
}) => {
  // Generate responsive grid classes based on breakpoints
  const generateGridClasses = () => {
    const classes = [];

    // Base columns (no breakpoint)
    if (breakpoints.base) {
      classes.push(`grid-cols-${breakpoints.base}`);
    }

    // Small breakpoint (@[200px])
    if (breakpoints.sm) {
      classes.push(`@[200px]:grid-cols-${breakpoints.sm}`);
    }

    // Medium breakpoint (@[400px])
    if (breakpoints.md) {
      classes.push(`@[400px]:grid-cols-${breakpoints.md}`);
    }

    // Large breakpoint (@[600px])
    if (breakpoints.lg) {
      classes.push(`@[600px]:grid-cols-${breakpoints.lg}`);
    }

    // Extra large breakpoint (@[800px])
    if (breakpoints.xl) {
      classes.push(`@[800px]:grid-cols-${breakpoints.xl}`);
    }

    return classes.join(' ');
  };

  const gridClasses = generateGridClasses();

  return (
    <div className="@container">
      <div className={`grid ${gridClasses} ${gap} ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveRow;
