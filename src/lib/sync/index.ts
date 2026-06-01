// Cloud-sync adapter. Background/PouchDB sync is a cloud-only feature;
// sh ships no implementation and the hooks below are inert no-ops by
// default. Cloud registers its providers at boot in `src/main.tsx`.
//
// Slots for cloud-only UI (sync menu item, sync activity modal,
// PouchDB quota chip) live in `lib/extensions` — see `SlotPropsMap`.

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'disabled';

export interface SyncStatusInfo {
  status: SyncStatus;
}

const DEFAULT_STATUS: SyncStatusInfo = { status: 'disabled' };

let useSyncStatusImpl: () => SyncStatusInfo = () => DEFAULT_STATUS;

export function registerSyncStatusProvider(
  fn: () => SyncStatusInfo
): void {
  useSyncStatusImpl = fn;
}

/** Returns sync status info. Sh: always `{ status: 'disabled' }`. */
export function useSyncStatus(): SyncStatusInfo {
  return useSyncStatusImpl();
}

let useSyncInitializerImpl: () => void = () => {};

export function registerSyncInitializer(fn: () => void): void {
  useSyncInitializerImpl = fn;
}

/** Mounts the cloud sync poll/listener. Sh: no-op. Call once in
 *  the app's main layout. */
export function useSyncInitializer(): void {
  useSyncInitializerImpl();
}
