import type { User } from '@/types/auth';
import { jwtDecode } from 'jwt-decode';
import { GraphQLClient } from './api/GraphQLClient';
import { GraphQlQuery } from './api';
// import { logger } from './loggerInstance';

// Mock logger to replace removed logger calls
const logger = {
  debug: (..._args: unknown[]) => {},
  info: (..._args: unknown[]) => {},
  warn: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
};

// GraphQL endpoint for authentication
const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_API_ENDPOINT || 'https://api.gainium.io';

// Create dedicated auth GraphQL client
// Gainium API doesn't use /graphql suffix - it's just the base
const authGraphQLClient = new GraphQLClient(GRAPHQL_ENDPOINT);

interface GainiumAuthResponse {
  status: string;
  reason?: string;
  data?: {
    token: string;
    isOTP: boolean;
    shouldOnBoard: boolean;
    shouldOnBoardExchange: boolean;
  };
}

interface GainiumUserResponse {
  status: string;
  reason?: string;
  data?: Omit<User, 'email' | 'id'> & { username: string; _id: string };
}

interface OTPRequiredError extends Error {
  temporaryToken: string;
}

/**
 * Real authentication service that connects to Gainium's GraphQL API
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RealAuthService {
  /**
   * Login with email/password using GraphQL token mutation
   */
  static async loginWithPassword(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    user: User;
  }> {
    try {
      logger.info('Attempting password login', { email });

      // Use the token mutation to authenticate
      const mutation = `
        mutation token($input: tokenInput!) {
          token(input: $input) {
            status
            reason
            data {
              token
              isOTP
              shouldOnBoard
              shouldOnBoardExchange
            }
          }
        }
      `;

      const response = await authGraphQLClient.request<{
        token: GainiumAuthResponse;
      }>(mutation, { input: { username: email, password } });

      // Debug logging to see what the API returns
      logger.info('Auth API response:', {
        status: response.token.status,
        reason: response.token.reason,
        hasToken: !!response.token.data?.token,
        hasData: !!response.token.data,
      });

      if (response.token.status !== 'OK' || !response.token.data?.token) {
        throw new Error(response.token.reason || 'Authentication failed');
      }

      const { token } = response.token.data;

      // If OTP is required, throw a special error that includes the temp token
      if (response.token.data.isOTP) {
        const otpError = new Error('OTP_REQUIRED') as OTPRequiredError;
        otpError.temporaryToken = token;
        throw otpError;
      }

      // Get user information using the token
      const user = await this.getUserInfo(token);

      logger.info('Password login successful', { userId: user.id });

      return {
        accessToken: token,
        user,
      };
    } catch (error) {
      logger.error('Password login failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Login with Google OAuth using GraphQL oauth mutation
   */
  static async loginWithGoogle(googleToken: string): Promise<{
    accessToken: string;
    user: User;
  }> {
    try {
      logger.info('Attempting Google OAuth login');

      // Get user timezone (default to UTC)
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

      // Use the oauth mutation to authenticate with Google
      const mutation = `
        mutation oauth($input: oauthInput!) {
          oauth(input: $input) {
            status
            reason
            data {
              token
              isOTP
              shouldOnBoard
              shouldOnBoardExchange
            }
          }
        }
      `;

      const response = await authGraphQLClient.request<{
        oauth: GainiumAuthResponse;
      }>(mutation, {
        input: {
          type: 'google',
          token: googleToken,
          timezone,
        },
      });

      if (response.oauth.status !== 'OK' || !response.oauth.data?.token) {
        throw new Error(
          response.oauth.reason || 'Google authentication failed'
        );
      }

      const { token } = response.oauth.data;

      // If OTP is required, throw a special error that includes the temp token
      if (response.oauth.data.isOTP) {
        const otpError = new Error('OTP_REQUIRED') as OTPRequiredError;
        otpError.temporaryToken = token;
        throw otpError;
      }

      // Get user information using the token
      const user = await this.getUserInfo(token);

      logger.info('Google login successful', { userId: user.id });

      return {
        accessToken: token,
        user,
      };
    } catch (error) {
      logger.error('Google login failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get user information using an authenticated token
   */
  static async getUserInfo(token: string): Promise<User> {
    try {
      // Create authenticated GraphQL client
      const authenticatedClient = new GraphQLClient(GRAPHQL_ENDPOINT, token);

      const response = await authenticatedClient.request<{
        user: GainiumUserResponse;
      }>(GraphQlQuery.user().query);

      if (response.user.status !== 'OK' || !response.user.data) {
        throw new Error(
          response.user.reason || 'Failed to get user information'
        );
      }

      const userData = response.user.data;

      // Convert Gainium user to our User type
      const user: User = {
        ...userData,
        id: userData._id,
        email: userData.username,
      };

      return user;
    } catch (error) {
      logger.error('Failed to get user info', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Logout user using GraphQL deleteToken mutation
   */
  static async logout(token: string): Promise<void> {
    try {
      logger.info('Attempting logout');

      // Create authenticated GraphQL client
      const authenticatedClient = new GraphQLClient(GRAPHQL_ENDPOINT, token);

      // Use deleteToken mutation to logout
      const mutation = `
        mutation deleteToken {
          deleteToken {
            status
            reason
          }
        }
      `;

      const response = await authenticatedClient.request<{
        deleteToken: { status: string; reason?: string };
      }>(mutation);

      if (response.deleteToken.status !== 'OK') {
        throw new Error(response.deleteToken.reason || 'Logout failed');
      }

      logger.info('Logout successful');
    } catch (error) {
      logger.warn('Logout failed, clearing local state anyway', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue with logout even if API call fails
    }
  }

  /**
   * Validate if a token is still valid by making an authenticated request
   */
  static async validateToken(token: string): Promise<User | null> {
    try {
      // Try to get user info - if it succeeds, token is valid
      return await this.getUserInfo(token);
    } catch (error) {
      logger.debug('Token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Check if a JWT token is expired (client-side check)
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const now = Date.now() / 1000;
      // Add 30 second buffer
      return now >= decoded.exp - 30;
    } catch (error) {
      logger.debug('Failed to decode token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return true;
    }
  }

  /**
   * Check whether at least one user exists on the backend.
   * Used by the Login page to decide between login and first-install register.
   */
  static async checkUserExist(): Promise<boolean> {
    const query = `
      query checkUserExist {
        checkUserExist {
          status
          reason
          data
        }
      }
    `;
    const response = await authGraphQLClient.request<{
      checkUserExist: { status: string; reason?: string; data?: boolean };
    }>(query);

    if (response.checkUserExist.status !== 'OK') {
      throw new Error(
        response.checkUserExist.reason || 'Failed to check user existence'
      );
    }
    return !!response.checkUserExist.data;
  }

  /**
   * Register a first-install account. Returns the auth token + onboarding
   * flags on success.
   */
  static async registerAccount(input: {
    email: string;
    password: string;
    licenseKey: string;
    timezone: string;
    name?: string;
    lastName?: string;
    picture?: string;
    weekStart?: 'm' | 's';
  }): Promise<{ accessToken: string; user: User }> {
    const mutation = `
      mutation registerAccount($input: registerAccountInput!) {
        registerAccount(input: $input) {
          status
          reason
          data {
            token
            shouldOnBoard
            shouldOnBoardExchange
          }
        }
      }
    `;
    const response = await authGraphQLClient.request<{
      registerAccount: {
        status: string;
        reason?: string;
        data?: { token: string };
      };
    }>(mutation, { input });

    if (
      response.registerAccount.status !== 'OK' ||
      !response.registerAccount.data?.token
    ) {
      throw new Error(response.registerAccount.reason || 'Registration failed');
    }

    const { token } = response.registerAccount.data;
    const user = await this.getUserInfo(token);
    return { accessToken: token, user };
  }

  /**
   * Handle OTP validation for users with 2FA enabled
   */
  static async validateOTP(otpToken: string): Promise<{
    accessToken: string;
    user: User;
  }> {
    try {
      logger.info('Attempting OTP validation');

      const mutation = `
        mutation validateOTP($input: validateOTPInput!) {
          validateOTP(input: $input) {
            status
            reason
            data {
              token
              isOTP
            }
          }
        }
      `;

      const response = await authGraphQLClient.request<{
        validateOTP: GainiumAuthResponse;
      }>(mutation, { input: { otpToken } });

      if (
        response.validateOTP.status !== 'OK' ||
        !response.validateOTP.data?.token
      ) {
        throw new Error(response.validateOTP.reason || 'OTP validation failed');
      }

      const { token } = response.validateOTP.data;

      // Get user information
      const user = await this.getUserInfo(token);

      logger.info('OTP validation successful', { userId: user.id });

      return {
        accessToken: token,
        user,
      };
    } catch (error) {
      logger.error('OTP validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

/**
 * Configuration function to enable real authentication
 */
export function enableRealAuthentication() {
  logger.info('Real authentication enabled', {
    endpoint: GRAPHQL_ENDPOINT,
    mode: import.meta.env.MODE,
  });

  return {
    loginWithPassword: RealAuthService.loginWithPassword,
    loginWithGoogle: RealAuthService.loginWithGoogle,
    logout: RealAuthService.logout,
    validateToken: RealAuthService.validateToken,
    validateOTP: RealAuthService.validateOTP,
    getUserInfo: RealAuthService.getUserInfo,
  };
}
