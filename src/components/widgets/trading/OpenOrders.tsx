// Trading dashboard widget wrapper for the shared OpenOrdersWidget.
import React from 'react';
import WidgetWrapper, { type WidgetMenuActions } from '../WidgetWrapper';
import OpenOrdersWidget from '../shared/OpenOrdersWidget';

export interface OpenOrdersProps {
  widgetId?: string;
  isEditable?: boolean;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: WidgetMenuActions;
  data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

const OpenOrders: React.FC<OpenOrdersProps> = ({
  widgetId = 'open-orders',
  isEditable = false,
  onCollapse,
  onTabMove,
  menuActions,
  data,
  settings,
}) => {
  return (
    <WidgetWrapper
      metadata={{
        id: widgetId,
        type: 'open-orders',
        title: 'Open Orders',
        hasOptions: false,
        value: {
          primary: 0,
          secondary: '0 orders',
          isProfit: true,
        },
      }}
      isEditable={isEditable}
      {...(onCollapse && { onCollapse })}
      {...(onTabMove && { onTabMove })}
      {...(menuActions && { menuActions })}
      cacheQueries={[
        {
          queryKey: 'getDCADeals',
          variables: { terminal: true } as Record<string, unknown>,
        },
      ]}
    >
      <OpenOrdersWidget
        widgetId={widgetId}
        isEditable={isEditable}
        {...(onCollapse && { onCollapse })}
        {...(onTabMove && { onTabMove })}
        {...(data && { data })}
        {...(settings && { settings })}
        showClosedTrades={false}
        title="Open Orders"
        emptyMessage="No active orders found."
        enableCardView={true}
      />
    </WidgetWrapper>
  );
};

export default OpenOrders;
