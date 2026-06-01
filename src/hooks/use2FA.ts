import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GraphQLClient, type ReturnResult } from '@/lib/api';
import GraphQlQuery from '@/lib/api/GraphQLQueries';
import { useAuthStore } from '@/stores/authStore';

import { logger } from '@/lib/loggerInstance';

export interface OTPGenerateResponse {
  otp_base32: string;
  otp_auth_url: string;
}

export interface OTPVerifyInput {
  otpToken: string;
}

export interface OTPVerifyResponse {
  recoveryCodes: string[];
}

/**
 * Hook for generating OTP (2FA setup)
 */
export function useGenerateOTP() {
  const { tokens } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      // ✅ Use paper context like old dashboard for consistency
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      const { query } = GraphQlQuery.generateOTP();

      logger.info('Generating OTP for 2FA setup');

      const result = await client.request<{
        generateOTP: ReturnResult<OTPGenerateResponse>;
      }>(query);

      if (result.generateOTP.status !== 'OK') {
        throw new Error(result.generateOTP.reason || 'Failed to generate OTP');
      }

      return result.generateOTP.data;
    },
    onSuccess: () => {
      logger.info('OTP generated successfully');
    },
    onError: (error) => {
      logger.error('Failed to generate OTP', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Hook for verifying OTP (completing 2FA setup)
 */
export function useVerifyOTP() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OTPVerifyInput) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      // ✅ Use paper context like old dashboard for consistency
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      const { query, variables } = GraphQlQuery.verifyOTP(input);

      logger.info('Verifying OTP token');

      const result = await client.request<{
        verifyOTP: ReturnResult<OTPVerifyResponse>;
      }>(query, variables);

      if (result.verifyOTP.status !== 'OK') {
        throw new Error(result.verifyOTP.reason || 'Failed to verify OTP');
      }

      return result.verifyOTP.data;
    },
    onSuccess: (data) => {
      logger.info('OTP verified successfully', {
        recoveryCodesCount: data?.recoveryCodes?.length,
      });

      // ✅ Invalidate all user-related queries following old dashboard pattern
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
    },
    onError: (error) => {
      logger.error('Failed to verify OTP', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Hook for disabling 2FA
 */
export function useDisableOTP() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      // ✅ Use paper context like old dashboard for consistency
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      const { query } = GraphQlQuery.disableOTP();

      logger.info('Disabling 2FA');

      const result = await client.request<{
        disableOTP: ReturnResult<unknown>;
      }>(query);

      if (result.disableOTP.status !== 'OK') {
        throw new Error(result.disableOTP.reason || 'Failed to disable 2FA');
      }

      return result.disableOTP;
    },
    onSuccess: () => {
      logger.info('2FA disabled successfully');

      // ✅ Invalidate all user-related queries following old dashboard pattern
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
    },
    onError: (error) => {
      logger.error('Failed to disable 2FA', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Hook for regenerating recovery codes. Requires a fresh OTP token to
 * confirm the user still controls their second factor.
 */
export function useRegenerateRecoveryCodes() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OTPVerifyInput) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      const { query, variables } = GraphQlQuery.regenerateRecoveryCodes(input);

      logger.info('Regenerating recovery codes');

      const result = await client.request<{
        regenerateRecoveryCodes: ReturnResult<OTPVerifyResponse>;
      }>(query, variables);

      if (result.regenerateRecoveryCodes.status !== 'OK') {
        throw new Error(
          result.regenerateRecoveryCodes.reason ||
            'Failed to regenerate recovery codes'
        );
      }

      return result.regenerateRecoveryCodes.data;
    },
    onSuccess: (data) => {
      logger.info('Recovery codes regenerated successfully', {
        recoveryCodesCount: data?.recoveryCodes?.length,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
    },
    onError: (error) => {
      logger.error('Failed to regenerate recovery codes', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Combined hook for all 2FA operations
 */
export function use2FAOperations() {
  const generateOTP = useGenerateOTP();
  const verifyOTP = useVerifyOTP();
  const disableOTP = useDisableOTP();

  return {
    // Operations
    generateOTP: generateOTP.mutate,
    verifyOTP: verifyOTP.mutate,
    disableOTP: disableOTP.mutate,

    // Data
    otpData: generateOTP.data,
    recoveryCodes: verifyOTP.data?.recoveryCodes,

    // Loading states
    isGeneratingOTP: generateOTP.isPending,
    isVerifyingOTP: verifyOTP.isPending,
    isDisablingOTP: disableOTP.isPending,

    // Success states
    otpGenerated: generateOTP.isSuccess,
    otpVerified: verifyOTP.isSuccess,
    otpDisabled: disableOTP.isSuccess,

    // Error states
    generateOTPError: generateOTP.error,
    verifyOTPError: verifyOTP.error,
    disableOTPError: disableOTP.error,

    // Reset functions
    resetGenerate: generateOTP.reset,
    resetVerify: verifyOTP.reset,
    resetDisable: disableOTP.reset,
  };
}
