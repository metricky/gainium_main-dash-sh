// Report widget registry stub.
import type {
  ReportWidgetMetadata,
  ReportWidgetRegistryEntry,
  ReportWidgetType,
} from '../types/reportWidget';

const PLACEHOLDER_METADATA: ReportWidgetMetadata = {
  title: '',
  description: '',
  category: 'Charts',
  icon: '',
  defaultSize: { w: 4, h: 4, minW: 2, minH: 2 },
};

const Noop: React.ComponentType<Record<string, unknown>> = () => null;

const placeholderEntry: ReportWidgetRegistryEntry = {
  component: Noop,
  metadata: PLACEHOLDER_METADATA,
};

export const REPORTS_WIDGET_REGISTRY: Record<
  ReportWidgetType,
  ReportWidgetRegistryEntry
> = {
  'metric-chart': placeholderEntry,
  'metric-table': placeholderEntry,
  histogram: placeholderEntry,
  scatter: placeholderEntry,
  heatmap: placeholderEntry,
};

export const getAvailableReportWidgetTypes = (): ReportWidgetType[] => [];

export const getReportWidgetMetadata = (
  _type: ReportWidgetType
): ReportWidgetMetadata => PLACEHOLDER_METADATA;

export const getReportWidgetComponent = (
  _type: ReportWidgetType
): React.ComponentType<Record<string, unknown>> => Noop;
