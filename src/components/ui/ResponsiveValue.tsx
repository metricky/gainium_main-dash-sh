import { useContainerWidth } from '@/hooks/useContainerWidth';
import { cn } from '@/lib/utils';
import React from 'react';

export interface ResponsiveValueProps {
  /**
   * Render prop receiving the current container pixel width.
   * Use it to decide which variant (size, format, abbreviation, etc.) to render.
   */
  children: (containerWidth: number) => React.ReactNode;
  /** Optional className applied to the outer measuring div */
  className?: string;
}

/**
 * ResponsiveValue
 *
 * A generic container that observes its own width via ResizeObserver and
 * exposes it to a render-prop child so the child can adapt its output
 * (font size, number format, abbreviation, etc.) to available space.
 *
 * Usage:
 * ```tsx
 * <ResponsiveValue>
 *   {(width) => (
 *     <ProfitValue
 *       value={amount}
 *       className={width < 100 ? 'text-sm' : width < 160 ? 'text-lg' : 'text-2xl'}
 *     />
 *   )}
 * </ResponsiveValue>
 * ```
 */
export const ResponsiveValue: React.FC<ResponsiveValueProps> = ({
  children,
  className,
}) => {
  const [containerRef, containerWidth] = useContainerWidth();

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      {children(containerWidth)}
    </div>
  );
};

export default ResponsiveValue;
