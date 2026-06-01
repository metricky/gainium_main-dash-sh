/**
 * Font Size Utility Hooks
 *
 * These hooks provide convenient access to the dynamic font sizing system throughout the application.
 * They automatically integrate with the visual settings store to provide reactive font size values.
 *
 * The font sizing system is based on a CSS variable (--base-font-size) that scales all Tailwind
 * font size classes (text-xs, text-sm, text-lg, etc.) proportionally.
 */

import { useVisualSettingsStore } from '@/stores/visualSettingsStore';
import { useMemo } from 'react';

/**
 * Hook to get the current base font size
 *
 * @returns The current base font size in pixels (range: 10-24px, default: 14px)
 *
 * @example
 * const fontSize = useFontSize();
 * logger.info(fontSize); // 14
 */
export const useFontSize = (): number => {
  return useVisualSettingsStore((state) => state.fontSize);
};

/**
 * Hook to get calculated font sizes based on current base
 *
 * Returns an object with all standard font size scales relative to the base font size.
 * These match the Tailwind multipliers for consistent visual hierarchy.
 *
 * @returns Object mapping font size keys to their computed pixel values
 *
 * @example
 * const sizes = useFontSizes();
 * logger.info(sizes.sm); // 12.25 (if base is 14px)
 * logger.info(sizes.lg); // 15.75 (if base is 14px)
 */
export const useFontSizes = () => {
  const fontSize = useFontSize();

  return useMemo(
    () => ({
      xs: fontSize * 0.75,
      sm: fontSize * 0.875,
      base: fontSize,
      lg: fontSize * 1.125,
      xl: fontSize * 1.25,
      '2xl': fontSize * 1.5,
      '3xl': fontSize * 1.875,
      '4xl': fontSize * 2.25,
      '5xl': fontSize * 3,
      '6xl': fontSize * 3.75,
      '7xl': fontSize * 4.5,
      '8xl': fontSize * 6,
      '9xl': fontSize * 8,
    }),
    [fontSize]
  );
};

/**
 * Hook to get a specific font size multiplier value
 *
 * Useful for dynamic calculations, canvas rendering, or third-party components
 * that need font size values programmatically.
 *
 * @param multiplier - The multiplier to apply to the base font size
 * @returns The computed font size in pixels
 *
 * @example
 * const smallSize = useFontSizeValue(0.875); // text-sm multiplier
 * const largeSize = useFontSizeValue(1.5); // text-2xl multiplier
 */
export const useFontSizeValue = (multiplier: number): number => {
  const fontSize = useFontSize();
  return useMemo(() => fontSize * multiplier, [fontSize, multiplier]);
};

/**
 * Hook to check if font size is at minimum (10px)
 *
 * Useful for disabling font size decrease buttons in UI
 *
 * @returns boolean - True if at minimum font size
 *
 * @example
 * const isMin = useIsMinFontSize();
 * <button disabled={isMin}>-</button>
 */
export const useIsMinFontSize = (): boolean => {
  return useVisualSettingsStore((state) => state.fontSize <= 10);
};

/**
 * Hook to check if font size is at maximum (24px)
 *
 * Useful for disabling font size increase buttons in UI
 *
 * @returns boolean - True if at maximum font size
 *
 * @example
 * const isMax = useIsMaxFontSize();
 * <button disabled={isMax}>+</button>
 */
export const useIsMaxFontSize = (): boolean => {
  return useVisualSettingsStore((state) => state.fontSize >= 24);
};

/**
 * Hook to get all standard font size scales as an object
 *
 * Similar to useFontSizes but uses standard Tailwind class names as keys.
 *
 * @returns Object mapping Tailwind size names to pixel values
 *
 * @example
 * const map = useFontSizeMap();
 * // Returns: { xs: 10.5, sm: 12.25, base: 14, lg: 15.75, ... }
 */
export const useFontSizeMap = () => {
  return useFontSizes();
};

/**
 * Hook to check if font size is at default value (14px)
 *
 * Useful for showing "reset" buttons or indicators
 *
 * @returns boolean - True if at default font size
 *
 * @example
 * const isDefault = useIsDefaultFontSize();
 * <button onClick={resetFontSize} disabled={isDefault}>Reset</button>
 */
export const useIsDefaultFontSize = (): boolean => {
  return useVisualSettingsStore((state) => state.fontSize === 14);
};

/**
 * Hook for components that need font size utility functions
 *
 * Provides a convenient interface for working with font sizes programmatically.
 *
 * @returns Object with utility functions for font size calculations
 *
 * @example
 * const { getValue, getAll, isMin, isMax } = useFontSizeUtils();
 * const smallSize = getValue(0.875);
 * if (!isMax) {
 *   // Can increase font size
 * }
 */
export const useFontSizeUtils = () => {
  const fontSize = useFontSize();
  const sizes = useFontSizes();
  const isMin = useIsMinFontSize();
  const isMax = useIsMaxFontSize();

  return useMemo(
    () => ({
      /**
       * Get current base font size
       */
      getBase: () => fontSize,

      /**
       * Get a specific font size by multiplier
       */
      getValue: (multiplier: number): number => fontSize * multiplier,

      /**
       * Get all font size scales
       */
      getAll: () => sizes,

      /**
       * Get a named font size (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl, 9xl)
       */
      getSize: (sizeKey: keyof typeof sizes): number =>
        sizes[sizeKey] ?? fontSize,

      /**
       * Check if at minimum font size
       */
      isMin,

      /**
       * Check if at maximum font size
       */
      isMax,

      /**
       * Check if at default font size (14px)
       */
      isDefault: fontSize === 14,

      /**
       * Calculate a line height proportionally
       */
      getLineHeight: (multiplier: number): number =>
        fontSize * multiplier * 1.5,

      /**
       * Get font size in rem (for when rem is needed)
       */
      getRem: (): number => fontSize / 16,
    }),
    [fontSize, sizes, isMin, isMax]
  );
};

/**
 * Hook to get Tailwind-compatible CSS for elements that need hardcoded sizes
 *
 * Some third-party components or edge cases may need hardcoded font sizes.
 * This hook generates the proper CSS based on the current base font size.
 *
 * @returns Object with CSS-ready values
 *
 * @example
 * const css = useFontSizeCSS();
 * <span style={{ fontSize: css.sm }}>Small text</span>
 */
export const useFontSizeCSS = () => {
  const sizes = useFontSizes();

  return useMemo(
    () => ({
      xs: `${sizes.xs}px`,
      sm: `${sizes.sm}px`,
      base: `${sizes.base}px`,
      lg: `${sizes.lg}px`,
      xl: `${sizes.xl}px`,
      '2xl': `${sizes['2xl']}px`,
      '3xl': `${sizes['3xl']}px`,
      '4xl': `${sizes['4xl']}px`,
      '5xl': `${sizes['5xl']}px`,
      '6xl': `${sizes['6xl']}px`,
      '7xl': `${sizes['7xl']}px`,
      '8xl': `${sizes['8xl']}px`,
      '9xl': `${sizes['9xl']}px`,
    }),
    [sizes]
  );
};
