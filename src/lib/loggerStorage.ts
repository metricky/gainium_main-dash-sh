/**
 * Logger Storage using IndexedDB
 * Provides a more robust storage solution for logs with much higher capacity than localStorage
 */

import type { LogEntry } from './loggerInstance';

const DB_NAME = 'DashboardLoggerDB';
const DB_VERSION = 1;
const STORE_NAME = 'logs';
const CONFIG_STORE_NAME = 'config';
const MAX_LOGS = 1000;

class LoggerStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create logs object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const logsStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: false,
          });
          // Create index on timestamp for efficient sorting
          logsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create config object store if it doesn't exist
        if (!db.objectStoreNames.contains(CONFIG_STORE_NAME)) {
          db.createObjectStore(CONFIG_STORE_NAME, { keyPath: 'key' });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Save a log entry to IndexedDB
   */
  async saveLog(entry: LogEntry): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.add(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Clean up old logs if we exceed the limit
      await this.trimLogs();
    } catch (error) {
      console.error('Failed to save log to IndexedDB:', error);
      // Fallback to console
      throw error;
    }
  }

  /**
   * Get all logs from IndexedDB, sorted by timestamp (newest first)
   */
  async getLogs(): Promise<LogEntry[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const logs = request.result || [];
          // Sort by timestamp, newest first
          logs.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          resolve(logs);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to retrieve logs from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Clear all logs from IndexedDB
   */
  async clearLogs(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to clear logs from IndexedDB:', error);
    }
  }

  /**
   * Clear logs by category
   */
  async clearLogsByCategory(category: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const logs = await this.getLogs();
      const toDelete = logs.filter((log) => log.category === category);

      await Promise.all(
        toDelete.map(
          (log) =>
            new Promise<void>((resolve, reject) => {
              const request = store.delete(log.id);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            })
        )
      );
    } catch (error) {
      console.error('Failed to clear logs by category:', error);
    }
  }

  /**
   * Trim logs to keep only the most recent MAX_LOGS entries
   */
  private async trimLogs(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      // Get count of logs
      const countRequest = store.count();
      const count = await new Promise<number>((resolve, reject) => {
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => reject(countRequest.error);
      });

      // If we're over the limit, delete oldest logs
      if (count > MAX_LOGS) {
        const logsToDelete = count - MAX_LOGS;
        const request = index.openCursor(null, 'next'); // Oldest first

        let deleted = 0;
        await new Promise<void>((resolve, reject) => {
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor && deleted < logsToDelete) {
              cursor.delete();
              deleted++;
              cursor.continue();
            } else {
              resolve();
            }
          };
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error('Failed to trim logs:', error);
    }
  }

  /**
   * Save configuration to IndexedDB
   */
  async saveConfig(config: unknown): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([CONFIG_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CONFIG_STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({ key: 'logger-config', value: config });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save config to IndexedDB:', error);
    }
  }

  /**
   * Load configuration from IndexedDB
   */
  async loadConfig(): Promise<unknown | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([CONFIG_STORE_NAME], 'readonly');
      const store = transaction.objectStore(CONFIG_STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get('logger-config');
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to load config from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Migrate data from localStorage to IndexedDB
   */
  async migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Check if we already have logs in IndexedDB
      const existingLogs = await this.getLogs();
      if (existingLogs.length > 0) {
        // Use console.debug to avoid polluting developer console with expected state
        console.debug(
          '[LoggerStorage] IndexedDB already has logs, skipping migration'
        );
        return;
      }

      // Migrate ungrouped logs
      const ungroupedLogsStr = localStorage.getItem('dashboard-logs-ungrouped');
      if (ungroupedLogsStr) {
        const ungroupedLogs = JSON.parse(ungroupedLogsStr) as LogEntry[];
        console.debug(
          `[LoggerStorage] Migrating ${ungroupedLogs.length} logs from localStorage`
        );

        const db = await this.getDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        for (const log of ungroupedLogs) {
          await new Promise<void>((resolve, reject) => {
            const request = store.add(log);
            request.onsuccess = () => resolve();
            request.onerror = () => {
              // Ignore duplicate key errors
              if ((request.error as DOMException)?.name === 'ConstraintError') {
                resolve();
              } else {
                reject(request.error);
              }
            };
          });
        }

        console.debug(
          '[LoggerStorage] Migration complete, cleaning up localStorage'
        );
        // Clear localStorage after successful migration
        localStorage.removeItem('dashboard-logs-ungrouped');
        localStorage.removeItem('dashboard-logs'); // Legacy
      }

      // Migrate config
      const configStr = localStorage.getItem('logger-config');
      if (configStr) {
        const config = JSON.parse(configStr);
        await this.saveConfig(config);
        localStorage.removeItem('logger-config');
      }
    } catch (error) {
      console.error('[LoggerStorage] Migration failed:', error);
    }
  }
}

// Export singleton instance
export const loggerStorage = new LoggerStorage();
