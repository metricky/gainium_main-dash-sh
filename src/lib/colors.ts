// Design system color constants
// This file centralizes all color definitions for charts, data visualizations, and custom styling

// Design system color constants
// This file centralizes all color definitions for charts, data visualizations, and custom styling
import { getChartColorsHslStrings, getCssVarAsHslString } from './colorUtils';

export const CHART_COLORS = {
  // Primary chart colors for data visualization - using brand theme colors
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',

  // Semantic colors using dedicated semantic variables
  success: 'var(--color-success)', // Green for success states
  warning: 'var(--color-warning)', // Orange/Yellow for warning states
  info: 'var(--color-info)', // Blue for info states
  error: 'var(--color-destructive)', // Red for error states

  // Brand color palette - Using dedicated brand variables
  brandPrimary: 'var(--color-brand-primary)', // Primary brand color (OKLCH)
  brandSecondary: 'var(--color-brand-secondary)', // Secondary brand color (OKLCH)

  // Chart colors - These will be converted to HSL when needed for chart libraries
  chartOrange: 'var(--color-chart-1)', // Chart orange - for charts only
  chartCoral: 'var(--color-chart-2)', // Chart coral - for charts only
  chartBlue: 'var(--color-chart-3)', // Chart blue - for charts only
  chartGreen: 'var(--color-chart-4)', // Chart green - for charts only
  chartYellow: 'var(--color-chart-5)', // Chart yellow - for charts only

  // Asset/Portfolio colors - Chart colors should be used only for actual charts
  orange: 'var(--color-chart-1)', // Brand orange (for charts only)
  coral: 'var(--color-chart-2)', // Coral pink (for charts only)
  pink: 'var(--color-chart-3)', // Complementary pink (for charts only)
  green: 'var(--color-chart-4)', // Success green (for charts only)
  purple: 'var(--color-chart-5)', // Accent purple (for charts only)
  red: 'var(--color-destructive)', // Error red

  // Chart infrastructure colors
  grid: 'var(--color-border)',
  axis: 'var(--color-muted-foreground)',
  stroke: 'var(--color-border)',

  // Transparency variants for overlays and backgrounds
  overlay: {
    light: 'color-mix(in oklch, var(--color-foreground) 10%, transparent)',
    dark: 'color-mix(in oklch, var(--color-background) 10%, transparent)',
  },
} as const;

// Color palette for multi-series charts - Brand-aligned colors
export const CHART_PALETTE = [
  CHART_COLORS.orange,
  CHART_COLORS.coral,
  CHART_COLORS.pink,
  CHART_COLORS.green,
  CHART_COLORS.purple,
  CHART_COLORS.red,
] as const;

// Utility function to get color by index for dynamic chart series
export const getChartColor = (index: number): string => {
  return CHART_PALETTE[index % CHART_PALETTE.length];
};

// CSS custom properties for dynamic theming
export const CSS_CHART_COLORS = {
  '--chart-orange': CHART_COLORS.orange,
  '--chart-coral': CHART_COLORS.coral,
  '--chart-pink': CHART_COLORS.pink,
  '--chart-green': CHART_COLORS.green,
  '--chart-purple': CHART_COLORS.purple,
  '--chart-red': CHART_COLORS.red,
} as const;

// Brand gradient utilities for orange to coral pink theme
export const BRAND_GRADIENTS = {
  // Primary brand gradient (orange to coral)
  primary:
    'linear-gradient(135deg, var(--color-chart-1) 0%, var(--color-chart-2) 100%)',

  // Reverse gradient (coral to orange)
  reverse:
    'linear-gradient(135deg, var(--color-chart-2) 0%, var(--color-chart-1) 100%)',

  // Multi-stop gradient with brand colors
  full: 'linear-gradient(135deg, var(--color-chart-1) 0%, var(--color-primary) 50%, var(--color-chart-2) 100%)',

  // Subtle gradient for backgrounds
  subtle:
    'linear-gradient(135deg, color-mix(in oklch, var(--color-chart-1) 10%, transparent) 0%, color-mix(in oklch, var(--color-chart-2) 10%, transparent) 100%)',
} as const;

// Utility function to get brand gradient CSS
export const getBrandGradient = (
  type: keyof typeof BRAND_GRADIENTS = 'primary'
): string => {
  return BRAND_GRADIENTS[type];
};

/**
 * Get chart colors in HSL format for chart libraries that require HSL
 * This converts the hex colors from CSS variables to HSL format
 */
export const getChartColorsForLibraries = () => {
  return getChartColorsHslStrings();
};

/**
 * Get a specific chart color in HSL format for chart libraries
 * @param colorVar - CSS variable name (e.g., '--chart-1')
 */
export const getChartColorHsl = (colorVar: string): string => {
  return getCssVarAsHslString(colorVar);
};
