/**
 * useMediaQuery Hook
 *
 * A custom hook for responsive design that tracks media query matches.
 * Provides a clean way to conditionally render components or apply styles
 * based on screen size or other media features.
 */

import { useState, useEffect } from 'react';

/**
 * Hook to track media query matches
 *
 * @param query - The media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Hook for common responsive breakpoints
 * Returns an object with boolean values for different screen sizes
 */
export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

  // Additional useful breakpoints
  const isMobileOrTablet = useMediaQuery('(max-width: 1023px)');
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)');

  // Orientation
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');

  // Reduced motion preference
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)'
  );

  // Dark mode preference
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isMobileOrTablet,
    isTabletOrDesktop,
    isPortrait,
    isLandscape,
    prefersReducedMotion,
    prefersDarkMode,
    // Convenience methods
    breakpoint: isMobile
      ? 'mobile'
      : isTablet
        ? 'tablet'
        : isDesktop
          ? 'desktop'
          : 'large',
  } as const;
}

/**
 * Hook for container queries (when supported)
 * Falls back to viewport-based media queries
 */
export function useContainerQuery(
  containerRef: React.RefObject<HTMLElement>,
  query: string
): boolean {
  const [matches, setMatches] = useState(false);
  const fallbackMatches = false; // Simplified for now

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      setMatches(fallbackMatches);
      return undefined;
    }

    // Check for container query support
    if ('container' in document.documentElement.style) {
      // Container queries are supported
      // Note: This is a simplified implementation
      // In practice, you'd need a more sophisticated approach
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          // Parse simple width queries
          const match = query.match(/\(max-width:\s*(\d+)px\)/);
          if (match) {
            const maxWidth = parseInt(match[1], 10);
            setMatches(width <= maxWidth);
          }
        }
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    } else {
      // Fall back to viewport-based media queries
      setMatches(fallbackMatches);
      return undefined;
    }
  }, [containerRef, query, fallbackMatches]);

  return matches;
}
