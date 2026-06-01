// Bridge hook for multi-report store to provide dashboard-like interface
import { useMultiReportStore } from '@/stores/multiReportStore';
import { useMemo } from 'react';

/**
 * Bridge hook that provides a unified interface to the multi-report store
 * Similar to useMultiDashboardBridge but for reports
 */
export const useMultiReportBridge = () => {
  const multiReportStore = useMultiReportStore();

  const currentReport = multiReportStore.getCurrentReport();

  return useMemo(
    () => ({
      // Report state - proxy to current report
      isGridLayoutLocked: currentReport?.isGridLayoutLocked || false,
      widgets: currentReport?.widgets || [],
      currentLayout: currentReport?.currentLayout || [],
      savedLayouts: currentReport?.savedLayouts || [],
      lastSavedPreset: currentReport?.lastSavedPreset || null,
      isUsingDefaultLayout: currentReport?.isUsingDefaultLayout || false,

      // Actions - proxy to multi-report store
      toggleGridLock: multiReportStore.toggleGridLock,
      updateLayout: multiReportStore.updateLayout,
      addWidget: multiReportStore.addWidget,
      removeWidget: multiReportStore.removeWidget,
      updateWidget: multiReportStore.updateWidget,
      reorderWidgets: multiReportStore.reorderWidgets,
      tidyUpLayout: multiReportStore.tidyUpLayout,
      resetLayout: multiReportStore.resetLayout,
      saveLayout: multiReportStore.saveLayout,
      loadLayout: multiReportStore.loadLayout,
      deleteLayout: multiReportStore.deleteLayout,
      exportLayout: multiReportStore.exportLayout,
      importLayout: multiReportStore.importLayout,
      applyLayoutPreset: multiReportStore.applyLayoutPreset,
      resetToLastSavedPreset: multiReportStore.resetToLastSavedPreset,
      adjustLayoutForCurrentScreen:
        multiReportStore.adjustLayoutForCurrentScreen,
      markLayoutAsCustomized: multiReportStore.markLayoutAsCustomized,

      // Multi-report specific
      reports: multiReportStore.reports,
      currentReportId: multiReportStore.currentReportId,
      getCurrentReport: multiReportStore.getCurrentReport,
      createReport: multiReportStore.createReport,
      deleteReport: multiReportStore.deleteReport,
      switchReport: multiReportStore.switchReport,
      renameReport: multiReportStore.renameReport,
      cloneReport: multiReportStore.cloneReport,
      reorderReports: multiReportStore.reorderReports,
    }),
    [multiReportStore, currentReport]
  );
};
