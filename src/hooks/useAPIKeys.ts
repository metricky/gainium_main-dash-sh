import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GraphQLClient, type ReturnResult } from '@/lib/api';
import GraphQlQuery from '@/lib/api/GraphQLQueries';
import { useAuthStore } from '@/stores/authStore';

import { logger } from '@/lib/loggerInstance';

export interface APIKey {
  _id: string;
  secret?: string; // Only available when creating new keys
  created: string;
  expired: string;
  permission: 'read' | 'write';
  name?: string;
  paperContext?: boolean | null;
  botId?: string | null;
}

export interface APIKeyInput {
  key: string;
}

export interface APIKeyPermissionInput {
  key: string;
  permission: 'read' | 'write';
}

export interface APIKeyNameInput {
  key: string;
  name: string;
}

export interface APIKeyPaperContextInput {
  key: string;
  paperContext?: boolean | null;
}

export interface APIKeyBotIdInput {
  key: string;
  botId?: string | null;
}

/**
 * Hook for creating new API keys
 */
export function useCreateAPIKeys() {
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

      const { query } = GraphQlQuery.createAPIKeys();

      logger.info('Creating new API keys');

      const result = await client.request<{
        createAPIKeys: ReturnResult<APIKey>;
      }>(query);

      if (result.createAPIKeys.status !== 'OK') {
        throw new Error(
          result.createAPIKeys.reason || 'Failed to create API keys'
        );
      }

      return result.createAPIKeys.data;
    },
    onSuccess: (data) => {
      logger.info('API keys created successfully', { keyId: data?._id });

      // ✅ Invalidate all user-related queries following old dashboard pattern
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
      queryClient.invalidateQueries({
        queryKey: ['user-settings', 'live-context'],
      });
    },
    onError: (error) => {
      logger.error('Failed to create API keys', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Hook for renewing existing API keys
 */
export function useRenewAPIKeys() {
  const { tokens } = useAuthStore();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: APIKeyInput) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      // ✅ Use paper context like old dashboard for consistency
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      const { query, variables } = GraphQlQuery.renewAPIKeys(input);

      logger.info('Renewing API keys', { keyId: input.key });

      const result = await client.request<{
        renewAPIKeys: ReturnResult<APIKey[]>;
      }>(query, variables);

      if (result.renewAPIKeys.status !== 'OK') {
        throw new Error(
          result.renewAPIKeys.reason || 'Failed to renew API keys'
        );
      }

      return result.renewAPIKeys.data;
    },
    onSuccess: (data, variables) => {
      logger.info('API keys renewed successfully', { keyId: variables.key });

      // ✅ Invalidate all user-related queries following old dashboard pattern
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
      queryClient.invalidateQueries({
        queryKey: ['user-settings', 'live-context'],
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to renew API keys', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId: variables.key,
      });
    },
  });
}

/**
 * Hook for deleting API keys
 */
export function useDeleteAPIKeys() {
  const { tokens } = useAuthStore();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: APIKeyInput) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      // ✅ Use paper context like old dashboard for consistency
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      const { query, variables } = GraphQlQuery.deleteAPIKeys(input);

      logger.info('Deleting API keys', { keyId: input.key });

      const result = await client.request<{
        deleteAPIKeys: ReturnResult<APIKey[]>;
      }>(query, variables);

      if (result.deleteAPIKeys.status !== 'OK') {
        throw new Error(
          result.deleteAPIKeys.reason || 'Failed to delete API keys'
        );
      }

      return result.deleteAPIKeys.data;
    },
    onSuccess: (data, variables) => {
      logger.info('API keys deleted successfully', { keyId: variables.key });

      // ✅ Invalidate all user-related queries following old dashboard pattern
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
      queryClient.invalidateQueries({
        queryKey: ['user-settings', 'live-context'],
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to delete API keys', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId: variables.key,
      });
    },
  });
}

/**
 * Hook for changing API key permissions
 */
