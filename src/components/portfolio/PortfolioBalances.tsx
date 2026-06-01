import React from 'react';
import DashboardPortfolioBalances from '../widgets/dashboard/PortfolioBalances';

export interface PortfolioBalancesProps {
  widgetId?: string;
  height?: string | number;
  className?: string;
  showPagination?: boolean;
}

/**
 * Portfolio-specific PortfolioBalances component that wraps the dashboard widget
 * without resizing conflicts. This component is specifically designed for the
 * portfolio page with fixed sizing and no grid layout interference.
 */
const PortfolioBalances: React.FC<PortfolioBalancesProps> = ({
  widgetId = 'portfolio-balances-page',
  height = '500px',
  className,
  showPagination = true,
}) => {
  return (
    <div className={className}>
      <DashboardPortfolioBalances
        widgetId={widgetId}
        isEditable={false}
        isCollapsible={false}
        allowResize={false}
        height={height}
        showPagination={showPagination}
        menuActions={{}}
      />
    </div>
  );
};

export default PortfolioBalances;
