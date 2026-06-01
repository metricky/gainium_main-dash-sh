// Stub for self-hosted: PouchDB sync middleware is a pass-through.
// Stores still wrap their state creator with `pouchdbSync(...)` but sh skips
// all sync behavior — the middleware just returns the underlying creator.

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import type {
  ConflictResolutionCallback,
  // Re-exported for code that imports types from here.
} from './pouchdbSync';

export type DeletionStrategy = 'propagate' | 'local-only' | 'immediate-purge';

export interface DeletionBehavior {
  strategy?: DeletionStrategy;
  tombstoneRetention?: number | null;
  propagateImmediately?: boolean;
}

export interface PouchDBSyncOptions {
  category: string;
  selector: (state: any) => any[];
  debounceMs?: number;
  enabled?: boolean;
  onSync?: (data: any[]) => void;
  onError?: (error: Error) => void;
  onConflict?: ConflictResolutionCallback;
  deletionBehavior?: DeletionBehavior;
}

type PouchDBSyncMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  options: PouchDBSyncOptions
) => StateCreator<T, Mps, Mcs>;

const passThrough = <T>(
  f: StateCreator<T, [], []>,
  _options: PouchDBSyncOptions
): StateCreator<T, [], []> => f;

export const pouchdbSync = passThrough as unknown as PouchDBSyncMiddleware;
