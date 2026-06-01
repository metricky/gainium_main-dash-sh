import { toast } from '@/lib/toast';
import { useCallback, useRef, useState } from 'react';
import { useUserFees } from './useUserFeesService';
import type { UserFeeEntry } from '@/stores/userFeesStore';

export interface UseUserFeeOptions {
  /** Show toast notifications on success/error. Default: true */
  showToasts?: boolean;
}

export interface UseUserFeeResult {
  /** Fetched user fee data, or null if not yet fetched or failed */
  userFee: UserFeeEntry | null;
  /** Whether a fetch is currently in progress */
  isLoading: boolean;
  /** Error message if the last fetch failed */
  error: string | null;
  /** Fetch user fee for a given exchange UUID and symbol */
  fetchUserFee: (
    exchangeUUID: string,
    symbol: string
  ) => Promise<UserFeeEntry | null>;
  /** Reset the state (clear userFee, error, etc.) */
  reset: () => void;
}

export function useUserFee(options: UseUserFeeOptions = {}): UseUserFeeResult {
  const { showToasts = true } = options;

  const [userFee, setUserFee] = useState<UserFeeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const lastSuccessKeyRef = useRef<string | null>(null);
  const { fetchMultipleFees } = useUserFees();
  const fetchUserFee = useCallback(
    async (
      exchangeUUID: string,
      symbol: string
    ): Promise<UserFeeEntry | null> => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      const result = await fetchMultipleFees({
        exchangeSymbolMap: new Map().set(exchangeUUID, new Set([symbol])),
      }).catch((err) => {
        setError('Failed to fetch user fee');
        setUserFee(null);
        if (showToasts) {
          toast.error(`Error fetching user fee: ${err.message || err}`);
        }
        return null;
      });
      setIsLoading(false);
      if (requestIdRef.current !== requestId) {
        return null;
      }
      if (!result) {
        return null;
      }
      if (!result[0]) {
        setError('User fee not found');
        setUserFee(null);
        if (showToasts) {
          toast.error(`User fee not found for ${symbol}.`);
        }
        return null;
      }
      // Successful fee lookup is intentionally silent — the resolved fee
      // is already shown inline in the bot form's fee field, so a toast
      // every time the user picks a pair is noise. Errors still toast.
      setUserFee(result[0]);
      setError(null);
      return result[0];
    },
    [showToasts, fetchMultipleFees]
  );

  const reset = useCallback(() => {
    setUserFee(null);
    setError(null);
    setIsLoading(false);
    lastSuccessKeyRef.current = null;
  }, []);

  return {
    userFee,
    isLoading,
    error,
    fetchUserFee,
    reset,
  };
}