export function useChangeAPIKeyPermission() {
  const { tokens } = useAuthStore();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: APIKeyPermissionInput) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      // ✅ Use paper context like old dashboard for consistency
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      // Note: This query might need to be added to userQueries if not present
      const query = `mutation changeAPIKeysPermission($input: changeAPIKeysPermissionInput!) {
        changeAPIKeysPermission(input: $input) {
          status
          reason
          data {
            _id
            created
            expired
            permission
            name
            paperContext
            botId
          }
        }
      }`;

      const variables = { input };

      logger.info('Changing API key permission', {
        keyId: input.key,
        permission: input.permission,
      });

      const result = await client.request<{
        changeAPIKeysPermission: ReturnResult<APIKey[]>;
      }>(query, variables);

      if (result.changeAPIKeysPermission.status !== 'OK') {
        throw new Error(
          result.changeAPIKeysPermission.reason ||
            'Failed to change API key permission'
        );
      }

      return result.changeAPIKeysPermission.data;
    },
    onSuccess: (data, variables) => {
      logger.info('API key permission changed successfully', {
        keyId: variables.key,
        permission: variables.permission,
      });

      // ✅ Invalidate all user-related queries following old dashboard pattern
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
      queryClient.invalidateQueries({
        queryKey: ['user-settings', 'live-context'],
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to change API key permission', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId: variables.key,
        permission: variables.permission,
      });
    },
  });
}

/**
 * Hook for changing API key name
 */
export function useChangeAPIKeyName() {
  const { tokens } = useAuthStore();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: APIKeyNameInput) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      // ✅ Use paper context like old dashboard for consistency
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      // Note: This query might need to be added to userQueries if not present
      const query = `mutation changeAPIKeysName($input: changeAPIKeysNameInput!) {
        changeAPIKeysName(input: $input) {
          status
          reason
          data {
            _id
            created
            expired
            permission
            name
            paperContext
            botId
          }
        }
      }`;

      const variables = { input };

      logger.info('Changing API key name', {
        keyId: input.key,
        name: input.name,
      });

      const result = await client.request<{
        changeAPIKeysName: ReturnResult<APIKey[]>;
      }>(query, variables);

      if (result.changeAPIKeysName.status !== 'OK') {
        throw new Error(
          result.changeAPIKeysName.reason || 'Failed to change API key name'
        );
      }

      return result.changeAPIKeysName.data;
    },
    onSuccess: (data, variables) => {
      logger.info('API key name changed successfully', {
        keyId: variables.key,
        name: variables.name,
      });

      // ✅ Invalidate all user-related queries following old dashboard pattern
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
      queryClient.invalidateQueries({
        queryKey: ['user-settings', 'live-context'],
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to change API key name', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId: variables.key,
        name: variables.name,
      });
    },
  });
}

/**
 * Hook for changing API key paper context restriction
 */
export function useChangeAPIKeyPaperContext() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: APIKeyPaperContextInput) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      const query = `mutation changeAPIKeysPaperContext($input: changeAPIKeysPaperContextInput!) {
        changeAPIKeysPaperContext(input: $input) {
          status
          reason
          data {
            _id
            created
            expired
            permission
            name
            paperContext
            botId
          }
        }
      }`;

      const variables = { input };

      logger.info('Changing API key paper context', {
        keyId: input.key,
        paperContext: input.paperContext,
      });

      const result = await client.request<{
        changeAPIKeysPaperContext: ReturnResult<APIKey[]>;
      }>(query, variables);

      if (result.changeAPIKeysPaperContext.status !== 'OK') {
        throw new Error(
          result.changeAPIKeysPaperContext.reason ||
            'Failed to change API key paper context'
        );
      }

      return result.changeAPIKeysPaperContext.data;
    },
    onSuccess: (data, variables) => {
      logger.info('API key paper context changed successfully', {
        keyId: variables.key,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
      queryClient.invalidateQueries({
        queryKey: ['user-settings', 'live-context'],
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to change API key paper context', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId: variables.key,
      });
    },
  });
}

