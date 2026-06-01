import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GraphQLClient, type ReturnResult } from '@/lib/api';
import GraphQlQuery from '@/lib/api/GraphQLQueries';
import { useAuthStore } from '@/stores/authStore';

import { logger } from '@/lib/loggerInstance';

const getEndpoint = () =>
  import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';

const invalidateUserQueries = (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
  });
};

/**
 * Hook for generating a license key on the backend (cloud flow).
 * The backend creates a new key and stores it on the user record.
 */
export function useGenerateLicenseKey() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const client = new GraphQLClient(getEndpoint(), tokens.accessToken, true);

      const { query } = GraphQlQuery.generateLicenseKey();

      logger.info('Generating license key');

      const result = await client.request<{
        generateLicenseKey: ReturnResult<string>;
      }>(query);

      if (result.generateLicenseKey.status !== 'OK') {
        throw new Error(
          result.generateLicenseKey.reason || 'Failed to generate license key'
        );
      }

      return result.generateLicenseKey.data;
    },
    onSuccess: () => {
      logger.info('License key generated successfully');
      invalidateUserQueries(queryClient);
    },
    onError: (error) => {
      logger.error('Failed to generate license key', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Hook for saving a user-supplied license key (sh flow).
 * The user pastes a key obtained from gainium.io and the backend
 * validates + stores it.
 */
export function useSetLicenseKey() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }
      const trimmed = key.trim();
      if (!trimmed) {
        throw new Error('License key is required');
      }

      const client = new GraphQLClient(getEndpoint(), tokens.accessToken, true);

      const { query, variables } = GraphQlQuery.setLicenseKey({ key: trimmed });

      logger.info('Saving license key');

      const result = await client.request<{
        setLicenseKey: ReturnResult<string>;
      }>(query, variables);

      if (result.setLicenseKey.status !== 'OK') {
        throw new Error(
          result.setLicenseKey.reason || 'Failed to save license key'
        );
      }

      return result.setLicenseKey.data;
    },
    onSuccess: () => {
      logger.info('License key saved successfully');
      invalidateUserQueries(queryClient);
    },
    onError: (error) => {
      logger.error('Failed to save license key', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/** Hook for clearing the stored license key. */
export function useDeleteLicenseKey() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const client = new GraphQLClient(getEndpoint(), tokens.accessToken, true);

      const { query } = GraphQlQuery.deleteLicenseKey();

      logger.info('Deleting license key');

      const result = await client.request<{
        deleteLicenseKey: ReturnResult<string>;
      }>(query);

      if (result.deleteLicenseKey.status !== 'OK') {
        throw new Error(
          result.deleteLicenseKey.reason || 'Failed to delete license key'
        );
      }

      return result.deleteLicenseKey.data;
    },
    onSuccess: () => {
      logger.info('License key deleted successfully');
      invalidateUserQueries(queryClient);
    },
    onError: (error) => {
      logger.error('Failed to delete license key', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Combined hook exposing every license-key operation. Cloud uses
 * `generateLicenseKey` (regenerate flow). Sh uses
 * `setLicenseKey` + `deleteLicenseKey` (manual save/clear flow).
 * The Settings page picks which UI to render based on `IS_CLOUD`.
 */
export function useLicenseKeyOperations() {
  const generateLicenseKey = useGenerateLicenseKey();
  const setLicenseKey = useSetLicenseKey();
  const deleteLicenseKey = useDeleteLicenseKey();

  return {
    // Operations
    generateLicenseKey: generateLicenseKey.mutate,
    setLicenseKey: setLicenseKey.mutate,
    deleteLicenseKey: deleteLicenseKey.mutate,

    // Data (only `generateLicenseKey` returns a meaningful payload —
    // the others just toggle the stored key on the user record).
    licenseKey: generateLicenseKey.data,

    // Loading states
    isGenerating: generateLicenseKey.isPending,
    isSaving: setLicenseKey.isPending,
    isDeleting: deleteLicenseKey.isPending,

    // Success states
    generateSuccess: generateLicenseKey.isSuccess,
    saveSuccess: setLicenseKey.isSuccess,
    deleteSuccess: deleteLicenseKey.isSuccess,

    // Error states
    generateError: generateLicenseKey.error,
    saveError: setLicenseKey.error,
    deleteError: deleteLicenseKey.error,

    // Reset functions
    reset: () => {
      generateLicenseKey.reset();
      setLicenseKey.reset();
      deleteLicenseKey.reset();
    },
  };
}
