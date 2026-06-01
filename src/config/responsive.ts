export const RESPONSIVE_BREAKPOINTS = {
  xxs: 360,
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type ResponsiveBreakpointKey = keyof typeof RESPONSIVE_BREAKPOINTS;

export type MasonryBreakpointConfig = Record<number | 'default', number>;

export const CARD_VIEW_COLUMNS = {
  default: 1,
  [RESPONSIVE_BREAKPOINTS.sm]: 2,
  [RESPONSIVE_BREAKPOINTS.lg]: 3,
  1200: 4,
} satisfies MasonryBreakpointConfig;
