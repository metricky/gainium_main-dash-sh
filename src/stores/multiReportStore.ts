// Report dashboards store stub. Returns empty data and no-op actions.

import type { SavedLayout } from '@/types/layout';
import type { Layout } from 'react-grid-layout';
import type { ReportWidgetConfig } from '../reports/types/reportWidget';

export const createReportSlug = (name: string): string => {
  if (!name || typeof name !== 'string') return 'untitled-report';
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() || 'untitled-report'
  );
};

export const findReportBySlug = (
  reports: ReportConfig[],
  slug: string
): ReportConfig | undefined =>
  reports.find((r) => createReportSlug(r.name) === slug);

export interface ReportFilterMetadata {
  dateRangePreset: string;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  selectedTags: string[];
  selectedTypes: string[];
  selectedSources: string[];
}

export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  isGridLayoutLocked: boolean;
  widgets: ReportWidgetConfig[];
  currentLayout: Layout[];
  savedLayouts: SavedLayout<ReportWidgetConfig>[];
  lastSavedPreset: string | null;
  isUsingDefaultLayout: boolean;
  isIntentionallyEmpty?: boolean;
  layoutBreakpoint?: string;
  createdAt: number;
  updatedAt: number;
  filters?: ReportFilterMetadata;
}

interface MultiReportState {
  reports: ReportConfig[];
  currentReportId: string;
  createReport: (name?: string, skipDefaultWidgets?: boolean) => string;
  createReportFromTemplate: (templateId: string, name?: string) => string;
  deleteReport: (reportId: string) => boolean;
  switchReport: (reportId: string) => boolean;
  renameReport: (reportId: string, name: string) => boolean;
  cloneReport: (reportId: string, name?: string) => string;
  reorderReports: (fromIndex: number, toIndex: number) => void;
  getCurrentReport: () => ReportConfig | null;
  setReportFilters: (
    reportId: string,
    filters: Partial<ReportFilterMetadata>
  ) => void;
  getReportFilters: (reportId: string) => ReportFilterMetadata | undefined;
  toggleGridLock: () => void;
  updateLayout: (newLayout: Layout[]) => void;
  addWidget: (widget: ReportWidgetConfig) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (
    widgetId: string,
    updates: Partial<ReportWidgetConfig>
  ) => void;
  reorderWidgets: (activeId: string, overId: string) => void;
  applyLayoutPreset: (presetName: string) => void;
  resetLayout: () => void;
  tidyUpLayout: () => void;
  saveLayout: (name: string) => void;
  loadLayout: (name: string) => void;
  deleteLayout: (name: string) => void;
  resetToLastSavedPreset: () => void;
  exportLayout: () => string;
  importLayout: (layoutData: string) => boolean;
  adjustLayoutForCurrentScreen: () => void;
  markLayoutAsCustomized: () => void;
}

const noopState: MultiReportState = {
  reports: [],
  currentReportId: '',
  createReport: () => '',
  createReportFromTemplate: () => '',
  deleteReport: () => false,
  switchReport: () => false,
  renameReport: () => false,
  cloneReport: () => '',
  reorderReports: () => {},
  getCurrentReport: () => null,
  setReportFilters: () => {},
  getReportFilters: () => undefined,
  toggleGridLock: () => {},
  updateLayout: () => {},
  addWidget: () => {},
  removeWidget: () => {},
  updateWidget: () => {},
  reorderWidgets: () => {},
  applyLayoutPreset: () => {},
  resetLayout: () => {},
  tidyUpLayout: () => {},
  saveLayout: () => {},
  loadLayout: () => {},
  deleteLayout: () => {},
  resetToLastSavedPreset: () => {},
  exportLayout: () => '',
  importLayout: () => false,
  adjustLayoutForCurrentScreen: () => {},
  markLayoutAsCustomized: () => {},
};

export function useMultiReportStore(): MultiReportState;
export function useMultiReportStore<T>(selector: (state: MultiReportState) => T): T;
export function useMultiReportStore<T>(
  selector?: (state: MultiReportState) => T
): T | MultiReportState {
  return selector ? selector(noopState) : noopState;
}

useMultiReportStore.getState = (): MultiReportState => noopState;
useMultiReportStore.setState = (): void => {};
useMultiReportStore.subscribe = (): (() => void) => () => {};
