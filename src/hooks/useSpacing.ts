/**
 * Spacing Utility Hooks
 *
 * These hooks provide convenient access to the spacing system throughout the application.
 * They automatically integrate with the visual settings store to provide reactive spacing values.
 */

import {
  RESPONSIVE_SPACING_CONFIG,
  SPACING_CONFIG,
  getResponsiveMargins,
  getSpacingForMode,
  getSpacingValue,
  type SpacingKey,
  type SpacingMode,
} from '@/config/spacing';
import { useVisualSettingsStore } from '@/stores/visualSettingsStore';
import { useMemo } from 'react';

/**
 * Hook to get the current spacing values based on visual settings
 *
 * @returns Object containing spacing values for the current mode (xs, sm, md, lg, xl)
 *
 * @example
 * const spacing = useSpacing();
 * logger.info(spacing.sm); // 12 (compact) or 16 (comfortable)
 */
export const useSpacing = () => {
  const mode = useVisualSettingsStore((state) => state.spacing);

  return useMemo(() => getSpacingForMode(mode), [mode]);
};

/**
 * Hook to get responsive spacing margins suitable for react-grid-layout
 *
 * @returns Object with responsive margin values for different breakpoints
 *
 * @example
 * const gridMargin = useResponsiveSpacing();
 * // Returns: { lg: [12, 12], md: [12, 12], sm: [8, 8], xs: [8, 8] }
 */
export const useResponsiveSpacing = () => {
  const mode = useVisualSettingsStore((state) => state.spacing);

  return useMemo(() => getResponsiveMargins(mode), [mode]);
};

/**
 * Hook to get a specific spacing value
 *
 * @param key - The spacing key ('xs', 'sm', 'md', 'lg', 'xl')
 * @returns The spacing value in pixels
 *
 * @example
 * const smallSpacing = useSpacingValue('sm');
 */
export const useSpacingValue = (key: SpacingKey): number => {
  const mode = useVisualSettingsStore((state) => state.spacing);

  return useMemo(() => getSpacingValue(mode, key), [mode, key]);
};

/**
 * Hook to get the current spacing mode
 *
 * @returns The current spacing mode ('compact' or 'comfortable')
 *
 * @example
 * const mode = useSpacingMode();
 * if (mode === 'compact') {
 *   // Do something for compact mode
 * }
 */
export const useSpacingMode = (): SpacingMode => {
  return useVisualSettingsStore((state) => state.spacing);
};

/**
 * Hook to get spacing values as Tailwind-style utility mapping
 *
 * @returns Object mapping Tailwind size names to pixel values
 *
 * @example
 * const spacingMap = useSpacingMap();
 * // Returns: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 } (compact mode)
 */
export const useSpacingMap = () => {
  const spacing = useSpacing();
  return useMemo(
    () => ({
      xs: spacing.xs,
      sm: spacing.sm,
      md: spacing.md,
      lg: spacing.lg,
      xl: spacing.xl,
    }),
    [spacing]
  );
};

/**
 * Hook to check if spacing is in compact mode
 *
 * @returns boolean - True if in compact mode
 *
 * @example
 * const isCompact = useIsCompactSpacing();
 */
export const useIsCompactSpacing = (): boolean => {
  return useVisualSettingsStore((state) => state.spacing === 'compact');
};

/**
 * Hook to get spacing values as grid-layout compatible margin format
 * Converts to [horizontal, vertical] arrays
 *
 * @returns Object with margin values for different breakpoints
 *
 * @example
 * const margins = useGridMargins();
 * // Returns: { lg: [12, 12], md: [12, 12], sm: [8, 8], xs: [8, 8] }
 */
export const useGridMargins = (): Record<string, [number, number]> => {
  const mode = useVisualSettingsStore((state) => state.spacing);

  return useMemo(() => RESPONSIVE_SPACING_CONFIG[mode], [mode]);
};

/**
 * Hook to get all available spacing configurations
 * Useful for components that need to render multiple spacing options
 *
 * @returns Object with both compact and comfortable spacing values
 *
 * @example
 * const { compact, comfortable } = useAllSpacingConfigs();
 */
export const useAllSpacingConfigs = () => {
  return useMemo(
    () => ({
      compact: SPACING_CONFIG.compact,
      comfortable: SPACING_CONFIG.comfortable,
    }),
    []
  );
};

/**
 * Hook for components that conditionally apply spacing based on mode
 *
 * @returns Object with utility functions for conditional spacing
 *
 * @example
 * const { getValue, map } = useSpacingUtils();
 * const smallSize = getValue('sm'); // 12 or 16 depending on mode
 */
export const useSpacingUtils = () => {
  const mode = useVisualSettingsStore((state) => state.spacing);

  return useMemo(
    () => ({
      /**
       * Get a specific spacing value
       */
      getValue: (key: SpacingKey): number => getSpacingValue(mode, key),

      /**
       * Get all spacing values
       */
      getAll: () => getSpacingForMode(mode),

      /**
       * Get responsive margins for grid layout
       */
      getMargins: () => getResponsiveMargins(mode),

      /**
       * Check if in compact mode
       */
      isCompact: mode === 'compact',

      /**
       * Get current mode name
       */
      mode,
    }),
    [mode]
  );
};
