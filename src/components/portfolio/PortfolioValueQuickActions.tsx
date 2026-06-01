import React from 'react';
import DashboardOverviewQuickActions from '../widgets/dashboard/OverviewQuickActions';

export interface OverviewQuickActionsProps {
  widgetId?: string;
  height?: string | number;
  className?: string;
}

const OverviewQuickActions: React.FC<OverviewQuickActionsProps> = ({
  widgetId = 'overview-quick-actions-overview-page',
  height,
  className,
}) => {
  return (
    <div className={className}>
      <DashboardOverviewQuickActions
        widgetId={widgetId}
        allowResize={false}
        isEditable={false}
        isCollapsible={false}
        menuActions={{}}
        {...(height !== undefined ? { height } : {})}
      />
    </div>
  );
};

export default OverviewQuickActions;
