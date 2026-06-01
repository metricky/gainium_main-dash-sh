/**
 * Color utility functions for converting between hex and HSL formats
 * Used primarily for chart libraries that require HSL format
 */

/**
 * Convert OKLCH color to HSL format for chart libraries that only support HSL
 * @param oklch - OKLCH color string (e.g., 'oklch(0.671 0.182 40.85)')
 * @returns HSL string in format 'hue saturation% lightness%'
 */
export function oklchToHsl(oklch: string): string {
  // For now, we'll use a simplified conversion
  // In production, you might want to use a proper color conversion library
  // This is a placeholder implementation that extracts rough values

  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) {
    return '0 0% 50%'; // fallback
  }

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

  // Simple approximation - in real app, use proper color space conversion
  const lightness = Math.round(l * 100);
  const saturation = Math.round(c * 100);
  const hue = Math.round(h);

  return `${hue} ${saturation}% ${lightness}%`;
}

/**
 * Convert hex color to HSL format
 * @param hex - Hex color string (e.g., '#f97316' or 'f97316')
 * @returns HSL string in format 'hue saturation% lightness%' (e.g., '27 93% 61%')
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h /= 6;
  }

  // Convert to degrees and percentages
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Convert hex color to HSL format for CSS hsl() function
 * @param hex - Hex color string
 * @returns HSL string in format 'hsl(hue, saturation%, lightness%)'
 */
export function hexToHslString(hex: string): string {
  const hsl = hexToHsl(hex);
  return `hsl(${hsl})`;
}

/**
 * Get chart colors in HSL format for chart libraries
 * Reads from CSS custom properties and converts to HSL
 */
export function getChartColorsHsl() {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  // Helper function to convert OKLCH or hex color to HSL
  const convertToHsl = (value: string): string => {
    value = value.trim();
    if (value.startsWith('oklch')) {
      return oklchToHsl(value);
    } else if (value.startsWith('#')) {
      return hexToHsl(value);
    }
    return '0 0% 50%'; // fallback
  };

  return {
    chart1: convertToHsl(computedStyle.getPropertyValue('--color-chart-1')),
    chart2: convertToHsl(computedStyle.getPropertyValue('--color-chart-2')),
    chart3: convertToHsl(computedStyle.getPropertyValue('--color-chart-3')),
    chart4: convertToHsl(computedStyle.getPropertyValue('--color-chart-4')),
    chart5: convertToHsl(computedStyle.getPropertyValue('--color-chart-5')),
    success: convertToHsl(computedStyle.getPropertyValue('--color-success')),
    warning: convertToHsl(computedStyle.getPropertyValue('--color-warning')),
    info: convertToHsl(computedStyle.getPropertyValue('--color-info')),
  };
}

/**
 * Get chart colors in HSL format with hsl() wrapper for direct CSS use
 */
export function getChartColorsHslStrings() {
  const colors = getChartColorsHsl();
  return Object.entries(colors).reduce(
    (acc, [key, value]) => {
      acc[key] = `hsl(${value})`;
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * Create HSL color string for chart libraries from CSS variable
 * @param cssVar - CSS variable name (e.g., '--color-chart-1')
 * @returns HSL string in format 'hue saturation% lightness%'
 */
export function getCssVarAsHsl(cssVar: string): string {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  const colorValue = computedStyle.getPropertyValue(cssVar).trim();

  if (colorValue.startsWith('oklch')) {
    return oklchToHsl(colorValue);
  } else if (colorValue.startsWith('#')) {
    return hexToHsl(colorValue);
  }
  return '0 0% 50%'; // fallback
}

/**
 * Create HSL color string with hsl() wrapper from CSS variable
 * @param cssVar - CSS variable name (e.g., '--color-chart-1')
 * @returns HSL string in format 'hsl(hue, saturation%, lightness%)'
 */
export function getCssVarAsHslString(cssVar: string): string {
  const hsl = getCssVarAsHsl(cssVar);
  return `hsl(${hsl})`;
}
