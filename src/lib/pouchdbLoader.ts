// Stub for self-hosted: PouchDB is not used (no cross-device sync).
// We deliberately avoid importing `pouchdb-browser` so the dependency can be
// dropped from package.json. Callers should only consume types defensively;
// any runtime use will be a no-op via the consumers' own stubs.

/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-explicit-any */

export namespace PouchDB {
  // Minimal stand-in for the parts of the type surface our codebase references.
  export type Database<_T = any> = unknown;
  export namespace Replication {
    export type Sync<_T = any> = unknown;
  }
}

// Provide a callable surface so `new PouchDB(...)` still type-checks, then
// never gets called.
export const PouchDB: any = function PouchDB(): never {
  throw new Error('PouchDB is disabled in self-hosted builds');
};

export function loadPouchDB(): Promise<typeof PouchDB> {
  return Promise.resolve(PouchDB);
}
