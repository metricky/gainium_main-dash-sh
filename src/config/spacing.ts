/**
 * Centralized Spacing Configuration
 *
 * This module defines the spacing system for the entire application.
 * It provides responsive spacing values that adapt to compact/comfortable modes
 * and utilities for converting between different spacing units.
 *
 * All pixel values are calculated from base Tailwind units:
 * - 1 rem = 16px (Tailwind default)
 * - Conversions: xs = 8px/12px, sm = 12px/16px, md = 16px/24px, lg = 24px/32px, xl = 32px/40px
 */

export type SpacingMode = 'compact' | 'comfortable';
export type SpacingKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spacing values in pixels for each mode.
 * These should match the CSS variables defined in src/index.css
 */
export const SPACING_CONFIG: Record<SpacingMode, Record<SpacingKey, number>> = {
  compact: {
    xs: 8, // 0.5rem
    sm: 12, // 0.75rem
    md: 16, // 1rem
    lg: 24, // 1.5rem
    xl: 32, // 2rem
  },
  comfortable: {
    xs: 12, // 0.75rem
    sm: 16, // 1rem
    md: 24, // 1.5rem
    lg: 32, // 2rem
    xl: 40, // 2.5rem
  },
};

/**
 * Responsive breakpoint spacing values.
 * These are used for components that need different spacing at different breakpoints.
 *
 * Note: react-grid-layout requires margin as [horizontal, vertical] in pixels
 */
export const RESPONSIVE_SPACING_CONFIG: Record<
  SpacingMode,
  Record<string, [number, number]>
> = {
  compact: {
    lg: [8, 8], // Desktop: xs spacing (more compact)
    md: [8, 8], // Tablet: xs spacing (more compact)
    sm: [6, 6], // Mobile: xxs spacing
    xs: [6, 6], // Very small: xxs spacing
  },
  comfortable: {
    lg: [16, 16], // Desktop: sm spacing
    md: [16, 16], // Tablet: sm spacing
    sm: [12, 12], // Mobile: xs spacing
    xs: [12, 12], // Very small: xs spacing
  },
};

/**
 * Get the spacing value for a given mode and key
 * @param mode - The spacing mode ('compact' or 'comfortable')
 * @param key - The spacing key ('xs', 'sm', 'md', 'lg', 'xl')
 * @returns The spacing value in pixels
 */
export const getSpacingValue = (mode: SpacingMode, key: SpacingKey): number => {
  return SPACING_CONFIG[mode][key];
};

/**
 * Get responsive spacing margins suitable for react-grid-layout
 * @param mode - The spacing mode ('compact' or 'comfortable')
 * @returns Object with responsive margin values for different breakpoints
 */
export const getResponsiveMargins = (
  mode: SpacingMode
): Record<string, [number, number]> => {
  return RESPONSIVE_SPACING_CONFIG[mode];
};

/**
 * Convert spacing configuration to react-grid-layout margin format
 * Returns margin values in [horizontal, vertical] format
 * @param mode - The spacing mode
 * @returns Object suitable for react-grid-layout margin prop
 */
export const convertToGridMargin = (
  mode: SpacingMode
): Record<string, [number, number]> => {
  return RESPONSIVE_SPACING_CONFIG[mode];
};

/**
 * Get all spacing values for a given mode
 * Useful for components that need the entire spacing object
 * @param mode - The spacing mode
 * @returns Object containing all spacing values
 */
export const getSpacingForMode = (mode: SpacingMode) => {
  return SPACING_CONFIG[mode];
};

/**
 * Convert pixel value to the nearest spacing token
 * Useful when working with legacy pixel-based spacing
 * @param pixels - The pixel value
 * @param mode - The spacing mode
 * @returns The nearest spacing key
 */
export const pixelToSpacingToken = (
  pixels: number,
  mode: SpacingMode = 'comfortable'
): SpacingKey => {
  const spacingValues = SPACING_CONFIG[mode];
  const keys: SpacingKey[] = ['xs', 'sm', 'md', 'lg', 'xl'];

  let nearest: SpacingKey = 'md';
  let minDiff = Math.abs(pixels - spacingValues.md);

  for (const key of keys) {
    const diff = Math.abs(pixels - spacingValues[key]);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = key;
    }
  }

  return nearest;
};

/**
 * Create a responsive spacing object with the same value for all breakpoints
 * @param mode - The spacing mode
 * @param key - The spacing key to use for all breakpoints
 * @returns Object with breakpoint keys and spacing values
 */
export const createUniformSpacing = (
  mode: SpacingMode,
  key: SpacingKey
): Record<string, number> => {
  const value = SPACING_CONFIG[mode][key];
  return {
    xs: value,
    sm: value,
    md: value,
    lg: value,
  };
};

/**
 * CSS variable names that correspond to spacing tokens
 * Used for Tailwind theme extension
 */
export const SPACING_CSS_VARIABLES: Record<SpacingKey, string> = {
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  lg: 'var(--spacing-lg)',
  xl: 'var(--spacing-xl)',
};
