/**
 * Price Cache using IndexedDB
 * Provides fast retrieval of cached prices on page reload
 * Automatically migrates from localStorage if available
 */

import { StatusEnum, type GetLatestPricesResult, type Prices } from '../types';
import { logger } from './loggerInstance';

const DB_NAME = 'GainiumPriceCache';
const DB_VERSION = 1;
const STORE_NAME = 'prices';
const CACHE_KEY = 'latest-prices';
const TIMESTAMP_KEY = 'cache-timestamp';
const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes

class PriceCache {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private cachedPrices: Prices | null = null;
  private cacheTimestamp: number = 0;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('[PriceCache] Failed to open database:', request.error);
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

  /**
   * Save prices to IndexedDB cache
   */
  async savePrices(result: GetLatestPricesResult): Promise<void> {
    if (result.status !== 'OK' || !result.data) {
      return;
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const timestamp = Date.now();

      // Save prices
      await new Promise<void>((resolve, reject) => {
        const pricesRequest = store.put(result.data, CACHE_KEY);

        pricesRequest.onsuccess = () => {
          logger.debug('[PriceCache] Prices saved to cache');
          resolve();
        };

        pricesRequest.onerror = () => {
          logger.error(
            '[PriceCache] Failed to save prices:',
            pricesRequest.error
          );
          reject(pricesRequest.error);
        };
      });

      // Save timestamp
      await new Promise<void>((resolve, reject) => {
        const timestampRequest = store.put(timestamp, TIMESTAMP_KEY);

        timestampRequest.onsuccess = () => {
          logger.debug('[PriceCache] Cache timestamp saved');
          resolve();
        };

        timestampRequest.onerror = () => {
          logger.error(
            '[PriceCache] Failed to save timestamp:',
            timestampRequest.error
          );
          reject(timestampRequest.error);
        };
      });

      // Update in-memory cache
      this.cachedPrices = result.data;
      this.cacheTimestamp = timestamp;
    } catch (error) {
      logger.warn('[PriceCache] Failed to save prices to IndexedDB:', error);
      // Don't throw - allow app to continue even if caching fails
    }
  }

  /**
   * Load prices from IndexedDB cache
   */
  async loadPrices(): Promise<GetLatestPricesResult | null> {
    try {
      // Return in-memory cache if available and fresh
      if (this.cachedPrices && this.cacheTimestamp) {
        const age = Date.now() - this.cacheTimestamp;
        if (age < MAX_CACHE_AGE) {
          logger.debug('[PriceCache] Using in-memory cache, age:', {
            age,
            unit: 'ms',
          });
          return {
            status: StatusEnum.ok,
            reason: null,
            data: this.cachedPrices,
          };
        }
      }

      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      // Load prices
      const prices = await new Promise<Prices | undefined>(
        (resolve, reject) => {
          const request = store.get(CACHE_KEY);

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            logger.error('[PriceCache] Failed to load prices:', request.error);
            reject(request.error);
          };
        }
      );

      if (!prices) {
        logger.debug('[PriceCache] No cached prices found');
        return null;
      }

      // Load timestamp
      const timestamp = await new Promise<number | undefined>(
        (resolve, reject) => {
          const request = store.get(TIMESTAMP_KEY);

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            logger.error(
              '[PriceCache] Failed to load timestamp:',
              request.error
            );
            reject(request.error);
          };
        }
      );

      if (!timestamp) {
        logger.debug('[PriceCache] No cache timestamp found');
        return null;
      }

      // Check if cache is still fresh
      const age = Date.now() - timestamp;
      if (age > MAX_CACHE_AGE) {
        logger.debug('[PriceCache] Cache expired, age:', { age, unit: 'ms' });
        return null;
      }

      // Update in-memory cache
      this.cachedPrices = prices;
      this.cacheTimestamp = timestamp;

      logger.debug('[PriceCache] Loaded from IndexedDB cache, age:', {
        age,
        unit: 'ms',
      });
      return {
        status: StatusEnum.ok,
        reason: null,
        data: prices,
      };
    } catch (error) {
      logger.warn('[PriceCache] Failed to load prices from IndexedDB:', error);
      // Fallback to localStorage migration
      return this.loadFromLocalStorage();
    }
  }

  /**
   * Load from localStorage (for migration from older app versions)
   */
  private loadFromLocalStorage(): GetLatestPricesResult | null {
    try {
      if (typeof window === 'undefined') return null;

      const localData = localStorage.getItem('gainium-latest-prices');
      const localTimestamp = localStorage.getItem('gainium-prices-timestamp');

      if (!localData || !localTimestamp) {
        return null;
      }

      const timestamp = parseInt(localTimestamp, 10);
      const age = Date.now() - timestamp;

      if (age > MAX_CACHE_AGE) {
        logger.debug('[PriceCache] localStorage cache expired');
        return null;
      }

      const prices = JSON.parse(localData) as Prices;

      // Migrate to IndexedDB
      logger.debug(
        '[PriceCache] Migrating prices from localStorage to IndexedDB'
      );
      this.savePrices({
        status: StatusEnum.ok,
        reason: null,
        data: prices,
      }).catch((error) => {
        logger.warn('[PriceCache] Migration to IndexedDB failed:', error);
      });

      // Clear localStorage
      localStorage.removeItem('gainium-latest-prices');
      localStorage.removeItem('gainium-prices-timestamp');

      return {
        status: StatusEnum.ok,
        reason: null,
        data: prices,
      };
    } catch (error) {
      logger.warn('[PriceCache] Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const pricesRequest = store.delete(CACHE_KEY);
        const timestampRequest = store.delete(TIMESTAMP_KEY);

        pricesRequest.onerror = () => reject(pricesRequest.error);
        timestampRequest.onerror = () => reject(timestampRequest.error);

        Promise.all([
          new Promise(
            (resolve) => (pricesRequest.onsuccess = () => resolve(null))
          ),
          new Promise(
            (resolve) => (timestampRequest.onsuccess = () => resolve(null))
          ),
        ]).then(() => resolve());
      });
      this.cachedPrices = null;
      this.cacheTimestamp = 0;

      logger.debug('[PriceCache] Cache cleared');
    } catch (error) {
      logger.warn('[PriceCache] Failed to clear cache:', error);
    }
  }
}

// Export singleton instance
export const priceCache = new PriceCache();

/**
 * Get cached prices if available
 */
export async function getCachedPrices(): Promise<GetLatestPricesResult | null> {
  return priceCache.loadPrices();
}

/**
 * Save prices to cache
 */
export async function saveCachedPrices(
  result: GetLatestPricesResult
): Promise<void> {
  return priceCache.savePrices(result);
}

/**
 * Clear price cache
 */
export async function clearPriceCache(): Promise<void> {
  return priceCache.clearCache();
}
