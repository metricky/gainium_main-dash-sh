/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CouchDB Proxy API Client
 * Handles all communication with backend CouchDB proxy endpoints
 */

import { logger } from '../loggerInstance';
import { apiClient } from '../apiClient';

export interface SyncValidationRequest {
  action: 'push' | 'pull' | 'bidirectional';
  dataSize?: number; // in bytes
  categories?: string[];
}

export interface SyncValidationResponse {
  approved: boolean;
  availableSpace: number; // in MB
  currentUsage: number; // in MB
  maxAllowed: number; // in MB
}

export interface SyncPushRequest {
  categories: string[];
  data: Record<string, any[]>;
}

export interface SyncPullRequest {
  categories?: string[];
}

export interface SyncResponse {
  success: boolean;
  bytesTransferred: number;
  duration: number; // in ms
  data?: any;
  error?: string;
}

export interface QuotaUsage {
  userId: string;
  currentUsage: number; // in MB
  maxAllowed: number; // in MB
  availableSpace: number; // in MB
  percentageUsed: number;
  lastUpdated: Date;
}

export interface SyncAuditLog {
  userId: string;
  timestamp: Date;
  action: 'push' | 'pull' | 'bidirectional';
  status: 'success' | 'failed' | 'rejected';
  categories: string[];
  bytesTransferred: number;
  duration: number; // in ms
  quotaBefore: number; // in MB
  quotaAfter: number; // in MB
  error?: string;
  ipAddress?: string;
}

export type BasicResponse<T = any> =
  | {
      status: 'OK';
      reason: null;
      data: T;
    }
  | {
      status: 'NOTOK';
      reason: string;
      data: null;
    };

/**
 * Validate a sync request with the backend
 * Checks quota and subscription before allowing sync operations
 */
export async function validateSyncRequest(
  request: SyncValidationRequest
): Promise<BasicResponse<SyncValidationResponse>> {
  try {
    logger.info('[CouchDB-Proxy] Validating sync request', {
      action: request.action,
      dataSize: request.dataSize,
      categories: request.categories,
    });

    const response = await apiClient.post<
      BasicResponse<SyncValidationResponse>
    >('/api/sync/validate', request);

    logger.info('[CouchDB-Proxy] Sync validation response', {
      status: response.data?.status,
      approved: response.data?.data?.approved,
      availableSpace: response.data?.data?.availableSpace,
    });

    return response.data;
  } catch (error) {
    logger.error('[CouchDB-Proxy] Failed to validate sync request', {
      error,
    });
    throw error;
  }
}

/**
 * Push data to backend for storage in CouchDB
 */
export async function pushDataToBackend(
  request: SyncPushRequest
): Promise<BasicResponse<SyncResponse>> {
  try {
    logger.info('[CouchDB-Proxy] Pushing data to backend', {
      categories: request.categories,
      dataSize: JSON.stringify(request.data).length,
    });

    const response = await apiClient.post<BasicResponse<SyncResponse>>(
      '/api/sync/push',
      request
    );

    logger.info('[CouchDB-Proxy] Push response', {
      status: response.data?.status,
      bytesTransferred: response.data?.data?.bytesTransferred,
      duration: response.data?.data?.duration,
    });

    return response.data;
  } catch (error) {
    logger.error('[CouchDB-Proxy] Failed to push data', { error });
    throw error;
  }
}

/**
 * Pull data from backend CouchDB
 */
export async function pullDataFromBackend(
  request: SyncPullRequest
): Promise<BasicResponse<SyncResponse>> {
  try {
    logger.info('[CouchDB-Proxy] Pulling data from backend', {
      categories: request.categories,
    });

    const response = await apiClient.post<BasicResponse<SyncResponse>>(
      '/api/sync/pull',
      request
    );

    logger.info('[CouchDB-Proxy] Pull response', {
      status: response.data?.status,
      bytesTransferred: response.data?.data?.bytesTransferred,
      duration: response.data?.data?.duration,
    });

    return response.data;
  } catch (error) {
    logger.error('[CouchDB-Proxy] Failed to pull data', { error });
    throw error;
  }
}

/**
 * Get current quota usage for the user
 */
export async function getQuotaUsage(): Promise<BasicResponse<QuotaUsage>> {
  try {
    logger.info('[CouchDB-Proxy] Getting quota usage');

    const response =
      await apiClient.get<BasicResponse<QuotaUsage>>('/api/sync/status');

    logger.info('[CouchDB-Proxy] Quota usage response', {
      status: response.data?.status,
      currentUsage: response.data?.data?.currentUsage,
      availableSpace: response.data?.data?.availableSpace,
    });

    return response.data;
  } catch (error) {
    logger.error('[CouchDB-Proxy] Failed to get quota usage', { error });
    throw error;
  }
}

/**
 * Get sync history for the user
 */
/* export async function getSyncHistory(
  days: number = 30
): Promise<BasicResponse<SyncAuditLog[]>> {
  try {
    logger.info('[CouchDB-Proxy] Getting sync history', { days });

    const url = `/api/sync/history?days=${days}`;
    const response = await apiClient.get<BasicResponse<SyncAuditLog[]>>(url);

    logger.info('[CouchDB-Proxy] Sync history response', {
      status: response.data?.status,
      entryCount: response.data?.data?.length,
    });

    return response.data;
  } catch (error) {
    logger.error('[CouchDB-Proxy] Failed to get sync history', { error });
    throw error;
  }
} */

/**
 * Check if a response indicates success (status === 'OK')
 */
export function isResponseOk<T>(response: BasicResponse<T>): boolean {
  return response.status === 'OK';
}

/**
 * Get error message from a failed response
 */
export function getResponseError(response: BasicResponse<any>): string | null {
  return response.status === 'NOTOK' ? response.reason : null;
}
