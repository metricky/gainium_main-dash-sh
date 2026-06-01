/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from './loggerInstance';
/**
 * Offline Data Manager
 * Handles caching strategies for different types of application data
 */
class OfflineDataManager {
  private static instance: OfflineDataManager;
  private dbName = 'GainiumOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private constructor() {
    this.initDB();
  }

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores for different data types
        if (!db.objectStoreNames.contains('portfolioData')) {
          const portfolioStore = db.createObjectStore('portfolioData', {
            keyPath: 'id',
          });
          portfolioStore.createIndex('timestamp', 'timestamp', {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains('priceData')) {
          const priceStore = db.createObjectStore('priceData', {
            keyPath: 'symbol',
          });
          priceStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('tradeHistory')) {
          const tradeStore = db.createObjectStore('tradeHistory', {
            keyPath: 'id',
          });
          tradeStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('userSettings')) {
          db.createObjectStore('userSettings', { keyPath: 'key' });
        }
      };
    });
  }

  async storePortfolioData(data: any): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['portfolioData'], 'readwrite');
    const store = transaction.objectStore('portfolioData');

    const dataWithTimestamp = {
      ...data,
      timestamp: Date.now(),
      id: data.id || 'portfolio-main',
    };

    return new Promise((resolve, reject) => {
      const request = store.put(dataWithTimestamp);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPortfolioData(): Promise<any | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['portfolioData'], 'readonly');
    const store = transaction.objectStore('portfolioData');

    return new Promise((resolve, reject) => {
      const request = store.get('portfolio-main');
      request.onsuccess = () => {
        const result = request.result;
        // Check if data is not too old (24 hours)
        if (result && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async storePriceData(symbol: string, data: any): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['priceData'], 'readwrite');
    const store = transaction.objectStore('priceData');

    const dataWithTimestamp = {
      symbol,
      ...data,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(dataWithTimestamp);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPriceData(symbol: string): Promise<any | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['priceData'], 'readonly');
    const store = transaction.objectStore('priceData');

    return new Promise((resolve, reject) => {
      const request = store.get(symbol);
      request.onsuccess = () => {
        const result = request.result;
        // Check if data is not too old (5 minutes for price data)
        if (result && Date.now() - result.timestamp < 5 * 60 * 1000) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async storeTradeHistory(trades: any[]): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['tradeHistory'], 'readwrite');
    const store = transaction.objectStore('tradeHistory');

    const promises = trades.map((trade) => {
      const tradeWithTimestamp = {
        ...trade,
        cachedAt: Date.now(),
      };

      return new Promise<void>((resolve, reject) => {
        const request = store.put(tradeWithTimestamp);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  async getTradeHistory(): Promise<any[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['tradeHistory'], 'readonly');
    const store = transaction.objectStore('tradeHistory');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result || [];
        // Filter out old cached data (24 hours)
        const validResults = results.filter(
          (trade) => Date.now() - trade.cachedAt < 24 * 60 * 60 * 1000
        );
        resolve(validResults);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async storeUserSettings(key: string, value: any): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['userSettings'], 'readwrite');
    const store = transaction.objectStore('userSettings');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserSettings(key: string): Promise<any | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['userSettings'], 'readonly');
    const store = transaction.objectStore('userSettings');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredData(): Promise<void> {
    if (!this.db) return;

    const now = Date.now();
    const stores = ['portfolioData', 'priceData', 'tradeHistory'];
    const expirationTimes = {
      portfolioData: 24 * 60 * 60 * 1000, // 24 hours
      priceData: 5 * 60 * 1000, // 5 minutes
      tradeHistory: 24 * 60 * 60 * 1000, // 24 hours
    };

    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore('storeName');
      const index = store.index('timestamp');
      const expirationTime =
        expirationTimes[storeName as keyof typeof expirationTimes];

      const range = IDBKeyRange.upperBound(now - expirationTime);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { used: 0, quota: 0 };
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;

    const storeNames = [
      'portfolioData',
      'priceData',
      'tradeHistory',
      'userSettings',
    ];

    for (const storeName of storeNames) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

export default OfflineDataManager;
