import React, { useState, useCallback, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import {
  DealOpenedNotification,
  DealClosedNotification,
  OrderFilledNotification,
  type DealOpenedNotificationProps,
  type DealClosedNotificationProps,
  type OrderFilledNotificationProps,
} from './index';

type NotificationType = 'dealOpened' | 'dealClosed' | 'orderFilled';

interface Notification {
  id: string;
  type: NotificationType;
  props:
    | DealOpenedNotificationProps
    | DealClosedNotificationProps
    | OrderFilledNotificationProps;
}

export interface NotificationContainerRef {
  showDealOpened: (props: Omit<DealOpenedNotificationProps, 'onClose'>) => void;
  showDealClosed: (props: Omit<DealClosedNotificationProps, 'onClose'>) => void;
  showOrderFilled: (
    props: Omit<OrderFilledNotificationProps, 'onClose'>
  ) => void;
}

interface NotificationContainerProps {
  onMount?: (ref: NotificationContainerRef) => void;
}

export const NotificationContainer = React.forwardRef<
  NotificationContainerRef,
  NotificationContainerProps
>(({ onMount }, ref) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (
      type: NotificationType,
      props:
        | Omit<DealOpenedNotificationProps, 'onClose'>
        | Omit<DealClosedNotificationProps, 'onClose'>
        | Omit<OrderFilledNotificationProps, 'onClose'>
    ) => {
      const id = `${type}-${Date.now()}-${Math.random()}`;
      const notification: Notification = {
        id,
        type,
        props: {
          ...props,
          onClose: () => removeNotification(id),
        } as
          | DealOpenedNotificationProps
          | DealClosedNotificationProps
          | OrderFilledNotificationProps,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    },
    [removeNotification]
  );

  useImperativeHandle(
    ref,
    () => ({
      showDealOpened: (props) => addNotification('dealOpened', props),
      showDealClosed: (props) => addNotification('dealClosed', props),
      showOrderFilled: (props) => addNotification('orderFilled', props),
    }),
    [addNotification]
  );

  // Call onMount with the ref
  React.useEffect(() => {
    if (onMount && ref && 'current' in ref && ref.current) {
      onMount(ref.current);
    }
  }, [onMount, ref]);

  if (notifications.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2">
      {notifications.map((notification) => (
        <div key={notification.id} className="isolate">
          {notification.type === 'dealOpened' && (
            <DealOpenedNotification
              {...(notification.props as DealOpenedNotificationProps)}
            />
          )}
          {notification.type === 'dealClosed' && (
            <DealClosedNotification
              {...(notification.props as DealClosedNotificationProps)}
            />
          )}
          {notification.type === 'orderFilled' && (
            <OrderFilledNotification
              {...(notification.props as OrderFilledNotificationProps)}
            />
          )}
        </div>
      ))}
    </div>,
    document.body
  );
});

NotificationContainer.displayName = 'NotificationContainer';
