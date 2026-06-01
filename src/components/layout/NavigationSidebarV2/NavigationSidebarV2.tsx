/**
 * @deprecated The V2 sidebar is no longer used. V1 (`NavigationSidebar`)
 * is the only supported sidebar. Existing users on V2 are migrated back
 * to V1 automatically on store rehydrate (see `uiStore.merge`). Kept in
 * the tree only so legacy imports keep compiling — do not extend.
 */
import { LeftSidebar } from '@/components/layout/NavigationSidebarV2/LeftSidebar';
import type { SecondaryPanel } from '@/components/layout/NavigationSidebarV2/types';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/loggerInstance';
import { useUIStore } from '@/stores/uiStore';
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Lazy load secondary panels
const DashboardsPanel = lazy(
  () => import('@/components/layout/NavigationSidebarV2/panels/DashboardsPanel')
);
const TradingPanel = lazy(
  () => import('@/components/layout/NavigationSidebarV2/panels/TradingPanel')
);
const DcaBotsPanel = lazy(
  () => import('@/components/layout/NavigationSidebarV2/panels/DcaBotsPanel')
);
const ComboBotsPanel = lazy(
  () => import('@/components/layout/NavigationSidebarV2/panels/ComboBotsPanel')
);
const GridBotsPanel = lazy(
  () => import('@/components/layout/NavigationSidebarV2/panels/GridBotsPanel')
);
const PortfolioPanel = lazy(
  () => import('@/components/layout/NavigationSidebarV2/panels/PortfolioPanel')
);
const MorePanel = lazy(
  () => import('@/components/layout/NavigationSidebarV2/panels/MorePanel')
);
const HelpPanel = lazy(
  () => import('@/components/layout/NavigationSidebarV2/panels/HelpPanel')
);

interface NavigationSidebarV2Props {
  activePage: string;
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
  className?: string;
}