/**
 * Hook for changing API key bot ID restriction
 */
export function useChangeAPIKeyBotId() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: APIKeyBotIdInput) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      const client = new GraphQLClient(endpoint, tokens.accessToken, true);

      const query = `mutation changeAPIKeysBotId($input: changeAPIKeysBotIdInput!) {
        changeAPIKeysBotId(input: $input) {
          status
          reason
          data {
            _id
            created
            expired
            permission
            name
            paperContext
            botId
          }
        }
      }`;

      const variables = { input };

      logger.info('Changing API key bot ID', {
        keyId: input.key,
        botId: input.botId,
      });

      const result = await client.request<{
        changeAPIKeysBotId: ReturnResult<APIKey[]>;
      }>(query, variables);

      if (result.changeAPIKeysBotId.status !== 'OK') {
        throw new Error(
          result.changeAPIKeysBotId.reason || 'Failed to change API key bot ID'
        );
      }

      return result.changeAPIKeysBotId.data;
    },
    onSuccess: (data, variables) => {
      logger.info('API key bot ID changed successfully', {
        keyId: variables.key,
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'user' || query.queryKey[0] === 'user-settings',
      });
      queryClient.invalidateQueries({
        queryKey: ['user-settings', 'live-context'],
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to change API key bot ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId: variables.key,
      });
    },
  });
}

/**
 * Combined hook for all API key operations
 */
export function useAPIKeysOperations() {
  const createAPIKeys = useCreateAPIKeys();
  const renewAPIKeys = useRenewAPIKeys();
  const deleteAPIKeys = useDeleteAPIKeys();
  const changePermission = useChangeAPIKeyPermission();
  const changeName = useChangeAPIKeyName();
  const changePaperContext = useChangeAPIKeyPaperContext();
  const changeBotId = useChangeAPIKeyBotId();

  return {
    // Operations
    createAPIKeys: createAPIKeys.mutate,
    renewAPIKeys: renewAPIKeys.mutate,
    deleteAPIKeys: deleteAPIKeys.mutate,
    changePermission: changePermission.mutate,
    changeName: changeName.mutate,
    changePaperContext: changePaperContext.mutate,
    changeBotId: changeBotId.mutate,

    // Data
    newAPIKey: createAPIKeys.data,

    // Loading states
    isCreating: createAPIKeys.isPending,
    isRenewing: renewAPIKeys.isPending,
    isDeleting: deleteAPIKeys.isPending,
    isChangingPermission: changePermission.isPending,
    isChangingName: changeName.isPending,
    isChangingPaperContext: changePaperContext.isPending,
    isChangingBotId: changeBotId.isPending,

    // Success states
    createSuccess: createAPIKeys.isSuccess,
    renewSuccess: renewAPIKeys.isSuccess,
    deleteSuccess: deleteAPIKeys.isSuccess,
    changePermissionSuccess: changePermission.isSuccess,
    changeNameSuccess: changeName.isSuccess,
    changePaperContextSuccess: changePaperContext.isSuccess,
    changeBotIdSuccess: changeBotId.isSuccess,

    // Error states
    createError: createAPIKeys.error,
    renewError: renewAPIKeys.error,
    deleteError: deleteAPIKeys.error,
    changePermissionError: changePermission.error,
    changeNameError: changeName.error,
    changePaperContextError: changePaperContext.error,
    changeBotIdError: changeBotId.error,

    // Reset functions
    resetCreate: createAPIKeys.reset,
    resetRenew: renewAPIKeys.reset,
    resetDelete: deleteAPIKeys.reset,
    resetChangePermission: changePermission.reset,
    resetChangeName: changeName.reset,
    resetChangePaperContext: changePaperContext.reset,
    resetChangeBotId: changeBotId.reset,
  };
}
