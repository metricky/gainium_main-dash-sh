import { useVisualSettingsStore } from '@/stores/visualSettingsStore';
import logger from '../lib/loggerInstance';

/**
 * One-time migration to transfer theme setting from dashboard store to visual settings store
 * This should be called once when the app starts
 */
export const migrateThemeFromDashboardStore = () => {
  try {
    // Check if migration has already been done
    const migrationKey = 'visual-settings-theme-migrated';
    const alreadyMigrated = localStorage.getItem(migrationKey);

    if (alreadyMigrated) {
      return; // Migration already completed
    }

    // Get the old dashboard store data
    const dashboardStoreKey = 'dashboard-store';
    const dashboardStoreData = localStorage.getItem(dashboardStoreKey);

    if (dashboardStoreData) {
      try {
        const parsedData = JSON.parse(dashboardStoreData);
        const selectedTheme = parsedData?.state?.selectedTheme;

        if (
          selectedTheme &&
          ['light', 'dark', 'system'].includes(selectedTheme)
        ) {
          // Set the theme in the visual settings store
          const { setTheme } = useVisualSettingsStore.getState();
          setTheme(selectedTheme);

          logger.info(
            `Migrated theme setting: ${selectedTheme} from dashboard store to visual settings store`
          );
        }
      } catch (parseError) {
        console.warn(
          'Failed to parse dashboard store data for theme migration:',
          parseError
        );
      }
    }

    // Mark migration as completed
    localStorage.setItem(migrationKey, 'true');
  } catch (error) {
    console.warn('Theme migration failed:', error);
  }
};
