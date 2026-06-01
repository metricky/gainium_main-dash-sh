import { showShortcutHint } from '@/lib/shortcutHints';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { Bell } from 'lucide-react';
import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface NotificationButtonProps {
  unreadCount?: number;
  className?: string;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({
  unreadCount = 0,
  className = '',
}) => {
  const { toggleNotificationsPanel, unreadCounts } = useNotificationsStore();

  // Determine badge background color based on unread bot notifications
  const hasUnreadBotNotifications = unreadCounts.bot > 0;
  const badgeColorClass = hasUnreadBotNotifications
    ? 'bg-destructive hover:bg-destructive/90'
    : 'bg-success hover:bg-success/90';

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className={`p-1 h-8 w-8 ${className}`}
        onClick={() => {
          showShortcutHint('toggleNotifications');
          toggleNotificationsPanel();
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
      </Button>
      {unreadCount > 0 && (
        <Badge
          className={`absolute -top-1 -right-1 min-w-5 h-5 px-1 text-xs flex items-center justify-center text-white border-0 rounded-full ${badgeColorClass}`}
        >
          {unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default NotificationButton;
