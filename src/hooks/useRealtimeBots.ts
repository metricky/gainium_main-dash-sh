/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '../lib/loggerInstance';
import type { DcaBot } from '../types/dcaBot';

// Bot update interface for WebSocket events
interface BotUpdateEvent {
  type:
    | 'bot_update'
    | 'bot_status_change'
    | 'bot_profit_update'
    | 'bot_created'
    | 'bot_deleted';
  botId: string;
  data: Partial<DcaBot>;
  timestamp: number;
}

// Bot statistics update interface
interface BotStatsUpdateEvent {
  type: 'bot_stats_update';
  data: {
    closedTrades: number;
    profit: number;
    accumulatedProfit: { value: number };
    profitByDay: { value: number };
  };
  timestamp: number;
}

/**
 * Hook for real-time bot data updates via WebSocket
 * Integrates with TanStack Query to provide seamless data updates
 */
export function useRealtimeBots() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check if socket is available
    const socket = (window as any).socket;
    if (!socket) {
      logger.warn(
        '[useRealtimeBots] Socket not available, real-time updates disabled'
      );
      return;
    }

    // Handler for individual bot updates
    const handleBotUpdate = (event: BotUpdateEvent) => {
      logger.info('[useRealtimeBots] Received bot update:', event);

      try {
        // Update the specific bot in the dcaBots query cache
        queryClient.setQueryData(['dcaBots'], (oldData: any) => {
          if (!oldData?.data?.result) return oldData;

          const updatedBots = oldData.data.result.map((bot: DcaBot) => {
            if (bot._id === event.botId) {
              return {
                ...bot,
                ...event.data,
                // Preserve nested objects while updating
                ...(event.data.settings && {
                  settings: {
                    ...bot.settings,
                    ...event.data.settings,
                  },
                }),
                // Update timestamp for cache invalidation
                lastUpdated: event.timestamp,
              };
            }
            return bot;
          });

          return {
            ...oldData,
            data: {
              ...oldData.data,
              result: updatedBots,
            },
          };
        });

        // Also update individual bot cache if it exists
        queryClient.setQueryData(
          ['bot', event.botId],
          (oldBot: DcaBot | undefined) => {
            if (!oldBot) return oldBot;

            return {
              ...oldBot,
              ...event.data,
              ...(event.data.settings && {
                settings: {
                  ...oldBot.settings,
                  ...event.data.settings,
                },
              }),
              lastUpdated: event.timestamp,
            };
          }
        );

        // Trigger soft refetch to ensure data consistency
        queryClient.invalidateQueries({
          queryKey: ['dcaBots'],
          exact: false,
          refetchType: 'inactive',
        });
      } catch (error) {
        logger.error('[useRealtimeBots] Error updating bot data:', error);
      }
    };

    // Handler for bot creation
    const handleBotCreated = (event: BotUpdateEvent) => {
      logger.info('[useRealtimeBots] New bot created:', event);

      // Invalidate and refetch bot list to include new bot
      queryClient.invalidateQueries({ queryKey: ['dcaBots'] });
      queryClient.invalidateQueries({ queryKey: ['dcaBotStats'] });
    };

    // Handler for bot deletion
    const handleBotDeleted = (event: BotUpdateEvent) => {
      logger.info('[useRealtimeBots] Bot deleted:', event);

      // Remove bot from cache
      queryClient.setQueryData(['dcaBots'], (oldData: any) => {
        if (!oldData?.data?.result) return oldData;

        const filteredBots = oldData.data.result.filter(
          (bot: DcaBot) => bot._id !== event.botId
        );

        return {
          ...oldData,
          data: {
            ...oldData.data,
            result: filteredBots,
          },
        };
      });

      // Remove individual bot cache
      queryClient.removeQueries({ queryKey: ['bot', event.botId] });

      // Update stats
      queryClient.invalidateQueries({ queryKey: ['dcaBotStats'] });
    };

    // Handler for bot statistics updates
    const handleStatsUpdate = (event: BotStatsUpdateEvent) => {
      logger.info('[useRealtimeBots] Received stats update:', event);

      queryClient.setQueryData(['dcaBotStats'], (oldStats: any) => {
        if (!oldStats) return event.data;

        return {
          ...oldStats,
          ...event.data,
          lastUpdated: event.timestamp,
        };
      });
    };

    // Register WebSocket event listeners
    socket.on('bot_update', handleBotUpdate);
    socket.on('bot_status_change', handleBotUpdate);
    socket.on('bot_profit_update', handleBotUpdate);
    socket.on('bot_created', handleBotCreated);
    socket.on('bot_deleted', handleBotDeleted);
    socket.on('bot_stats_update', handleStatsUpdate);

    // Subscribe to bot updates for the current user
    socket.emit('subscribe_bot_updates', {
      subscriptions: ['bot_updates', 'bot_stats', 'bot_status_changes'],
    });

    logger.info('[useRealtimeBots] Real-time bot updates enabled');

    // Cleanup function
    return () => {
      if (socket) {
        socket.off('bot_update', handleBotUpdate);
        socket.off('bot_status_change', handleBotUpdate);
        socket.off('bot_profit_update', handleBotUpdate);
        socket.off('bot_created', handleBotCreated);
        socket.off('bot_deleted', handleBotDeleted);
        socket.off('bot_stats_update', handleStatsUpdate);

        // Unsubscribe from updates
        socket.emit('unsubscribe_bot_updates', {
          subscriptions: ['bot_updates', 'bot_stats', 'bot_status_changes'],
        });

        logger.info('[useRealtimeBots] Real-time bot updates disabled');
      }
    };
  }, [queryClient]);

  // Return connection status
  const socket = (window as any).socket;
  return {
    isConnected: socket?.connected || false,
    socketId: socket?.id || null,
  };
}