export const NavigationSidebarV2: React.FC<NavigationSidebarV2Props> = ({
  activePage,
  variant = 'desktop',
  onNavigate,
  className = '',
}) => {
  // Use persisted state from store instead of local state so panel persists across navigation
  const activePanel = useUIStore(
    (s) => s.navigationActivePanel as SecondaryPanel | null
  );
  const setActivePanel = useUIStore((s) => s.setNavigationActivePanel);
  const navigationSecondaryPinned = useUIStore(
    (s) => s.navigationSecondaryPinned
  );
  const toggleNavigationSecondaryPinned = useUIStore(
    (s) => s.toggleNavigationSecondaryPinned
  );
  const isSecondaryPinned = Boolean(activePanel && navigationSecondaryPinned);
  const [pendingPinPanel, setPendingPinPanel] = useState<SecondaryPanel | null>(
    null
  );

  // Timer to delay closing the overlay so pointer can reach it
  const panelCloseTimerRef = useRef<number | null>(null);

  const requestPanelClose = (delay = 400) => {
    // Don't close if panel is pinned
    if (navigationSecondaryPinned) {
      return;
    }

    if (panelCloseTimerRef.current) {
      clearTimeout(panelCloseTimerRef.current);
    }
    panelCloseTimerRef.current = window.setTimeout(() => {
      setActivePanel(null);
      panelCloseTimerRef.current = null;
    }, delay);
  };

  const handlePanelHover = (panel: SecondaryPanel | null) => {
    logger.debug('[NavV2] Panel hovered', {
      panel,
      currentPanel: activePanel,
      isPinned: navigationSecondaryPinned,
    });

    // Cancel any pending close timers
    cancelPanelClose();

    // Don't allow hover to close when pinned
    if (navigationSecondaryPinned && panel === null) {
      return;
    }

    // On hover, just open a different panel but do NOT arm pinning
    if (panel && activePanel !== panel) {
      setActivePanel(panel);
      return;
    }

    // If hovering away, close panel only when not pinned
    if (!panel && !navigationSecondaryPinned) {
      setActivePanel(null);
      setPendingPinPanel(null);
    }
  };

  const cancelPanelClose = () => {
    if (panelCloseTimerRef.current) {
      clearTimeout(panelCloseTimerRef.current);
      panelCloseTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (panelCloseTimerRef.current) {
        clearTimeout(panelCloseTimerRef.current);
        panelCloseTimerRef.current = null;
      }
    };
  }, []);

  const handlePanelToggle = (panel: SecondaryPanel | null) => {
    logger.debug('[NavV2] Panel toggled', {
      panel,
      currentPanel: activePanel,
      isPinned: navigationSecondaryPinned,
      pendingPin: pendingPinPanel,
    });

    // Cancel any pending close timers
    cancelPanelClose();

    // If pinned and we're asked to close, ignore
    if (navigationSecondaryPinned && panel === null) {
      return;
    }

    // If selecting a different panel: open it and arm pinning
    if (panel && activePanel !== panel) {
      setActivePanel(panel);
      setPendingPinPanel(panel);
      return;
    }

    // If clicking the active panel
    if (activePanel === panel) {
      // If already pinned -> do nothing (no unpin)
      if (navigationSecondaryPinned) {
        return;
      }

      // If armed (second click) -> pin
      if (pendingPinPanel === panel) {
        logger.debug('[NavV2] Pending pin confirmed, pinning', { panel });
        toggleNavigationSecondaryPinned();
        setPendingPinPanel(null);
        return;
      }

      // First click on active panel -> arm for pin on next click
      logger.debug('[NavV2] Arming panel to pin', { panel });
      setPendingPinPanel(panel);
      return;
    }

    // If clicked null or other cases, close panel if not pinned
    if (!panel && !navigationSecondaryPinned) {
      setActivePanel(null);
      setPendingPinPanel(null);
    }
  };

  // Clear pending pin when pinned state changes or when switching to a different panel
  useEffect(() => {
    // Only clear if switching to a different panel, not when clicking the same one
    if (activePanel !== pendingPinPanel && pendingPinPanel !== null) {
      setPendingPinPanel(null);
    }
  }, [activePanel, navigationSecondaryPinned, pendingPinPanel]);

  const handlePanelClose = () => {
    // Don't allow closing if panel is pinned
    if (navigationSecondaryPinned) {
      return;
    }
    setActivePanel(null);
  };

  // Render the appropriate secondary panel content
  const renderPanelContent = () => {
    if (!activePanel) return null;

    return (
      <ErrorBoundary
        fallbackRender={({ error: _error, resetErrorBoundary }) => (
          <div className="w-72 bg-card h-full rounded-lg overflow-hidden flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-destructive mb-4">
              Failed to load panel
            </p>
            <button
              onClick={() => {
                logger.warn(
                  `[NavigationSidebar:RetryPanel] Retrying panel load`,
                  { activePanel }
                );
                resetErrorBoundary();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
            >
              Retry
            </button>
          </div>
        )}
        onError={(error) => {
          logger.error(`[NavigationSidebar:PanelError] Panel failed to load`, {
            error: error.message,
            activePanel,
          });
        }}
        onReset={() => {
          // Force panel to remount by briefly setting to null then back
          const currentPanel = activePanel;
          setActivePanel(null);
          setTimeout(() => setActivePanel(currentPanel), 10);
        }}
      >
        <Suspense
          fallback={
            <div className="w-72 bg-card h-full rounded-lg overflow-hidden">
              <div className="p-4 space-y-4">
                <Skeleton className="h-4 w-3/4 bg-primary-foreground/10" />
                <Skeleton className="h-8 w-full rounded-lg bg-primary-foreground/10" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-primary-foreground/10" />
                  <Skeleton className="h-4 w-2/3 bg-primary-foreground/10" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg bg-primary-foreground/10" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-8 w-full rounded-lg bg-primary-foreground/10" />
                  <Skeleton className="h-8 w-full rounded-lg bg-primary-foreground/10" />
                </div>
              </div>
            </div>
          }
        >
          {activePanel === 'dashboards' && (
            <DashboardsPanel
              onClose={handlePanelClose}
              onNavigate={onNavigate}
            />
          )}
          {activePanel === 'trading' && (
            <TradingPanel onClose={handlePanelClose} onNavigate={onNavigate} />
          )}
          {activePanel === 'dcaBots' && (
            <DcaBotsPanel onClose={handlePanelClose} onNavigate={onNavigate} />
          )}
          {activePanel === 'comboBots' && (
            <ComboBotsPanel
              onClose={handlePanelClose}
              onNavigate={onNavigate}
            />
          )}
          {activePanel === 'gridBots' && (
            <GridBotsPanel onClose={handlePanelClose} onNavigate={onNavigate} />
          )}
          {activePanel === 'portfolio' && (
            <PortfolioPanel
              onClose={handlePanelClose}
              onNavigate={onNavigate}
            />
          )}
          {activePanel === 'more' && (
            <MorePanel onClose={handlePanelClose} onNavigate={onNavigate} />
          )}
          {activePanel === 'help' && (
            <HelpPanel onClose={handlePanelClose} onNavigate={onNavigate} />
          )}
        </Suspense>
      </ErrorBoundary>
    );
  };

  const containerPadding = 4; // px; matches `p-1` on the root container
  const leftWidth = 50; // left sidebar width in px (fixed)
  const gap = 12; // separation in px
  const overlap = 6; // overlap in px so mouse can transit without losing hover

  return (
    <div
      className={`relative flex h-full max-h-screen p-1 items-stretch ${className}`}
    >
      {/* Left Sidebar */}
      <LeftSidebar
        activePage={activePage}
        activePanel={activePanel}
        onPanelToggle={handlePanelToggle}
        onPanelHover={handlePanelHover}
        variant={variant}
        onNavigate={onNavigate}
        onPanelRequestClose={() => requestPanelClose()}
        onPanelCancelClose={() => cancelPanelClose()}
      />

      {/* Inline Panel Container (Animated) */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden self-stretch ${
          isSecondaryPinned ? 'w-72 ml-1 opacity-100' : 'w-0 ml-0 opacity-0'
        }`}
      >
        <div className="w-72 h-full shadow-xl rounded-lg overflow-hidden">
          {isSecondaryPinned && renderPanelContent()}
        </div>
      </div>

      {/* Overlay Panel (Absolute) */}
      {!isSecondaryPinned && activePanel && (
        <div
          style={{ left: `${containerPadding + leftWidth + gap - overlap}px` }}
          className="absolute top-2 bottom-2 w-72 z-50 shadow-xl rounded-lg overflow-hidden"
          onMouseEnter={() => cancelPanelClose()}
          onMouseLeave={() => requestPanelClose()}
        >
          {renderPanelContent()}
        </div>
      )}
    </div>
  );
};
