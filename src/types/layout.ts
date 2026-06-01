import type { Layout } from 'react-grid-layout';
import type { Breakpoint } from '../components/widgets/DefaultWidgetSizes';

/**
 * Enhanced screen size information for layout saving
 * Provides both resolution and breakpoint data
 */
export interface LayoutScreenInfo {
  /** Screen resolution (e.g., "1920×1080") */
  resolution: string;
  /** Breakpoint name (lg, md, sm, xs, xxs) */
  breakpoint: Breakpoint;
  /** Screen category (e.g., "Desktop XL") */
  category: string;
  /** Screen width in pixels */
  width: number;
  /** Screen height in pixels */
  height: number;
}

/**
 * Base interface for saved layouts across all stores
 * Includes enhanced screen information
 */
export interface SavedLayout<T = unknown> {
  /** Layout name */
  name: string;
  /** Grid layout configuration */
  layout: Layout[];
  /** Widget configuration */
  widgets: T[];
  /** Legacy screen size string (for backward compatibility) */
  screenSize?: string;
  /** Enhanced screen size information */
  screenInfo?: LayoutScreenInfo;
}
