// Report templates stub.
import type { Layout } from 'react-grid-layout';
import type { ReportWidgetConfig } from '../types/reportWidget';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Performance' | 'Risk' | 'Analysis' | 'Custom';
  widgets: ReportWidgetConfig[];
  layout: Layout[];
  isDefault: boolean;
  previewImage?: string;
}

export const DEFAULT_REPORT_TEMPLATES: ReportTemplate[] = [];

export const getTemplateById = (_id: string): ReportTemplate | undefined =>
  undefined;

export const getTemplatesByCategory = (
  _category: ReportTemplate['category']
): ReportTemplate[] => [];

export const getAllTemplates = (): ReportTemplate[] => [];

export const getDefaultTemplates = (): ReportTemplate[] => [];
