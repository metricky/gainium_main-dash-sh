import React from 'react';
import DashboardEnhancedPortfolioBalances from '../widgets/dashboard/EnhancedPortfolioBalances';

export interface EnhancedPortfolioBalancesProps {
  widgetId?: string;
  height?: string | number;
  className?: string;
  showPagination?: boolean;
}

/**
 * Portfolio-specific EnhancedPortfolioBalances component that wraps the dashboard widget
 * without resizing conflicts. This component is specifically designed for the
 * portfolio page with fixed sizing and no grid layout interference.
 *
 * This is the ENHANCED version with all critical missing features:
 * - Free vs Used Balance columns
 * - Bot Usage Tracking (MAX BOT USAGE column)
 * - Exchange-level breakdown
 * - Aggregate toggle for cross-exchange balance summing
 * - Column visibility controls
 * - Advanced filtering by exchange, category, market cap
 * - Bot Legend system with popover details
 * - Enhanced options dialog
 */
const EnhancedPortfolioBalances: React.FC<EnhancedPortfolioBalancesProps> = ({
  widgetId = 'enhanced-portfolio-balances-page',
  // portfolio page prefers to size the table according to its content by default
  height = 'auto',
  className,
  showPagination = true,
}) => {
  return (
    <div className={className}>
      <DashboardEnhancedPortfolioBalances
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

export default EnhancedPortfolioBalances;
