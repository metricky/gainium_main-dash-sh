/**
 * GraphQL Client Helper Utilities
 *
 * Provides utility functions for creating GraphQL clients with proper
 * authentication and paper context handling, including demo mode support.
 */

import { useUIStore } from '@/stores/uiStore';
import type { AuthTokens } from '@/types/auth';

/**
 * Get the token and paperContext for GraphQL requests based on current mode
 *
 * In demo mode, this returns 'demo' as the token and true for paperContext,
 * matching the main-dash implementation. This allows the backend to recognize
 * the demo mode and return appropriate demo data.
 *
 * @param tokens - The current auth tokens (if authenticated)
 * @param isLiveTrading - Whether the user is in live trading mode
 * @returns Object with token and paperContext to use for GraphQL requests
 */
export function getGraphQLConfig(
  tokens: AuthTokens | null,
  isLiveTrading: boolean
): { token: string | undefined; paperContext: boolean } {
  const { tradingMode } = useUIStore.getState();
  const isDemoMode = tradingMode === 'demo';

  if (isDemoMode) {
    // Demo mode: use 'demo' as special token and set paperContext to true
    // Backend recognizes 'demo' token and returns demo data
    return {
      token: 'demo',
      paperContext: true,
    };
  }

  // Regular mode: use actual token and paperContext based on trading mode
  return {
    token: tokens?.accessToken,
    paperContext: !isLiveTrading,
  };
}

/**
 * Get the token and paperContext with optional override
 *
 * @param tokens - The current auth tokens (if authenticated)
 * @param isLiveTrading - Whether the user is in live trading mode
 * @param paperContextOverride - Optional override for paperContext
 * @returns Object with token and paperContext to use for GraphQL requests
 */
export function getGraphQLConfigWithOverride(
  tokens: AuthTokens | null,
  isLiveTrading: boolean,
  paperContextOverride?: boolean
): { token: string | undefined; paperContext: boolean } {
  const config = getGraphQLConfig(tokens, isLiveTrading);

  // Override paperContext if provided (but not in demo mode)
  if (paperContextOverride !== undefined && config.token !== 'demo') {
    config.paperContext = paperContextOverride;
  }

  return config;
}
