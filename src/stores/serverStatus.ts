/**
 * Server Status Store
 *
 * This Zustand store manages server status information globally across the application.
 *
 * Created for shared state between components that need server status information:
 * - Health page components (StatusIndicator, ActionsPanel)
 * - Potentially navbar for global status indicator
 * - Dashboard widgets that depend on server connectivity
 *
 * Benefits of shared store vs local state:
 * - Eliminates duplicate server status checks
 * - Consistent status across all components
 * - Centralized error handling and logging
 * - Easy to extend with additional server status features
 *
 * Usage:
 * - Use `useServerStatusPolling()` hook for components that need automatic polling
 * - Use individual selector hooks (e.g., `useServerOnlineStatus()`) for specific data
 * - Use `useServerStatusActions()` for manual status checks and updates
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { logger } from '../lib/loggerInstance';

export interface ServerStatus {
  isOnline: boolean;
  lastChecked: Date;
  error?: string;
  responseTime?: number;
}

interface ServerStatusState extends ServerStatus {
  isChecking: boolean;

  // Actions
  setStatus: (status: Partial<ServerStatus>) => void;
  setChecking: (isChecking: boolean) => void;
  checkServerStatus: (url?: string) => Promise<ServerStatus>;
  resetStatus: () => void;
}

const DEFAULT_URL = 'http://localhost:5173';

const initialState: ServerStatus = {
  isOnline: false,
  lastChecked: new Date(),
};

export const useServerStatusStore = create<ServerStatusState>()(
  devtools(
    (set) => ({
      // Initial state
      ...initialState,
      isChecking: false,

      // Actions
      setStatus: (status) =>
        set((state) => ({
          ...state,
          ...status,
          lastChecked: new Date(),
        })),

      setChecking: (isChecking) => set({ isChecking }),

      checkServerStatus: async (url = DEFAULT_URL): Promise<ServerStatus> => {
        const startTime = Date.now();

        logger.info('Checking server status', { url });

        // Set checking state
        set({ isChecking: true });

        try {
          // Perform HEAD request to check server availability
          await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
          });

          const responseTime = Date.now() - startTime;
          const newStatus: ServerStatus = {
            isOnline: true,
            lastChecked: new Date(),
            responseTime,
          };

          logger.info('Server status check completed', {
            isOnline: true,
            responseTime: `${responseTime}ms`,
          });

          // Update store state
          set({
            ...newStatus,
            isChecking: false,
          });

          return newStatus;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          const newStatus: ServerStatus = {
            isOnline: false,
            lastChecked: new Date(),
            error: errorMessage,
            responseTime,
          };

          logger.warn('Server status check failed', {
            error: errorMessage,
            responseTime: `${responseTime}ms`,
          });

          // Update store state
          set({
            ...newStatus,
            isChecking: false,
          });

          return newStatus;
        }
      },

      resetStatus: () =>
        set({
          ...initialState,
          isChecking: false,
        }),
    }),
    {
      name: 'server-status-store',
    }
  )
);

// Convenience hooks for specific parts of the state
export const useServerOnlineStatus = () =>
  useServerStatusStore((state) => state.isOnline);
export const useServerLastChecked = () =>
  useServerStatusStore((state) => state.lastChecked);
export const useServerIsChecking = () =>
  useServerStatusStore((state) => state.isChecking);
export const useServerError = () =>
  useServerStatusStore((state) => state.error);
export const useServerResponseTime = () =>
  useServerStatusStore((state) => state.responseTime);

// Action hooks
export const useServerStatusActions = () =>
  useServerStatusStore((state) => ({
    setStatus: state.setStatus,
    setChecking: state.setChecking,
    checkServerStatus: state.checkServerStatus,
    resetStatus: state.resetStatus,
  }));
