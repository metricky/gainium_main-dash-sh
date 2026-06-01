import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import { GraphQLClient, type ReturnResult } from '@/lib/api';
import GraphQlQuery from '@/lib/api/GraphQLQueries';
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/lib/loggerInstance';

export interface PasskeyCredential {
  credentialId: string;
  label?: string | null;
  deviceType?: string | null;
  transports?: string[] | null;
  createdAt?: string | null;
  lastUsedAt?: string | null;
}

const PASSKEYS_QUERY_KEY = ['webauthn-credentials'] as const;

function getEndpoint(): string {
  return import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
}

/**
 * List the current user's registered passkeys. Authenticated.
 */
export function useListPasskeys() {
  const { tokens } = useAuthStore();

  return useQuery({
    queryKey: PASSKEYS_QUERY_KEY,
    queryFn: async (): Promise<PasskeyCredential[]> => {
      if (!tokens?.accessToken) {
        throw new Error('Authentication required');
      }

      const client = new GraphQLClient(getEndpoint(), tokens.accessToken, true);
      const { query } = GraphQlQuery.webauthnCredentials();

      const result = await client.request<{
        webauthnCredentials: ReturnResult<PasskeyCredential[]>;
      }>(query);

      if (result.webauthnCredentials.status !== 'OK') {
        throw new Error(
          result.webauthnCredentials.reason || 'Failed to load passkeys'
        );
      }

      return result.webauthnCredentials.data || [];
    },
    enabled: !!tokens?.accessToken,
    staleTime: 60 * 1000,
  });
}

/**
 * Register a new passkey on this device. Authenticated.
 * Flow: fetch options -> browser ceremony -> verify with server.
 */
export function useRegisterPasskey() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { label?: string } = {}) => {
      if (!tokens?.accessToken) {
        throw new Error('Authentication required');
      }

      const client = new GraphQLClient(getEndpoint(), tokens.accessToken, true);

      // 1. Ask server for registration options.
      const optsRes = await client.request<{
        webauthnRegistrationOptions: ReturnResult<{ options: unknown }>;
      }>(GraphQlQuery.webauthnRegistrationOptions().query);

      if (
        optsRes.webauthnRegistrationOptions.status !== 'OK' ||
        !optsRes.webauthnRegistrationOptions.data?.options
      ) {
        throw new Error(
          optsRes.webauthnRegistrationOptions.reason ||
            'Failed to get passkey registration options'
        );
      }

      // 2. Drive the browser ceremony.
      // The options shape comes from @simplewebauthn/server; runtime-only
      // because GraphQL returns a generic JSON scalar wrapped in {options}.
      // @simplewebauthn/browser v11+ takes { optionsJSON }, not the raw object.
      const optionsJSON = optsRes.webauthnRegistrationOptions.data.options as
        Parameters<typeof startRegistration>[0]['optionsJSON'];
      const attResp = await startRegistration({ optionsJSON });

      // 3. Verify with the server.
      const verifyArgs: { response: unknown; label?: string } = {
        response: attResp,
      };
      if (input.label) verifyArgs.label = input.label;
      const verifyQuery = GraphQlQuery.webauthnVerifyRegistration(verifyArgs);
      const verifyRes = await client.request<{
        webauthnVerifyRegistration: ReturnResult<unknown>;
      }>(verifyQuery.query, verifyQuery.variables);

      if (verifyRes.webauthnVerifyRegistration.status !== 'OK') {
        throw new Error(
          verifyRes.webauthnVerifyRegistration.reason ||
            'Passkey verification failed'
        );
      }

      return verifyRes.webauthnVerifyRegistration;
    },
    onSuccess: () => {
      logger.info('Passkey registered successfully');
      queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY });
    },
    onError: (error) => {
      logger.error('Passkey registration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export interface AuthenticatePasskeyResult {
  token: string;
}

/**
 * Authenticate via passkey. Unauthenticated by design — used at login.
 * Caller is responsible for storing the returned token via
 * `useAuthStore.getState().login(token, user)`.
 */
export function useAuthenticatePasskey() {
  return useMutation({
    mutationFn: async (
      input: { email?: string } = {}
    ): Promise<AuthenticatePasskeyResult> => {
      const client = new GraphQLClient(getEndpoint());

      // 1. Fetch authentication options (server returns allowed credentials).
      const optsQuery = GraphQlQuery.webauthnAuthenticationOptions(input);
      const optsRes = await client.request<{
        webauthnAuthenticationOptions: ReturnResult<{ options: unknown }>;
      }>(optsQuery.query, optsQuery.variables);

      if (
        optsRes.webauthnAuthenticationOptions.status !== 'OK' ||
        !optsRes.webauthnAuthenticationOptions.data?.options
      ) {
        throw new Error(
          optsRes.webauthnAuthenticationOptions.reason ||
            'Failed to get passkey authentication options'
        );
      }

      // 2. Browser ceremony.
      // @simplewebauthn/browser v11+ takes { optionsJSON }, not the raw object.
      const optionsJSON = optsRes.webauthnAuthenticationOptions.data.options as
        Parameters<typeof startAuthentication>[0]['optionsJSON'];
      const authResp = await startAuthentication({ optionsJSON });

      // 3. Verify and receive JWT.
      const verifyQuery = GraphQlQuery.webauthnVerifyAuthentication({
        response: authResp,
      });
      const verifyRes = await client.request<{
        webauthnVerifyAuthentication: ReturnResult<AuthenticatePasskeyResult>;
      }>(verifyQuery.query, verifyQuery.variables);

      if (
        verifyRes.webauthnVerifyAuthentication.status !== 'OK' ||
        !verifyRes.webauthnVerifyAuthentication.data?.token
      ) {
        throw new Error(
          verifyRes.webauthnVerifyAuthentication.reason ||
            'Passkey authentication failed'
        );
      }

      return verifyRes.webauthnVerifyAuthentication.data;
    },
    onError: (error) => {
      logger.error('Passkey authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Rename a registered passkey's label. Authenticated.
 */
export function useRenamePasskey() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { credentialId: string; label: string }) => {
      if (!tokens?.accessToken) {
        throw new Error('Authentication required');
      }
      const client = new GraphQLClient(getEndpoint(), tokens.accessToken, true);
      const { query, variables } =
        GraphQlQuery.webauthnRenameCredential(input);
      const result = await client.request<{
        webauthnRenameCredential: ReturnResult<unknown>;
      }>(query, variables);
      if (result.webauthnRenameCredential.status !== 'OK') {
        throw new Error(
          result.webauthnRenameCredential.reason ||
            'Failed to rename passkey',
        );
      }
      return result.webauthnRenameCredential;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY });
    },
    onError: (error) => {
      logger.error('Failed to rename passkey', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Revoke a registered passkey by credential id. Authenticated.
 */
export function useRevokePasskey() {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { credentialId: string }) => {
      if (!tokens?.accessToken) {
        throw new Error('Authentication required');
      }

      const client = new GraphQLClient(getEndpoint(), tokens.accessToken, true);
      const { query, variables } =
        GraphQlQuery.webauthnRevokeCredential(input);

      const result = await client.request<{
        webauthnRevokeCredential: ReturnResult<unknown>;
      }>(query, variables);

      if (result.webauthnRevokeCredential.status !== 'OK') {
        throw new Error(
          result.webauthnRevokeCredential.reason ||
            'Failed to revoke passkey'
        );
      }

      return result.webauthnRevokeCredential;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY });
    },
    onError: (error) => {
      logger.error('Failed to revoke passkey', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Feature-detect WebAuthn support in the current browser.
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined'
  );
}
