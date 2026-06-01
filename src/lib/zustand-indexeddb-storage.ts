/**
 * IndexedDB storage adapter for Zustand persist middleware
 * Provides much larger storage capacity than localStorage (typically 50MB-1GB+)
 */

import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { liveStoreHydrationQueue } from '@/stores/hydrationQueue';
import logger from './loggerInstance';

// Keys for which we intentionally skip migrations to avoid noise and redundant work
const SKIP_MIGRATION_KEYS = new Set<string>([
  'journal-tags-storage',
  'trade-journal-storage',
  'tradingview-storage',
  'manual-backtesting-sessions-storage',
]);

const DB_NAME = 'ZustandStorage';
const DB_VERSION = 1;
const STORE_NAME = 'state';

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error(
          '[IndexedDBStorage] Failed to open database:',
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });

    return this.dbPromise;
  }

  async getItem<S>(name: string): Promise<StorageValue<S> | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get(name);

        request.onsuccess = () => {
          const value = request.result;
          if (value === undefined) {
            logger.debug(`[IndexedDBStorage] No data found for key: ${name}`);
            resolve(null);
          } else {
            logger.debug(`[IndexedDBStorage] Retrieved data for key: ${name}`);
            // Value is already the parsed object
            resolve(value as StorageValue<S>);
          }
        };

        request.onerror = () => {
          console.error(
            '[IndexedDBStorage] Failed to get item:',
            request.error
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDBStorage] getItem error:', error);
      // Fallback to localStorage if IndexedDB fails
      try {
        const str = localStorage.getItem(name);
        if (str) {
          logger.debug(
            `[IndexedDBStorage] Falling back to localStorage for key: ${name}`
          );
          return JSON.parse(str);
        }
        return null;
      } catch {
        return null;
      }
    }
  }

  async setItem<S>(name: string, value: StorageValue<S>): Promise<void> {
    try {
      logger.debug(
        `[IndexedDBStorage] Attempting to save data for key: ${name}`
      );
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.put(value, name);

        request.onsuccess = () => {
          logger.debug(
            `[IndexedDBStorage] Successfully saved data for key: ${name}`
          );
          resolve();
        };

        request.onerror = () => {
          console.error(
            '[IndexedDBStorage] Failed to set item:',
            request.error
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDBStorage] setItem error:', error);
      // Fallback to localStorage if IndexedDB fails
      try {
        logger.debug(
          `[IndexedDBStorage] Falling back to localStorage for saving key: ${name}`
        );
        localStorage.setItem(name, JSON.stringify(value));
      } catch (lsError) {
        console.error(
          '[IndexedDBStorage] localStorage fallback also failed:',
          lsError
        );
        throw error;
      }
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.delete(name);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          console.error(
            '[IndexedDBStorage] Failed to remove item:',
            request.error
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDBStorage] removeItem error:', error);
      // Fallback to localStorage
      try {
        localStorage.removeItem(name);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Migrate data from localStorage to IndexedDB
   */
  async migrateFromLocalStorage(key: string): Promise<void> {
    // Do not attempt migration for keys explicitly configured to be skipped
    if (SKIP_MIGRATION_KEYS.has(key)) {
      return;
    }
    try {
      // Check if we already have data in IndexedDB
      const existingData = await this.getItem(key);
      if (existingData) {
        logger.debug(
          `[IndexedDBStorage] Data already exists for key: ${key}, skipping migration`
        );
        return;
      }

      // Try to get data from localStorage
      const localStorageData = localStorage.getItem(key);
      if (localStorageData) {
        logger.debug(
          `[IndexedDBStorage] Migrating data from localStorage to IndexedDB for key: ${key}`
        );
        logger.debug(
          `[IndexedDBStorage] Data size: ${(localStorageData.length / 1024).toFixed(2)} KB`
        );

        const parsed = JSON.parse(localStorageData);
        logger.debug(`[IndexedDBStorage] Parsed data successfully`);

        await this.setItem(key, parsed);
        logger.debug(`[IndexedDBStorage] Data saved to IndexedDB`);

        // After successful migration, remove from localStorage to free up space
        localStorage.removeItem(key);
        logger.debug(
          `[IndexedDBStorage] Migration complete, localStorage cleared for key: ${key}`
        );
      } else {
        logger.debug(
          `[IndexedDBStorage] No localStorage data found for key: ${key}, nothing to migrate`
        );
      }
    } catch (error) {
      console.error(
        `[IndexedDBStorage] Migration failed for key: ${key}`,
        error
      );
      // Don't throw - allow the app to continue even if migration fails
      // The store will work with IndexedDB going forward
    }
  }
  async clearAll(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          console.error(
            '[IndexedDBStorage] Failed to clear all items:',
            request.error
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDBStorage] clearAll error:', error);
      // Fallback to localStorage
      try {
        localStorage.clear();
      } catch {
        // Ignore
      }
    }
  }
}

// Keys for which we intentionally skip migrations to avoid noise and redundant work
// (SKIP_MIGRATION_KEYS defined above)

// Create singleton instance
export const indexedDBStorage = new IndexedDBStorage();

// Track which keys have been migrated to avoid redundant attempts
const migrationAttempted = new Set<string>();

// Create a wrapper that handles the async nature properly

export const createIndexedDBStorage = (
  storageKey: string
): PersistStorage<unknown> => {
  // Optionally skip migration for specific keys — avoid noisy logs and redundant work
  if (
    !migrationAttempted.has(storageKey) &&
    !SKIP_MIGRATION_KEYS.has(storageKey)
  ) {
    migrationAttempted.add(storageKey);

    // Run migration in background, don't block store initialization
    setTimeout(() => {
      indexedDBStorage.migrateFromLocalStorage(storageKey).catch((error) => {
        console.error('[IndexedDBStorage] Background migration failed:', error);
      });
    }, 100); // Small delay to allow store to initialize first
  } else if (
    SKIP_MIGRATION_KEYS.has(storageKey) &&
    !migrationAttempted.has(storageKey)
  ) {
    // Mark as attempted to avoid repeated checks. We intentionally avoid
    // logging here to reduce console noise about intentionally skipped keys.
    migrationAttempted.add(storageKey);
  }

  return {
    getItem: (name: string) => {
      return indexedDBStorage.getItem<unknown>(name);
    },
    setItem: (name: string, value: StorageValue<unknown>) => {
      return indexedDBStorage.setItem<unknown>(name, value);
    },
    removeItem: (name: string) => {
      return indexedDBStorage.removeItem(name);
    },
  };
};

/**
 * Same as `createIndexedDBStorage` but routes `getItem` through
 * `liveStoreHydrationQueue` so heavy live stores (dca/combo/grid/hedge
 * bots, transactions, deals, orders, minigrids) hydrate one at a time
 * with an idle-callback yield between each. Prevents the simultaneous
 * structured-clone spike that triggers OOM crashes on Windows Chrome
 * for users with large persisted state.
 *
 * Use this for any store whose persisted payload can grow into the
 * tens of MB. Lightweight stores (UI settings, theme, etc.) can keep
 * using `createIndexedDBStorage` directly — the queue overhead isn't
 * worth it for small blobs.
 */
export const createQueuedIndexedDBStorage = (
  storageKey: string
): PersistStorage<unknown> => {
  const base = createIndexedDBStorage(storageKey);
  return {
    ...base,
    getItem: (name: string) =>
      liveStoreHydrationQueue.enqueue(`store:${storageKey}`, async () =>
        // `getItem` on PersistStorage is typed to allow sync or async
        // returns. Our IDB-backed implementation is always async; force
        // the result through `await` so the queue's Promise<T> resolves
        // to the concrete value rather than Promise<Promise<...>>.
        await base.getItem(name)
      ),
  };
};
