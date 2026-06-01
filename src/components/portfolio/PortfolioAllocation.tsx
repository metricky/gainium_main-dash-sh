import React from 'react';
import DashboardPortfolioAllocation from '../widgets/dashboard/PortfolioAllocation';

export interface PortfolioAllocationProps {
  widgetId?: string;
  height?: string | number;
  className?: string;
}

/**
 * Portfolio-specific PortfolioAllocation component that wraps the dashboard widget
 * without resizing conflicts. This component is specifically designed for the
 * portfolio page with fixed sizing and no grid layout interference.
 */
const PortfolioAllocation: React.FC<PortfolioAllocationProps> = ({
  widgetId = 'portfolio-allocation-page',
  height = '500px',
  className,
}) => {
  return (
    <div className={className}>
      <DashboardPortfolioAllocation
        widgetId={widgetId}
        isEditable={false}
        isCollapsible={false}
        allowResize={false}
        height={height}
        menuActions={{}}
      />
    </div>
  );
};

export default PortfolioAllocation;
