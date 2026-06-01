import { useEffect, useState } from 'react';

/**
 * Hook to manage initial loading state for bot pages
 */
export const useBotPageLoading = (delayMs: number = 1000) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return isLoading;
};
