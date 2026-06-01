/**
 * Demo Mode Utilities
 *
 * Provides utilities for managing demo mode functionality.
 * Demo mode is activated via URL query parameter: ?mode=demo
 */

import { logger } from '@/lib/loggerInstance';
import { useUIStore } from '@/stores/uiStore';

const DEMO_EXIT_OVERRIDE_KEY = 'gainium-demo-exited';

const readDemoExitOverride = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const value =
      window.localStorage.getItem(DEMO_EXIT_OVERRIDE_KEY) === 'true';
    logger.debug('[demo-dismiss] readDemoExitOverride', { value });
    return value;
  } catch (_error) {
    logger.warn('[demo-dismiss] readDemoExitOverride failed');
    return false;
  }
};

const writeDemoExitOverride = (value: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(DEMO_EXIT_OVERRIDE_KEY, 'true');
    } else {
      window.localStorage.removeItem(DEMO_EXIT_OVERRIDE_KEY);
    }
    logger.info('[demo-dismiss] writeDemoExitOverride', { value });
  } catch (_error) {
    // Ignore storage failures (private mode, etc.)
    logger.warn('[demo-dismiss] writeDemoExitOverride failed');
  }
};

/**
 * Get the current mode from URL parameters
 */
export function getMode(): 'normal' | 'demo' {
  if (typeof window === 'undefined') return 'normal';

  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'demo' ? 'demo' : 'normal';
}

/**
 * Check if the app is in demo mode (non-reactive)
 * For use in non-component code
 */
export function isDemoMode(): boolean {
  // Check the UI store for the trading mode
  if (typeof window !== 'undefined') {
    try {
      const tradingMode = useUIStore.getState().tradingMode;
      return tradingMode === 'demo';
    } catch {
      // Fallback to URL check if store is not available
      return getMode() === 'demo';
    }
  }
  return false;
}

/**
 * Returns true when the user has explicitly exited demo mode locally.
 * Prevents subsequent automatic demo re-entry when the backend profile
 * still marks the account as demo-capable.
 */
export function hasExitedDemoModeLocally(): boolean {
  return readDemoExitOverride();
}

/**
 * Persists a flag indicating whether the user chose to leave demo mode.
 */
export function setDemoModeExitOverride(exited: boolean): void {
  writeDemoExitOverride(exited);
}

/**
 * Check if the app is in read-only mode (demo mode) - non-reactive
 * For use in components, prefer useIsReadOnly() hook for reactive updates
 */
export function isReadOnly(): boolean {
  return isDemoMode();
}

/**
 * Hook to check if the app is in read-only mode (demo mode) - reactive
 * Use this in React components for automatic updates
 */
export function useIsReadOnly(): boolean {
  const tradingMode = useUIStore((state) => state.tradingMode);
  return tradingMode === 'demo';
}

/**
 * Create a navigation link that preserves the current mode
 *
 * @param path - The path to navigate to
 * @returns The path with mode query parameter if in demo mode
 *
 * @example
 * linkTo('/bot') // Returns '/bot' in normal mode
 * linkTo('/bot') // Returns '/bot?mode=demo' in demo mode
 * linkTo('/bot?status=active') // Returns '/bot?status=active&mode=demo' in demo mode
 */
export function linkTo(path: string): string {
  const mode = getMode();

  if (mode === 'normal') {
    return path;
  }

  // Check if path already has query parameters
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}mode=demo`;
}

/**
 * Navigate to a path while preserving the current mode
 *
 * @param path - The path to navigate to
 */
export function navigateTo(path: string): void {
  if (typeof window === 'undefined') return;

  const targetPath = linkTo(path);
  window.location.href = targetPath;
}
