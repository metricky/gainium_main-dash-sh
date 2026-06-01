import React from 'react';

export interface StatsAndChartLayoutProps {
  /**
   * Main content to display prominently - typically a gauge, chart, or key metric
   */
  mainContent: React.ReactNode;

  /**
   * Array of stat components to display alongside the chart
   */
  statComponents: React.ReactNode[];

  /**
   * Chart component to display
   */
  chartComponent: React.ReactNode;

  /**
   * Optional className for the container
   */
  className?: string;

  /**
   * Height of the container
   */
  height?: string | number;
}

/**
 * Responsive layout component for widgets with stats and a chart
 *
 * Responsive behavior:
 * - Wide (800px+): All stats on left (including main content), chart on right
 * - Medium (500px-799px): All stats in row at top, chart below
 * - Narrow (<500px): All components stacked vertically
 */
export const StatsAndChartLayout: React.FC<StatsAndChartLayoutProps> = ({
  mainContent,
  statComponents,
  chartComponent,
  className = '',
  height = '400px',
}) => {
  // Combine main content with stat components for easier layout management
  const allStatComponents = [mainContent, ...statComponents];

  return (
    <div
      className={`p-md overflow-visible @container ${className}`}
      style={{ height }}
    >
      {/* Wide layout: All stats on left, chart on right */}
      <div
        className="hidden @[800px]:grid @[800px]:grid-cols-[320px_1fr] @[800px]:h-full"
        style={{ gap: 'var(--spacing-md)' }}
      >
        {/* Left sidebar: All stat components */}
        <div className="flex flex-col" style={{ gap: 'var(--spacing-md)' }}>
          {allStatComponents.map((component, index) => (
            <div key={index}>{component}</div>
          ))}
        </div>

        {/* Right side: Chart */}
        <div className="min-h-0">{chartComponent}</div>
      </div>

      {/* Medium width layout: Stats in row at top, chart below */}
      <div
        className="hidden @[500px]:flex @[800px]:hidden h-full flex-col"
        style={{ gap: 'var(--spacing-md)' }}
      >
        {/* Stats in horizontal row */}
        <div
          className="grid grid-cols-1 @[600px]:grid-cols-2 @[700px]:grid-cols-3 shrink-0"
          style={{ gap: 'var(--spacing-md)' }}
        >
          {allStatComponents.map((component, index) => (
            <div key={index}>{component}</div>
          ))}
        </div>

        {/* Chart below - takes all remaining space */}
        <div className="flex-1 min-h-0" style={{ minHeight: '350px' }}>
          {chartComponent}
        </div>
      </div>

      {/* Narrow layout: All stacked vertically */}
      <div
        className="flex @[500px]:hidden h-full flex-col"
        style={{ gap: 'var(--spacing-md)' }}
      >
        {/* All stat components stacked */}
        <div
          className="flex flex-col shrink-0"
          style={{ gap: 'var(--spacing-md)' }}
        >
          {allStatComponents.map((component, index) => (
            <div key={index}>{component}</div>
          ))}
        </div>

        {/* Chart at bottom - takes all remaining space */}
        <div className="flex-1 min-h-0" style={{ minHeight: '350px' }}>
          {chartComponent}
        </div>
      </div>
    </div>
  );
};

export default StatsAndChartLayout;
