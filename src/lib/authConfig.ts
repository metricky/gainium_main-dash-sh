/**
 * Authentication Configuration
 *
 * This file allows you to easily switch between mock and real authentication
 * without changing code throughout the application.
 */

// import { logger } from './loggerInstance';

// Mock logger to replace removed logger calls
const logger = {
  debug: (..._args: unknown[]) => {},
  info: (..._args: unknown[]) => {},
  warn: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
};

export interface AuthConfig {
  useRealAuth: boolean;
  apiEndpoint: string;
  graphqlEndpoint: string;
  mockApiEnabled: boolean;
}

/**
 * Get current authentication configuration
 */
export function getAuthConfig(): AuthConfig {
  const mode = import.meta.env.MODE;
  const useRealAuth = import.meta.env.VITE_USE_REAL_AUTH === 'true';
  const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

  // Determine authentication mode
  const shouldUseRealAuth = mode === 'production' || useRealAuth;
  const shouldUseMockAuth =
    mode === 'development' && useMockAuth && !useRealAuth;

  // Force production API endpoint when real auth is enabled
  // This ensures frontend never accidentally queries localhost in real mode
  const apiEndpoint = shouldUseRealAuth
    ? import.meta.env.VITE_API_ENDPOINT || 'https://api.gainium.io'
    : import.meta.env.VITE_API_ENDPOINT || 'http://localhost:7500';

  return {
    useRealAuth: shouldUseRealAuth,
    apiEndpoint,
    graphqlEndpoint: shouldUseRealAuth
      ? `${apiEndpoint}/graphql`
      : 'http://localhost:7500/graphql',
    mockApiEnabled: shouldUseMockAuth,
  };
}

/**
 * Check if we should use real authentication
 */
export function useRealAuthentication(): boolean {
  return getAuthConfig().useRealAuth;
}

/**
 * Check if we should use mock authentication
 */
export function useMockAuthentication(): boolean {
  return getAuthConfig().mockApiEnabled;
}

/**
 * Get the appropriate GraphQL endpoint
 */
export function getGraphQLEndpoint(): string {
  return getAuthConfig().graphqlEndpoint;
}

/**
 * Log current authentication configuration
 */
export function logAuthConfig(): void {
  const config = getAuthConfig();
  logger.info('🔐 Authentication Configuration:', {
    mode: import.meta.env.MODE,
    useRealAuth: config.useRealAuth,
    mockApiEnabled: config.mockApiEnabled,
    apiEndpoint: config.apiEndpoint,
    graphqlEndpoint: config.graphqlEndpoint,
  });
}
