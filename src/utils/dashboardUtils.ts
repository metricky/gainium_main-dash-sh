/**
 * Utility functions for dashboard URL handling
 */

interface Dashboard {
  id: string;
  name: string;
  widgets: unknown[];
  updatedAt: number;
  currentLayout?: unknown;
  isUsingDefaultLayout?: boolean;
}

/**
 * Convert dashboard name to URL-safe slug
 * @param name Dashboard name
 * @returns URL-safe slug
 */
export const dashboardNameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(
      /^[\u002D\u2010\u2011\u2012\u2013\u2014\u2015\u2212]+|[\u002D\u2010\u2011\u2012\u2013\u2014\u2015\u2212]+$/g,
      ''
    ); // Remove leading/trailing hyphens
};

/**
 * Convert URL slug back to dashboard name (case-insensitive search)
 * @param slug URL slug
 * @param dashboards Array of available dashboards
 * @returns Dashboard object or null if not found
 */
export const slugToDashboard = (
  slug: string,
  dashboards: Dashboard[]
): Dashboard | null => {
  return (
    dashboards.find(
      (dashboard) => dashboardNameToSlug(dashboard.name) === slug
    ) || null
  );
};

/**
 * Get the default dashboard URL path
 * @param dashboards Array of available dashboards
 * @param currentDashboardId Current dashboard ID (optional)
 * @returns URL path for the dashboard
 */
export const getDefaultDashboardPath = (
  dashboards: Dashboard[],
  currentDashboardId?: string
): string => {
  // Try to find current dashboard first
  if (currentDashboardId) {
    const currentDashboard = dashboards.find(
      (d) => d.id === currentDashboardId
    );
    if (currentDashboard) {
      return `/dashboard/${dashboardNameToSlug(currentDashboard.name)}`;
    }
  }

  // Fall back to first dashboard
  if (dashboards.length > 0) {
    return `/dashboard/${dashboardNameToSlug(dashboards[0].name)}`;
  }

  // Fall back to root dashboard
  return '/dashboard';
};
