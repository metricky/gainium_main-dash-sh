import type { SavedLayout } from '../types/layout';
import {
  getEnhancedScreenSize,
  getScreenSizeWithBreakpoint,
} from '../utils/screenSize';

/**
 * Enhanced layout utility functions for consistent screen size handling
 */

/**
 * Get enhanced screen size information for the current layout context
 * Returns both resolution and breakpoint data
 */
export function getCurrentLayoutInfo() {
  return getEnhancedScreenSize();
}

/**
 * Get formatted string with both resolution and breakpoint for display
 */
export function getFormattedScreenInfo() {
  return getScreenSizeWithBreakpoint();
}

/**
 * Get display string for a saved layout with enhanced information when available
 * Falls back to legacy screenSize if screenInfo is not available
 */
export function getLayoutDisplayInfo<T>(layout: SavedLayout<T>): string {
  if (layout.screenInfo) {
    return `${layout.screenInfo.resolution} [${layout.screenInfo.breakpoint}]`;
  }

  if (layout.screenSize) {
    // Extract just the resolution part from legacy format
    const resolutionMatch = layout.screenSize.match(/(\d+×\d+)/);
    return resolutionMatch ? resolutionMatch[1] : layout.screenSize;
  }

  return 'Unknown screen size';
}

/**
 * Check if a saved layout is compatible with current screen breakpoint
 */
export function isLayoutCompatible<T>(layout: SavedLayout<T>): boolean {
  const currentInfo = getCurrentLayoutInfo();

  // If we have enhanced screen info, compare breakpoints
  if (layout.screenInfo) {
    return layout.screenInfo.breakpoint === currentInfo.breakpoint;
  }

  // Legacy fallback - assume compatible if no enhanced info
  return true;
}

/**
 * Get breakpoint from saved layout (enhanced or legacy)
 */
export function getLayoutBreakpoint<T>(layout: SavedLayout<T>): string | null {
  if (layout.screenInfo) {
    return layout.screenInfo.breakpoint;
  }

  // Try to guess from legacy screenSize - this is less reliable
  if (layout.screenSize) {
    const widthMatch = layout.screenSize.match(/(\d+)×/);
    if (widthMatch) {
      const width = parseInt(widthMatch[1], 10);
      if (width >= 1200) return 'lg';
      if (width >= 996) return 'md';
      if (width >= 768) return 'sm';
      if (width >= 480) return 'xs';
      return 'xxs';
    }
  }

  return null;
}
