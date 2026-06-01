import { createDashboardSlug } from '@/stores/multiDashboardStore';

/**
 * Generate the canonical shortcut id for a specific dashboard
 */
export const getDashboardShortcutId = (dashboardId: string) =>
  `nav-dashboard-${dashboardId}`;

/**
 * Try to resolve a dashboard id from a shortcut id
 */
export const getDashboardIdFromShortcutId = (shortcutId: string) => {
  return shortcutId.startsWith('nav-dashboard-')
    ? shortcutId.replace('nav-dashboard-', '')
    : null;
};

/**
 * Build the route path for a dashboard given its name.
 */
export const getDashboardPathByName = (name: string) =>
  `/dashboard/${createDashboardSlug(name)}`;
