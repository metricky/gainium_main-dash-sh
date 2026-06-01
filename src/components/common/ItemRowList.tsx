import React from 'react';

export interface ItemRowListProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  dataIndex?: number;
  as?: 'button' | 'div';
}

/**
 * A standardized list item component used across the application
 * for consistent appearance in search results, shortcuts, and other list-based UIs.
 *
 * Features:
 * - Consistent padding (p-sm)
 * - Rounded borders (rounded-lg)
 * - Hover and selected states
 * - Can be rendered as button or div
 */
export const ItemRowList: React.FC<ItemRowListProps> = ({
  children,
  onClick,
  selected = false,
  disabled = false,
  className = '',
  dataIndex,
  as = 'button',
}) => {
  const baseClasses = `
    w-full flex items-center justify-between p-sm rounded-lg transition-colors
    ${
      selected
        ? 'bg-accent'
        : 'bg-card hover:bg-muted/60'
    }
    ${disabled ? 'opacity-80 cursor-not-allowed' : ''}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ');

  const Component = as;

  return (
    <Component
      className={baseClasses}
      onClick={disabled ? undefined : onClick}
      data-index={dataIndex}
      disabled={as === 'button' && disabled ? true : undefined}
      type={as === 'button' ? 'button' : undefined}
    >
      {children}
    </Component>
  );
};

export default ItemRowList;
