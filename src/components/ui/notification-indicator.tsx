import { cn } from '@/lib/utils';
import React from 'react';

interface NotificationIndicatorProps {
  count?: number;
  showDot?: boolean;
  className?: string;
}

export const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  count,
  showDot = true,
  className,
}) => {
  if (count && count > 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-destructive rounded-full',
          className
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  }

  if (showDot) {
    return (
      <span
        className={cn(
          'inline-block w-2 h-2 bg-success rounded-full',
          className
        )}
      />
    );
  }

  return null;
};

export default NotificationIndicator;
