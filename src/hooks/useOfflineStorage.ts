import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  expiry?: number; // in milliseconds
  key: string;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiry?: number;
}

export const useOfflineStorage = <T>(options: CacheOptions) => {
  const { key, expiry } = options;
  const [cachedData, setCachedData] = useState<T | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Load data from cache on mount
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const stored = localStorage.getItem(`offline_${key}`);
        if (stored) {
          const parsed: CachedData<T> = JSON.parse(stored);
          const isExpired = expiry && Date.now() - parsed.timestamp > expiry;

          if (!isExpired) {
            setCachedData(parsed.data);
            setIsFromCache(true);
            return parsed.data;
          } else {
            // Remove expired data
            localStorage.removeItem(`offline_${key}`);
          }
        }
      } catch (error) {
        console.warn('Failed to load cached data:', error);
        localStorage.removeItem(`offline_${key}`);
      }
      return null;
    };

    loadFromCache();
  }, [key, expiry]);

  // Save data to cache
  const saveToCache = (data: T) => {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        ...(expiry && { expiry }),
      };
      localStorage.setItem(`offline_${key}`, JSON.stringify(cacheData));
      setCachedData(data);
      setIsFromCache(false);
    } catch (error) {
      console.warn('Failed to save data to cache:', error);
    }
  };

  // Clear cached data
  const clearCache = () => {
    try {
      localStorage.removeItem(`offline_${key}`);
      setCachedData(null);
      setIsFromCache(false);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  };

  // Get cache status
  const getCacheInfo = () => {
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const parsed: CachedData<T> = JSON.parse(stored);
        const isExpired = expiry && Date.now() - parsed.timestamp > expiry;
        return {
          hasCache: true,
          isExpired,
          timestamp: parsed.timestamp,
          age: Date.now() - parsed.timestamp,
        };
      }
    } catch (error) {
      console.warn('Failed to get cache info:', error);
    }
    return {
      hasCache: false,
      isExpired: false,
      timestamp: null,
      age: 0,
    };
  };

  return {
    cachedData,
    isFromCache,
    saveToCache,
    clearCache,
    getCacheInfo,
  };
};

// Hook for API requests with offline fallback
export const useOfflineQuery = <T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  options?: {
    expiry?: number;
    enabled?: boolean;
    fallbackToCache?: boolean;
  }
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { cachedData, isFromCache, saveToCache, getCacheInfo } =
    useOfflineStorage<T>({
      key: cacheKey,
      ...(options?.expiry && { expiry: options.expiry }),
    });

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set cached data as initial data
  useEffect(() => {
    if (cachedData && !data) {
      setData(cachedData);
    }
  }, [cachedData, data]);

  const refetch = useCallback(async () => {
    if (!isOnline && options?.fallbackToCache !== false) {
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      } else {
        throw new Error('No cached data available while offline');
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      saveToCache(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);

      // Fall back to cache if available and fallback is enabled
      if (options?.fallbackToCache !== false && cachedData) {
        setData(cachedData);
        return cachedData;
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, queryFn, saveToCache, cachedData, options]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options?.enabled !== false && isOnline) {
      refetch().catch(() => {
        // Error is already handled in refetch
      });
    }
  }, [options?.enabled, isOnline, refetch]);

  return {
    data,
    isLoading,
    error,
    isFromCache: isFromCache && data === cachedData,
    isOnline,
    refetch,
    cacheInfo: getCacheInfo(),
  };
};
