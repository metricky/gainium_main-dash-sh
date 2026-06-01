// Stub implementation: PouchDB/CouchDB sync is not available.
// Self-hosted runs as a single instance — there is no remote DB to sync against,
// so the entire service is a no-op exposing the same surface used by callers.

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SyncOptions {
  live?: boolean;
  retry?: boolean;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'complete';
  direction?: 'push' | 'pull' | 'bidirectional';
  message?: string;
  error?: Error;
  docs?: {
    pushed?: number;
    pulled?: number;
  };
}

export type SyncCallback = (status: SyncStatus) => void;

export interface RemoteChangeEvent {
  direction: 'pull' | 'push';
  source: 'live-sync' | 'force-pull' | 'one-time-sync';
  docIds?: string[];
}

export type ConflictResolutionStrategy =
  | 'deletion-wins'
  | 'modification-wins'
  | 'last-write-wins'
  | 'manual';

export interface ConflictInfo {
  docId: string;
  currentRev: string;
  conflictingRevs: string[];
  currentDoc: any;
  conflictingDocs: any[];
}

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  winningRev?: string;
  shouldDelete?: boolean;
}

export type ConflictResolutionCallback = (
  conflict: ConflictInfo
) => ConflictResolution | Promise<ConflictResolution>;

export interface ConflictItem {
  id: string;
  type: 'name_duplication';
  category: string;
  localItem: any;
  remoteItem: any;
  bothRemote: boolean;
  bothLocal: boolean;
}

const noopUnsubscribe = (): void => {};

class PouchDBSyncServiceStub {
  readonly isDisabled = true;
  readonly isInitialized = false;
  readonly isInitializing = false;
  readonly error: Error | null = null;
  readonly syncStatus: SyncStatus = { status: 'idle' };
  readonly quotaLimitMb = 0;
  readonly quotaUsageMb = 0;
  readonly quotaPercentUsed = 0;
  readonly showQuotaWarning = false;

  isReady(): boolean {
    return false;
  }

  async initialize(_userId: string): Promise<void> {}
  async cleanup(): Promise<void> {}
  async clearLocalData(): Promise<void> {}

  async forcePush(
    onProgress?: SyncCallback,
    _allowedCategories?: string[] | Set<string>
  ): Promise<void> {
    onProgress?.({ status: 'complete' });
  }

  async forcePull(
    onProgress?: SyncCallback,
    _clearLocal: boolean = false,
    _allowedCategories?: string[] | Set<string>
  ): Promise<void> {
    onProgress?.({ status: 'complete' });
  }

  async syncBidirectional(
    onProgress?: SyncCallback
  ): Promise<{ success: boolean }> {
    onProgress?.({ status: 'complete' });
    return { success: true };
  }

  startLiveSync(
    _onProgress?: SyncCallback,
    _allowedCategories?: string[] | Set<string>
  ): void {}
  stopLiveSync(): void {}

  registerStoreDataProvider(
    _category: string,
    _provider: () => any[] | Promise<any[]>
  ): void {}

  subscribeToRemoteChanges(
    _listener: (event: RemoteChangeEvent) => void
  ): () => void {
    return noopUnsubscribe;
  }

  setConflictResolutionCallback(
    _callback: ConflictResolutionCallback | null
  ): void {}

  setConflictedDocIds(_conflicts: ConflictItem[]): void {}

  async resolveNameConflict(
    _conflict: ConflictItem,
    _resolution: 'keep-local' | 'keep-remote'
  ): Promise<void> {}

  async checkForNameConflicts(
    _category: string,
    _remoteDocs: any[]
  ): Promise<ConflictItem[]> {
    return [];
  }

  async syncLocalData(
    _category: string,
    _data: any[],
    onProgress?: SyncCallback,
    _options?: { allowDeletions?: boolean }
  ): Promise<void> {
    onProgress?.({ status: 'complete' });
  }

  async syncZustandToLocalPouchDB(): Promise<void> {}
  async loadDataIntoStores(): Promise<Record<string, any[]>> {
    return {};
  }
  async purgeDeletedFromRemote(): Promise<void> {}

  async deleteDocuments(
    _category: string,
    _ids: Array<string | number>,
    _options?: {
      localOnly?: boolean;
      scheduleForPurge?: boolean;
      purgeAfterDays?: number;
    }
  ): Promise<void> {}

  async deleteCategoryFromCloud(
    _category: string,
    _onProgress?: SyncCallback,
    _allowedCategories?: string[] | Set<string>
  ): Promise<void> {}

  async getAllData(): Promise<Record<string, any[]>> {
    return {};
  }
  async getAllRemoteDocs(): Promise<any[]> {
    return [];
  }
  async getDocumentsByCategory(
    _category: string,
    _includeDeleted: boolean = false
  ): Promise<any[]> {
    return [];
  }
  getAllCategories(): string[] {
    return [];
  }

  async compactLocalDB(): Promise<void> {}
  async compactRemoteDB(): Promise<void> {}
}

export const pouchDBSync = new PouchDBSyncServiceStub();
