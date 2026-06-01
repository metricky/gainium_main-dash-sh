/* eslint-disable @typescript-eslint/no-explicit-any */
// Report widget types and interfaces
import type { Layout } from 'react-grid-layout';

// Report-specific widget types
export type ReportWidgetType =
  | 'metric-chart'
  | 'metric-table'
  | 'histogram'
  | 'scatter'
  | 'heatmap';

// Metric configuration per widget
export interface MetricConfig {
  color: string;
  chartType: 'line' | 'area' | 'bar';
}

// Time grouping options
export type TimeGrouping = 'minute' | 'hour' | 'day' | 'week' | 'month';

// Base report widget configuration
export interface ReportWidgetConfig {
  id: string;
  type: ReportWidgetType;
  title: string;
  layoutData: Layout;

  // Metric-specific data
  metrics?: string[];
  metricConfigs?: Record<string, MetricConfig>;
  timeGrouping?: TimeGrouping;

  // Generic settings for extensibility
  settings?: Record<string, unknown>;
  data?: Record<string, unknown>;
  tabs?: Array<{ id: string; title: string; data?: Record<string, unknown> }>;
  hasOptions?: boolean;
}

// Widget metadata for registry
export interface ReportWidgetMetadata {
  title: string;
  description: string;
  category: 'Charts' | 'Tables' | 'Analysis';
  icon: string;
  defaultSize: {
    w: number;
    h: number;
    minW: number;
    minH: number;
  };
  hasOptions?: boolean;
}

// Widget registry entry
export interface ReportWidgetRegistryEntry {
  component: React.ComponentType<any>;
  metadata: ReportWidgetMetadata;
}
