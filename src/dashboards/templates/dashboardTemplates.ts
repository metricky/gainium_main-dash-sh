// Thin re-export layer. The authoritative template list + registry
// lives in `@/stores/dashboardTemplates`; cloud overlays extend it at
// boot via `registerDashboardTemplates()`.

import {
  getAllDashboardTemplates,
  getDashboardTemplate,
  type DashboardTemplate,
} from '@/stores/dashboardTemplates';

export type { DashboardTemplate };

/** All registered dashboard templates (core + host-app extras). */
export function getDefaultDashboardTemplates(): DashboardTemplate[] {
  return getAllDashboardTemplates();
}

export function getDashboardTemplateById(
  id: string
): DashboardTemplate | undefined {
  return getDashboardTemplate(id);
}

export function getDashboardTemplatesByCategory(
  category: DashboardTemplate['category']
): DashboardTemplate[] {
  return getAllDashboardTemplates().filter((t) => t.category === category);
}
