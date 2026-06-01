import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type NotificationType = 'bot' | 'announcement' | 'changelog';

export interface UnifiedNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: number;
  botId?: string;
  botName?: string;
  botType?: string; // For proper bot URL generation
  notificationType: NotificationType;
  htmlDescription?: boolean;
  imgSRC?: string;
  isRead?: boolean;
  blurred?: boolean;
  fullDescription?: string;
  url?: string;
  symbol?: string;
  exchange?: string;
  terminal?: boolean; // For terminal notifications
}

interface NotificationsState {
  // Notification popup state
  isNotificationsPanelOpen: boolean;
  selectedFilter: NotificationType | 'all';
  searchQuery: string;

  // Unread counts for badge
  unreadCounts: {
    bot: number;
    announcement: number;
    changelog: number;
    total: number;
  };

  // Actions
  toggleNotificationsPanel: () => void;
  closeNotificationsPanel: () => void;
  setSelectedFilter: (filter: NotificationType | 'all') => void;
  setSearchQuery: (query: string) => void;
  setUnreadCounts: (
    counts: Partial<NotificationsState['unreadCounts']>
  ) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    (set) => ({
      // Initial state
      isNotificationsPanelOpen: false,
      selectedFilter: 'all',
      searchQuery: '',
      unreadCounts: {
        bot: 0,
        announcement: 0,
        changelog: 0,
        total: 0,
      },

      // Actions
      toggleNotificationsPanel: () =>
        set((state) => ({
          isNotificationsPanelOpen: !state.isNotificationsPanelOpen,
        })),

      closeNotificationsPanel: () =>
        set(() => ({
          isNotificationsPanelOpen: false,
        })),

      setSelectedFilter: (filter) =>
        set(() => ({
          selectedFilter: filter,
        })),

      setSearchQuery: (query) =>
        set(() => ({
          searchQuery: query,
        })),

      setUnreadCounts: (counts) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, ...counts },
        })),
    }),
    {
      name: 'notifications-store',
    }
  )
);
