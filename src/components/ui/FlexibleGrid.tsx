import React from 'react';

export interface FlexibleGridProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Minimum width for items before wrapping
   * @default 280
   */
  minItemWidth?: number;
  /**
   * Gap between items
   * @default "1rem"
   */
  gap?: string;
  /**
   * Whether to stretch items to fill available space
   * @default true
   */
  stretch?: boolean;
  /**
   * Alignment of items
   * @default "start"
   */
  itemAlignment?: 'start' | 'center' | 'end' | 'stretch';
}

export interface FlexibleGridItemProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Flex grow factor (how much the item should grow)
   * @default 1
   */
  grow?: number;
  /**
   * Flex shrink factor (how much the item should shrink)
   * @default 1
   */
  shrink?: number;
  /**
   * Flex basis (initial size before growing/shrinking)
   * @default "auto"
   */
  basis?: string;
  /**
   * Minimum width for this specific item
   */
  minWidth?: string;
  /**
   * Maximum width for this specific item
   */
  maxWidth?: string;
  /**
   * Priority for this item (higher numbers get more space)
   * @default 1
   */
  priority?: number;
}

/**
 * FlexibleGrid component that uses CSS flexbox for responsive layouts
 * with fine-grained control over individual item sizing
 */
export const FlexibleGrid: React.FC<FlexibleGridProps> = ({
  children,
  className = '',
  minItemWidth = 280,
  gap = '1rem',
  stretch = true,
  itemAlignment = 'start',
}) => {
  const alignmentClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[itemAlignment];

  return (
    <div className="@container">
      <div
        className={`flex flex-wrap ${alignmentClass} ${className}`}
        style={{
          gap: gap,
          // Ensure items have minimum width and grow to fill space
          ...(stretch && {
            '& > *': {
              minWidth: `min(${minItemWidth}px, 100%)`,
              flex: '1 1 auto',
            },
          }),
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * FlexibleGridItem component for individual control over grid items
 */
export const FlexibleGridItem: React.FC<FlexibleGridItemProps> = ({
  children,
  className = '',
  grow = 1,
  shrink = 1,
  basis = 'auto',
  minWidth,
  maxWidth,
  priority = 1,
}) => {
  const style: React.CSSProperties = {
    flex: `${grow * priority} ${shrink} ${basis}`,
    ...(minWidth && { minWidth }),
    ...(maxWidth && { maxWidth }),
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

export default FlexibleGrid;
