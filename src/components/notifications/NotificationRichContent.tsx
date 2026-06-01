import { cn } from '@/lib/utils';
import type { UnifiedNotification } from '@/stores/notificationsStore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';

export interface NotificationRichContentProps {
  notification: UnifiedNotification;
  clampLines?: number;
  disableClamp?: boolean;
  className?: string;
  textClassName?: string;
  toggleButtonClassName?: string;
}

export const NotificationRichContent: React.FC<
  NotificationRichContentProps
> = ({
  notification,
  clampLines = 2,
  disableClamp = false,
  className,
  textClassName,
  toggleButtonClassName,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasHtmlContent = Boolean(notification.htmlDescription);
  const messageContent = notification.message ?? '';

  const shouldShowToggle =
    !disableClamp && messageContent.length > clampLines * 90;

  const messageClass = cn(
    'text-sm text-muted-foreground mb-2 whitespace-pre-wrap',
    !disableClamp && !expanded ? `line-clamp-${clampLines}` : undefined,
    textClassName
  );

  return (
    <>
      <div className={cn('flex items-start gap-1', className)}>
        <div className="flex-1">
          {hasHtmlContent ? (
            <div
              className={messageClass}
              dangerouslySetInnerHTML={{ __html: messageContent }}
              style={{ cursor: 'text' }}
            />
          ) : (
            <div className={messageClass}>{messageContent}</div>
          )}
        </div>

        {shouldShowToggle && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            className={cn(
              'shrink-0 inline-flex items-center justify-center w-5 h-5 mt-0.5 text-muted-foreground hover:text-primary transition-colors rounded-sm hover:bg-muted/50',
              toggleButtonClassName
            )}
            title={expanded ? 'Show less' : 'Show more'}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {notification.imgSRC && (
        <div className="mt-1 mb-2 flex justify-center">
          <img
            src={notification.imgSRC}
            alt=""
            className="w-[270px] h-[150px] object-cover rounded-[10px]"
          />
        </div>
      )}

    </>
  );
};

export default NotificationRichContent;
