import { getCurrentBreakpoint } from '../components/widgets/DefaultWidgetSizes';
import type { LayoutScreenInfo } from '../types/layout';

// Get comprehensive screen size information for layout saving
export function getEnhancedScreenSize(): LayoutScreenInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const breakpoint = getCurrentBreakpoint(width);

  let category: string;

  // Define screen size categories
  if (width >= 1920) {
    category = 'Desktop XL';
  } else if (width >= 1440) {
    category = 'Desktop L';
  } else if (width >= 1200) {
    category = 'Desktop';
  } else if (width >= 996) {
    category = 'Tablet L';
  } else if (width >= 768) {
    category = 'Tablet';
  } else if (width >= 480) {
    category = 'Mobile L';
  } else {
    category = 'Mobile';
  }

  return {
    resolution: `${width}×${height}`,
    breakpoint,
    category,
    width,
    height,
  };
}

// Get screen size information for layout saving (backward compatibility)
export function getScreenSize(): string {
  const info = getEnhancedScreenSize();
  return `${info.resolution} (${info.category})`;
}

// Get enhanced screen size as a formatted string with both resolution and breakpoint
export function getScreenSizeWithBreakpoint(): string {
  const info = getEnhancedScreenSize();
  return `${info.resolution} (${info.category}) [${info.breakpoint}]`;
}

// Get a short screen size label for compact display
export function getScreenSizeLabel(): string {
  const width = window.innerWidth;

  if (width >= 1920) {
    return 'XL';
  } else if (width >= 1440) {
    return 'L';
  } else if (width >= 1200) {
    return 'D';
  } else if (width >= 996) {
    return 'TL';
  } else if (width >= 768) {
    return 'T';
  } else if (width >= 480) {
    return 'ML';
  } else {
    return 'M';
  }
}
