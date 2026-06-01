import React from 'react';
import DashboardProfit from '../widgets/dashboard/Profit';

export interface ProfitProps {
  widgetId?: string;
  height?: string | number;
  className?: string;
}

/**
 * Portfolio-specific Profit component that wraps the dashboard widget
 * without resizing conflicts. This component is specifically designed for the
 * portfolio/overview page with fixed sizing and no grid layout interference.
 * The widget maintains full filtering capabilities through the PortfolioProvider context.
 */
const Profit: React.FC<ProfitProps> = ({
  widgetId = 'profit-overview-page',
  height = '400px',
  className,
}) => {
  const cssHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={className} style={{ height: cssHeight }}>
      <DashboardProfit
        widgetId={widgetId}
        isEditable={false}
        onCollapse={() => {}}
        onTabMove={() => {}}
        menuActions={{}}
      />
    </div>
  );
};

export default Profit;
