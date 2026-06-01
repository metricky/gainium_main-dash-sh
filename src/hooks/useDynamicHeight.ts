// Dynamic height calculation hook for widgets
// Calculates optimal height based on content and screen size

import { useState, useEffect, useCallback, type RefObject } from 'react';

export interface DynamicHeightConfig {
  // Base height configuration
  minHeight?: number;
  maxHeight?: number;
  baseHeight?: number;

  // Content-based calculations
  headerHeight?: number;
  footerHeight?: number;
  controlsHeight?: number;
  rowHeight?: number;
  maxVisibleRows?: number;

  // Responsive breakpoints
  mobileMaxHeight?: number;
  tabletMaxHeight?: number;
  desktopMaxHeight?: number;

  // Padding and margins
  padding?: number;
  margin?: number;

  // Auto-resize options
  autoResize?: boolean;
  debounceMs?: number;
}

export interface DynamicHeightResult {
  height: string;
  minHeight: string;
  maxHeight: string;
  calculatedHeight: number;
  isResponsive: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

export const useDynamicHeight = (
  config: DynamicHeightConfig,
  dependencies: unknown[] = []
): DynamicHeightResult => {
  const {
    minHeight = 300,
    maxHeight: _maxHeight = 800,
    baseHeight = 400,
    headerHeight = 60,
    footerHeight = 0,
    controlsHeight = 120,
    rowHeight = 48,
    maxVisibleRows = 10,
    mobileMaxHeight = 400,
    tabletMaxHeight = 600,
    desktopMaxHeight = 800,
    padding = 24,
    margin = 16,
    autoResize = true,
    debounceMs = 150,
  } = config;

  const [calculatedHeight, setCalculatedHeight] = useState(baseHeight);
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop'
  );

  // Calculate responsive breakpoint
  const updateBreakpoint = useCallback(() => {
    const width = window.innerWidth;
    if (width < 768) {
      setBreakpoint('mobile');
    } else if (width < 1024) {
      setBreakpoint('tablet');
    } else {
      setBreakpoint('desktop');
    }
  }, []);

  // Calculate optimal height based on content and screen size
  const calculateHeight = useCallback(() => {
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;

    // Get responsive max height
    let responsiveMaxHeight = desktopMaxHeight;
    if (screenWidth < 768) {
      responsiveMaxHeight = mobileMaxHeight;
    } else if (screenWidth < 1024) {
      responsiveMaxHeight = tabletMaxHeight;
    }

    // Calculate content-based height
    const fixedHeight =
      headerHeight + footerHeight + controlsHeight + padding * 2 + margin * 2;
    const availableHeight = screenHeight * 0.7; // Use 70% of screen height as max
    const contentBasedHeight = fixedHeight + maxVisibleRows * rowHeight;

    // Calculate final height
    let finalHeight = Math.min(
      Math.max(minHeight, contentBasedHeight),
      Math.min(responsiveMaxHeight, availableHeight)
    );

    // Ensure minimum height on mobile
    if (screenWidth < 768) {
      finalHeight = Math.max(finalHeight, 350);
    }

    setCalculatedHeight(finalHeight);
  }, [
    minHeight,
    headerHeight,
    footerHeight,
    controlsHeight,
    rowHeight,
    maxVisibleRows,
    mobileMaxHeight,
    tabletMaxHeight,
    desktopMaxHeight,
    padding,
    margin,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...dependencies,
  ]);

  // Debounced resize handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateBreakpoint();
        if (autoResize) {
          calculateHeight();
        }
      }, debounceMs);
    };

    // Initial calculation
    updateBreakpoint();
    calculateHeight();

    if (autoResize) {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (autoResize) {
        window.removeEventListener('resize', handleResize);
      }
      clearTimeout(timeoutId);
    };
  }, [updateBreakpoint, calculateHeight, autoResize, debounceMs]);

  // Recalculate when dependencies change
  useEffect(() => {
    calculateHeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Get responsive max height for current breakpoint
  const getResponsiveMaxHeight = () => {
    switch (breakpoint) {
      case 'mobile':
        return mobileMaxHeight;
      case 'tablet':
        return tabletMaxHeight;
      default:
        return desktopMaxHeight;
    }
  };

  return {
    height: `${calculatedHeight}px`,
    minHeight: `${minHeight}px`,
    maxHeight: `${getResponsiveMaxHeight()}px`,
    calculatedHeight,
    isResponsive: autoResize,
    breakpoint,
  };
};

// Hook for content-aware height calculation
export const useContentAwareHeight = (
  containerRef: RefObject<HTMLElement>,
  config: Omit<DynamicHeightConfig, 'maxVisibleRows'> & {
    itemCount?: number;
    itemHeight?: number;
  }
): DynamicHeightResult => {
  const { itemCount = 0, itemHeight = 48, ...restConfig } = config;

  // Calculate max visible rows based on item count
  const maxVisibleRows = Math.min(itemCount, 15); // Cap at 15 rows for performance

  return useDynamicHeight(
    {
      ...restConfig,
      maxVisibleRows,
      rowHeight: itemHeight,
    },
    [itemCount, itemHeight]
  );
};

// Preset configurations for common widget types
export const HEIGHT_PRESETS = {
  portfolioBalances: {
    minHeight: 400,
    maxHeight: 800,
    baseHeight: 500,
    headerHeight: 60,
    controlsHeight: 140, // Search + filters + controls
    rowHeight: 56, // Enhanced balance table row height
    maxVisibleRows: 12,
    mobileMaxHeight: 500,
    tabletMaxHeight: 650,
    desktopMaxHeight: 800,
    padding: 16,
    autoResize: true,
  },

  portfolioAnalysis: {
    minHeight: 300,
    maxHeight: 600,
    baseHeight: 400,
    headerHeight: 60,
    controlsHeight: 80,
    mobileMaxHeight: 350,
    tabletMaxHeight: 450,
    desktopMaxHeight: 600,
    padding: 16,
    autoResize: true,
  },

  compactWidget: {
    minHeight: 200,
    maxHeight: 400,
    baseHeight: 250,
    headerHeight: 40,
    controlsHeight: 40,
    mobileMaxHeight: 250,
    tabletMaxHeight: 300,
    desktopMaxHeight: 400,
    padding: 12,
    autoResize: true,
  },
} as const;

export type HeightPreset = keyof typeof HEIGHT_PRESETS;
