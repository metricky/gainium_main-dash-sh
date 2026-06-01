import {
  CARD_VIEW_COLUMNS,
  type MasonryBreakpointConfig,
} from '@/config/responsive';
import { useGridMargins } from '@/hooks/useSpacing';
import { logger } from '@/lib/loggerInstance';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './MasonryLayout.css';

export interface MasonryLayoutProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Gap between items. Can be a number (pixels) or CSS value (e.g. "var(--spacing-md)")
   * @default 16
   */
  gap?: number | string;
  /**
   * Container-based breakpoints for number of columns
   * @default { default: 1, 400: 2, 800: 3 }
   */
  containerBreakpoints?: MasonryBreakpointConfig;
}

/**
 * MasonryLayout component for responsive multi-column layouts.
 * Uses row-major (round-robin) distribution to preserve source order.
 * Items are placed left-to-right across columns, ensuring elements
 * like "More Settings" always appear last in the visual flow.
 */
export const MasonryLayout: React.FC<MasonryLayoutProps> = ({
  children,
  className = '',
  gap,
  containerBreakpoints = CARD_VIEW_COLUMNS,
}) => {
  // Responsive grid margins derived from visual settings (compact/comfortable)
  const gridMargins = useGridMargins();
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const childArray = useMemo(
    () => React.Children.toArray(children).filter(Boolean),
    [children]
  );

  // Calculate columns based on container width
  const getColumnCount = useCallback(
    (width: number) => {
      const breakpointEntries = Object.entries(containerBreakpoints)
        .filter(([key]) => key !== 'default')
        .map(([key, value]) => ({ breakpoint: Number(key), columns: value }))
        .sort((a, b) => b.breakpoint - a.breakpoint);

      for (const entry of breakpointEntries) {
        if (width >= entry.breakpoint) {
          return entry.columns;
        }
      }

      return containerBreakpoints.default;
    },
    [containerBreakpoints]
  );

  const preferredColumnCount = getColumnCount(containerWidth);
  const columnCount = useMemo(
    () => Math.max(1, preferredColumnCount),
    [preferredColumnCount]
  );

  // FLICKER DEBUG: log column count changes — a change from N→M redistributes all
  // cards across columns which causes items moving between DOM parents to remount.
  const prevColumnCountRef = useRef(columnCount);
  useEffect(() => {
    if (prevColumnCountRef.current !== columnCount) {
      logger.debug('[flicker] MasonryLayout columnCount changed', {
        from: prevColumnCountRef.current,
        to: columnCount,
        containerWidth,
      });
      prevColumnCountRef.current = columnCount;
    }
  });

  // Determine responsive gap from grid margins if gap prop not provided
  const getBreakpointKey = useCallback(
    (width: number): 'lg' | 'md' | 'sm' | 'xs' => {
      if (width >= 1024) return 'lg';
      if (width >= 768) return 'md';
      if (width >= 640) return 'sm';
      return 'xs';
    },
    []
  );

  const activeBreakpoint = useMemo(
    () => getBreakpointKey(containerWidth),
    [getBreakpointKey, containerWidth]
  );
  const defaultGapPx = useMemo(
    () => gridMargins?.[activeBreakpoint]?.[0] ?? 16,
    [gridMargins, activeBreakpoint]
  );
  const gapCssValue = useMemo(
    () =>
      typeof gap === 'number'
        ? `${gap}px`
        : typeof gap === 'string'
          ? gap
          : `${defaultGapPx}px`,
    [gap, defaultGapPx]
  );

  // Use ResizeObserver to track container width changes.
  // useLayoutEffect (not useEffect) ensures the initial width is measured
  // synchronously before the browser paints, preventing a visible flash where
  // all cards first render in 1 column then jump to the correct column count.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(container.getBoundingClientRect().width);
    };

    // Set initial width synchronously — no intermediate 1-column paint
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Use row-major (round-robin) distribution to preserve source order.
  // Items are placed left-to-right across columns in sequence.
  // This ensures items like "More Settings" always appear last.
  const orderedChildArray = useMemo(() => {
    // Always return column structure for consistent rendering
    const columns: Array<{ items: React.ReactNode[] }> = Array.from(
      { length: columnCount },
      () => ({ items: [] })
    );

    if (childArray.length === 0) {
      return columns;
    }

    // Distribute children in round-robin fashion (item 0 -> col 0, item 1 -> col 1, etc.)
    for (let index = 0; index < childArray.length; index += 1) {
      const columnIndex = index % columnCount;
      columns[columnIndex].items.push(childArray[index]);
    }

    return columns;
  }, [childArray, columnCount]);

  return (
    <div ref={containerRef} className={`@container w-full ${className}`.trim()}>
      <div
        className="masonry-grid"
        style={
          {
            '--gap': gapCssValue,
          } as React.CSSProperties & {
            '--gap': string;
          }
        }
      >
        {orderedChildArray.map((col, idx) => (
          <div key={idx} className="masonry-grid-column">
            {col.items.map((node, nodeIndex) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <React.Fragment key={(node as any)?.key ?? `${idx}-${nodeIndex}`}>
                {node}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasonryLayout;
