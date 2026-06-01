import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ShareContext {
  shareId: string | null;
  backtestShareId: string | null;
  isDemo: boolean;
}

/**
 * Single source of truth for share-link query params (`?share=` and
 * `?backtestShare=`). Returned `isDemo` is true when either is present —
 * callers thread it through to the data layer (e.g. token = 'demo').
 *
 * Mirrors the legacy main-dash AuthProvider share detection but exposes the
 * ids rather than driving the auth flow.
 */
export function useShareContext(): ShareContext {
  const [searchParams] = useSearchParams();

  return useMemo<ShareContext>(() => {
    const shareId = searchParams.get('share');
    const backtestShareId = searchParams.get('backtestShare');
    return {
      shareId,
      backtestShareId,
      isDemo: !!shareId || !!backtestShareId,
    };
  }, [searchParams]);
}

export default useShareContext;
