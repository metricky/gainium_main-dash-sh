import React from 'react';
import DashboardPortfolioCategoriesAnalysis from '../widgets/dashboard/PortfolioCategoriesAnalysis';

export interface PortfolioCategoriesAnalysisProps {
  widgetId?: string;
  height?: string | number;
  className?: string;
}

/**
 * Portfolio-specific PortfolioCategoriesAnalysis component that wraps the dashboard widget
 * without resizing conflicts. This component is specifically designed for the
 * portfolio page with fixed sizing and no grid layout interference.
 */
const PortfolioCategoriesAnalysis: React.FC<
  PortfolioCategoriesAnalysisProps
> = ({
  widgetId = 'portfolio-categories-analysis-page',
  height = '400px',
  className,
}) => {
  return (
    <div className={className}>
      <DashboardPortfolioCategoriesAnalysis
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

export default PortfolioCategoriesAnalysis;
