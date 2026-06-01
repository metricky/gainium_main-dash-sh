/**
 * Utility functions for URL handling in manual backtesting
 */

/**
 * Encodes a strategy name for use in a URL path
 * @param name The strategy name to encode
 * @returns URL-encoded strategy name
 */
export function encodeStrategyName(name: string): string {
  return encodeURIComponent(name);
}

/**
 * Decodes a strategy name from a URL path parameter
 * @param encodedName The encoded strategy name from the URL
 * @returns Decoded strategy name
 */
export function decodeStrategyName(encodedName: string): string {
  return decodeURIComponent(encodedName);
}

/**
 * Generates a manual backtesting strategy detail URL
 * @param strategyName The strategy name
 * @returns The URL path for the strategy detail page
 */
export function getRulebookDetailUrl(strategyName: string): string {
  return `/rulebooks/${encodeStrategyName(strategyName)}`;
}

/**
 * Generates a manual backtesting session URL
 * @param sessionId The session ID
 * @returns The URL path for the session page
 */
export function getSessionUrl(sessionId: string): string {
  return `/manual-backtesting/session/${sessionId}`;
}
