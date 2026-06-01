import { GraphQLClient, GraphQlQuery, type ReturnResult } from '@/lib/api';
import {
  hasExitedDemoModeLocally,
  setDemoModeExitOverride,
} from '@/lib/demoMode';
import { logger } from '@/lib/loggerInstance';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';

// Module-level flag: once initialized from user profile in a session,
// don't re-sync on navigation (prevents overwriting optimistic updates).
// Resets on full page reload when the module re-evaluates.
let _sessionInitialized = false;

/**
 * Hook for managing paper context (live vs paper trading mode)
 * This hook:
 * 1. Initializes the UI store from the user profile paperContext
 * 2. Provides functions to update the paperContext on the server
 * 3. Syncs changes to localStorage via the UI store
 */
export function usePaperContext() {
  const { tokens } = useAuthStore();
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);
  const tradingMode = useUIStore((s) => s.tradingMode);
  const setTradingMode = useUIStore((s) => s.setTradingMode);
  const setTradingModeValue = useUIStore((s) => s.setTradingModeValue);
  const { userProfile, isSuccess: isUserProfileSuccess } = useUserProfile();
  const queryClient = useQueryClient();

  // Initialize UI store from user profile on first load only
  useEffect(() => {
    if (isUserProfileSuccess && userProfile && !_sessionInitialized) {
      // URL params are not used for auto-activation of demo mode here
      // (demo mode is only activated at the end of onboarding via UI action).

      // Check if user is a demo user from backend
      const isDemoUser = userProfile.demo === true;

      // Determine trading mode
      const hasLocalDemoExit = hasExitedDemoModeLocally();

      // NOTE:
      // Previously, demo mode was auto-activated when the backend
      // indicated a demo user or URL contained mode=demo. This behavior
      // can cause demo mode to activate immediately after login (e.g., in
      // incognito windows). Demo mode should only be enabled at the end
      // of the onboarding flow. We therefore no longer auto-activate demo
      // mode here based on the profile/url; onboarding completion handles
      // demo activation explicitly.
      logger.info('[demo-dismiss] initializing trading mode', {
        isDemoUser,
        hasLocalDemoExit,
        paperContext: userProfile.paperContext,
      });

      // Only set trading mode from the profile's paperContext (live/paper)
      // The demo flag in profile is intentionally ignored during
      // initialization to avoid early auto-activation; demo should be
      // activated via onboarding completion or explicit user action.
      if (userProfile.paperContext !== undefined) {
        // Regular users: paperContext from profile
        const shouldBeLiveTrading = !userProfile.paperContext;

        // Only update if different to avoid unnecessary re-renders
        if (isLiveTrading !== shouldBeLiveTrading) {
          logger.info('[demo-dismiss] syncing trading mode from user profile', {
            shouldBeLiveTrading,
          });
          setTradingMode(shouldBeLiveTrading);
          logger.debug('Initialized trading mode from user profile', {
            paperContext: userProfile.paperContext,
            isLiveTrading: shouldBeLiveTrading,
          });
        }
      }

      // Mark as initialized for the entire session
      _sessionInitialized = true;
    }
  }, [
    isUserProfileSuccess,
    userProfile,
    setTradingMode,
    setTradingModeValue,
    isLiveTrading,
  ]);

  // Mutation to update paperContext on the server
  const updatePaperContextMutation = useMutation({
    mutationFn: async (paperContext: boolean) => {
      if (!tokens?.accessToken) {
        throw new Error('No authentication token available');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      const client = new GraphQLClient(endpoint, tokens.accessToken);

      const { query, variables } = GraphQlQuery.setUserSettings({
        paperContext,
      });

      const result = await client.request<{
        userSettings: ReturnResult<unknown>;
      }>(query, variables);

      if (result.userSettings.status !== 'OK') {
        throw new Error(
          result.userSettings.reason || 'Failed to update paper context'
        );
      }

      return result.userSettings;
    },
    onSuccess: (data, paperContext) => {
      logger.info('Paper context updated successfully', {
        paperContext,
        response: data,
      });

      // Store was already updated optimistically — just refresh the profile cache
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error, paperContext) => {
      logger.error('Failed to update paper context', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Revert the optimistic update: paperContext is the desired new value,
      // so reverting means going back to the opposite.
      setTradingMode(paperContext);
    },
  });

  // Function to set paper context (true = paper trading, false = live trading)
  const setPaperContext = useCallback(
    (paperContext: boolean) => {
      logger.info('[demo-dismiss] setPaperContext invoked', { paperContext });
      // Optimistically update the store so navigation picks up the new mode
      setTradingMode(!paperContext);
      updatePaperContextMutation.mutate(paperContext);

      // Any explicit paper/live selection exits demo mode until user opts back in
      setDemoModeExitOverride(true);
    },
    [updatePaperContextMutation, setTradingMode]
  );

  // Function to set live trading mode (true = live trading, false = paper trading)
  const setLiveTrading = useCallback(
    (isLive: boolean) => {
      const paperContext = !isLive;
      logger.info('[demo-dismiss] setLiveTrading invoked', {
        isLive,
        paperContext,
      });
      // Optimistically update the store so navigation picks up the new mode
      setTradingMode(isLive);
      updatePaperContextMutation.mutate(paperContext);

      // Flag that user intentionally exited demo mode when switching to live/paper
      setDemoModeExitOverride(true);
    },
    [updatePaperContextMutation, setTradingMode]
  );

  // Function to toggle between live and paper trading
  const toggleTradingMode = useCallback(() => {
    // Don't allow toggling in demo mode
    if (tradingMode === 'demo') {
      logger.warn('[demo-dismiss] toggleTradingMode blocked in demo mode');
      return;
    }

    const newPaperContext = isLiveTrading; // If currently live, switch to paper
    logger.info('[demo-dismiss] toggleTradingMode invoked', {
      newPaperContext,
    });
    // Optimistically update the store so navigation picks up the new mode
    setTradingMode(!isLiveTrading);
    updatePaperContextMutation.mutate(newPaperContext);
  }, [isLiveTrading, tradingMode, updatePaperContextMutation, setTradingMode]);

  return {
    // Current state
    isLiveTrading,
    isPaperTrading: !isLiveTrading,
    paperContext: !isLiveTrading, // For compatibility with existing code
    tradingMode,
    isDemoMode: tradingMode === 'demo',

    // Actions
    setPaperContext,
    setLiveTrading,
    toggleTradingMode,

    // Mutation state
    isUpdating: updatePaperContextMutation.isPending,
    error: updatePaperContextMutation.error,
  };
}
