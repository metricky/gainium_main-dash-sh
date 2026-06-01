/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from './loggerInstance';
import OfflineDataManager from './offlineDataManager';
import { enhancedFetch } from './offlineQueueManager';

interface CacheConfig {
  storeOffline?: boolean;
  cacheKey?: string;
  fallbackData?: any;
  maxRetries?: number;
}

/**
 * Enhanced API client with offline support
 */
export class OfflineApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private offlineDataManager: OfflineDataManager;

  constructor(
    baseURL: string = '',
    defaultHeaders: Record<string, string> = {}
  ) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
    this.offlineDataManager = OfflineDataManager.getInstance();
  }

  async get<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheConfig: CacheConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const {
      storeOffline = true,
      cacheKey,
      fallbackData,
      maxRetries = 3,
    } = cacheConfig;

    try {
      const response = await enhancedFetch(
        url,
        {
          method: 'GET',
          headers: { ...this.defaultHeaders, ...options.headers },
          ...options,
        },
        { maxRetries }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store successful responses offline if enabled
      if (storeOffline && cacheKey) {
        await this.storeDataOffline(cacheKey, data);
      }

      return data;
    } catch (error) {
      console.warn(`API request failed for ${endpoint}:`, error);

      // Try to get cached data if offline
      if (!navigator.onLine && cacheKey) {
        const cachedData = await this.getCachedData(cacheKey);
        if (cachedData) {
          logger.info(`Returning cached data for ${endpoint}`);
          return cachedData;
        }
      }

      // Return fallback data if available
      if (fallbackData) {
        logger.info(`Returning fallback data for ${endpoint}`);
        return fallbackData;
      }

      throw error;
    }
  }

  async post<T>(
    endpoint: string,
    data: any,
    options: RequestInit = {},
    cacheConfig: CacheConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { maxRetries = 3 } = cacheConfig;

    const response = await enhancedFetch(
      url,
      {
        method: 'POST',
        headers: { ...this.defaultHeaders, ...options.headers },
        body: JSON.stringify(data),
        ...options,
      },
      { maxRetries }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async put<T>(
    endpoint: string,
    data: any,
    options: RequestInit = {},
    cacheConfig: CacheConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { maxRetries = 3 } = cacheConfig;

    const response = await enhancedFetch(
      url,
      {
        method: 'PUT',
        headers: { ...this.defaultHeaders, ...options.headers },
        body: JSON.stringify(data),
        ...options,
      },
      { maxRetries }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async delete<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheConfig: CacheConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { maxRetries = 3 } = cacheConfig;

    const response = await enhancedFetch(
      url,
      {
        method: 'DELETE',
        headers: { ...this.defaultHeaders, ...options.headers },
        ...options,
      },
      { maxRetries }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async storeDataOffline(key: string, data: any): Promise<void> {
    try {
      // Store different types of data in appropriate stores
      if (key.includes('portfolio')) {
        await this.offlineDataManager.storePortfolioData(data);
      } else if (key.includes('price') || key.includes('ticker')) {
        const symbol = this.extractSymbolFromKey(key);
        if (symbol) {
          await this.offlineDataManager.storePriceData(symbol, data);
        }
      } else if (key.includes('trade') || key.includes('history')) {
        if (Array.isArray(data)) {
          await this.offlineDataManager.storeTradeHistory(data);
        }
      } else {
        await this.offlineDataManager.storeUserSettings(key, data);
      }
    } catch (error) {
      console.error('Failed to store data offline:', error);
    }
  }

  private async getCachedData(key: string): Promise<any> {
    try {
      if (key.includes('portfolio')) {
        return await this.offlineDataManager.getPortfolioData();
      } else if (key.includes('price') || key.includes('ticker')) {
        const symbol = this.extractSymbolFromKey(key);
        if (symbol) {
          return await this.offlineDataManager.getPriceData(symbol);
        }
      } else if (key.includes('trade') || key.includes('history')) {
        return await this.offlineDataManager.getTradeHistory();
      } else {
        return await this.offlineDataManager.getUserSettings(key);
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  private extractSymbolFromKey(key: string): string | null {
    // Extract symbol from cache keys like "price-BTC" or "ticker-ETH-USD"
    const match = key.match(/(?:price|ticker)-([A-Z0-9]+)/);
    return match ? match[1] : null;
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }
}

// Create singleton instance
export const offlineApiClient = new OfflineApiClient();

// Development environment support
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  offlineApiClient.setBaseURL('http://localhost:7500');
}

export default offlineApiClient;
