import { useIsReadOnly } from '@/lib/demoMode';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to redirect from bot pages when in demo mode
 */
export const useBotPageRedirect = (redirectPath: string) => {
  const navigate = useNavigate();
  const isReadOnly = useIsReadOnly();

  useEffect(() => {
    if (isReadOnly) {
      navigate(redirectPath, { replace: true });
    }
  }, [isReadOnly, navigate, redirectPath]);

  return isReadOnly;
};
