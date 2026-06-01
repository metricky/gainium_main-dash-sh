import React from 'react';

export interface SettingsRowGroupProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Layout type for this group
   * @default "single" - Each item takes full width
   * "columns" - Items are arranged in columns
   * "inline" - Items are arranged horizontally
   */
  layout?: 'single' | 'columns' | 'inline';
  /**
   * Number of columns when layout is "columns"
   * @default 2
   */
  columns?: number;
  /**
   * Gap between items in this group
   * @default "1rem"
   */
  gap?: string;
  /**
   * Container breakpoints for responsive behavior
   * Only applies when layout is "columns"
   */
  breakpoints?: {
    default: number;
    [key: number]: number;
  };
}

/**
 * SettingsRowGroup component allows fine-grained control over how
 * specific settings rows are grouped and laid out within the masonry grid
 */
export const SettingsRowGroup: React.FC<SettingsRowGroupProps> = ({
  children,
  className = '',
  layout = 'single',
  columns = 2,
  gap = '1rem',
  breakpoints: _breakpoints,
}) => {
  if (layout === 'single') {
    // Just return children as-is for single layout
    return <>{children}</>;
  }

  if (layout === 'inline') {
    // Arrange items horizontally in a flex container
    return (
      <div
        className={`flex flex-wrap items-start ${className}`}
        style={{ gap }}
      >
        {children}
      </div>
    );
  }

  if (layout === 'columns') {
    // Use CSS Grid for column layout with container queries for responsiveness
    return (
      <div className="@container">
        <div
          className={`grid items-stretch grid-cols-1 @[400px]:grid-cols-${columns} ${className}`}
          style={{
            gap,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SettingsRowGroup;
