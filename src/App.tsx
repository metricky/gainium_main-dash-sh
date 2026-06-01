import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import OnboardingGate from './components/auth/OnboardingGate';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { IS_CLOUD } from './config/mode';

// Admin page is sh-only — lazy-imported so cloud's bundle never pulls in
// the admin module graph (lib/api/adminClient + tabs + dockerode-typed
// fetch helpers).
const AdminPage = IS_CLOUD ? null : lazy(() => import('./pages/admin/AdminPage'));
import { DraggableDevButton } from './components/dev/DraggableDevButton';
import { BotViewRedirect } from './components/routing/BotViewRedirect';
import { OfflineHandler } from './components/ui/OfflineHandler';
import {
  registerComboBotType,
  registerDcaBotType,
  registerGridBotType,
} from './features/bots/registry/index';
import { useNavigationShortcuts } from './hooks/useNavigationShortcuts';
import { useApplyVisualSettings } from './hooks/useVisualSettings';
import logger from './lib/loggerInstance';
import {
  isReady as isAnalyticsReady,
  pageview as analyticsPageview,
} from './lib/analytics';

import AddExchange from './pages/AddExchange';
import ComboBotEdit from './pages/bots/ComboBotEdit';
import ComboBotNew from './pages/bots/ComboBotNew';
import GridBotEdit from './pages/bots/GridBotEdit';
import GridBotNew from './pages/bots/GridBotNew';
import TradingBotEdit from './pages/bots/TradingBotEdit';
import TradingBotNew from './pages/bots/TradingBotNew';
import ComboBots from './pages/ComboBots';
import Dashboard from './pages/Dashboard';
import DualArcProgressGaugeTest from './pages/DualArcProgressGaugeTest';
import Exchanges from './pages/Exchanges';
import GridBots from './pages/GridBots';
import HedgeComboBotEdit from './pages/hedge-bots/HedgeComboBotEdit';
import HedgeComboBotNew from './pages/hedge-bots/HedgeComboBotNew';
import HedgeComboBots from './pages/hedge-bots/HedgeComboBots';
import HedgeDcaBotEdit from './pages/hedge-bots/HedgeDcaBotEdit';
import HedgeDcaBotNew from './pages/hedge-bots/HedgeDcaBotNew';
import HedgeDcaBots from './pages/hedge-bots/HedgeDcaBots';
import GlobalVariables from './pages/GlobalVariables';
import Login from './pages/Login';
import MagicLinkConsume from './pages/MagicLinkConsume';
import NotFound from './pages/NotFound';
import PasswordResetConsume from './pages/PasswordResetConsume';
import Overview from './pages/Overview';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import Trades from './pages/Trading';
import TradingBots from './pages/TradingBots';
import TradingTerminal from './pages/TradingTerminal';
// Lazy-loaded — 3000+ LOC design-system gallery, only fetched if a user
// navigates to /ui-showcase. Useful for SH contributors and devs evaluating
// the component library; doesn't need to ride the main bundle for everyone.
const UIShowcase = lazy(() => import('./pages/UIShowcase'));
import { useUIStore } from './stores/uiStore';

function App() {
  const initializeFromUrlParams = useUIStore((s) => s.initializeFromUrlParams);
  useApplyVisualSettings();

  // Initialize keyboard shortcuts
  useNavigationShortcuts();

  // Initialize fullscreen state from URL parameters on app load
  useEffect(() => {
    logger.debug('[App] Starting initialization');
    initializeFromUrlParams();
    // Bootstrap bot registry synchronously
    logger.debug('[App] About to bootstrap bot registry');
    registerDcaBotType();
    registerComboBotType();
    registerGridBotType();
    logger.debug('[App] Bot registry bootstrapped');
  }, [initializeFromUrlParams]);

  // Track analytics pageviews on route changes. Bot view/edit pages
  // handle their own tracking with full bot properties; this hook only
  // covers the rest of the route table.
  const location = useLocation();
  useEffect(() => {
    if (!isAnalyticsReady()) return;

    const pathname = location.pathname;

    // Skip bot view/edit pages - they handle their own normalized pageview tracking
    const isBotPage =
      pathname.startsWith('/bot/view/') ||
      pathname.startsWith('/bot/edit/') ||
      pathname.startsWith('/grid/view/') ||
      pathname.startsWith('/grid/edit/') ||
      pathname.startsWith('/combo/view/') ||
      pathname.startsWith('/combo/edit/') ||
      pathname.startsWith('/hedge/bot/view/') ||
      pathname.startsWith('/hedge/bot/edit/') ||
      pathname.startsWith('/hedge/combo/view/') ||
      pathname.startsWith('/hedge/combo/edit/');

    if (isBotPage) {
      return; // Bot pages track their own pageviews with full properties
    }

    // Regular page — debouncing + URL normalization happens inside the
    // analytics provider impl.
    analyticsPageview();
  }, [location]);

  return (
    <>
      <OfflineHandler />
      {/* Draggable Dev Tools Button - available on all pages including login */}
      <DraggableDevButton />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <Overview />
              </OnboardingGate>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/magic/:token" element={<MagicLinkConsume />} />
        <Route
          path="/auth/reset/:token"
          element={<PasswordResetConsume />}
        />
        <Route
          path="/add-exchange"
          element={
            <ProtectedRoute>
              <AddExchange />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ui-showcase"
          element={
            <Suspense fallback={null}>
              <UIShowcase />
            </Suspense>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <Dashboard />
              </OnboardingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tour"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <Dashboard tourMode={true} />
              </OnboardingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/:dashboardName"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <Dashboard />
              </OnboardingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/overview"
          element={
            <ProtectedRoute>
              <Overview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/terminal"
          element={
            <ProtectedRoute>
              <TradingTerminal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bot"
          element={
            <ProtectedRoute>
              <TradingBots />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bot/new"
          element={
            <ProtectedRoute>
              <TradingBotNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bot/edit/:id"
          element={
            <ProtectedRoute>
              <TradingBotEdit />
            </ProtectedRoute>
          }
        />
        {/* Drawer view route for Trading (DCA) bots */}
        <Route
          path="/bot/view/:id"
          element={
            <ProtectedRoute>
              <TradingBots />
            </ProtectedRoute>
          }
        />
        {/*
          Shared-backtest landing — `/bot/backtests?backtestShare=<id>`
          must resolve here (TradingBotNew owns the backtests list +
          detail view) rather than be eaten by the `/bot/:id` catch-all
          below. ProtectedRoute lets share URLs through without auth.
        */}
        <Route
          path="/bot/backtests"
          element={
            <ProtectedRoute>
              <TradingBotNew />
            </ProtectedRoute>
          }
        />
        {/* Redirect legacy detail route to drawer route */}
        <Route path="/bot/:id" element={<BotViewRedirect basePath="/bot" />} />
        <Route
          path="/combo"
          element={
            <ProtectedRoute>
              <ComboBots />
            </ProtectedRoute>
          }
        />
        <Route
          path="/combo/new"
          element={
            <ProtectedRoute>
              <ComboBotNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/combo/edit/:id"
          element={
            <ProtectedRoute>
              <ComboBotEdit />
            </ProtectedRoute>
          }
        />
        {/* Drawer view route for Combo bots */}
        <Route
          path="/combo/view/:id"
          element={
            <ProtectedRoute>
              <ComboBots />
            </ProtectedRoute>
          }
        />
        {/* Shared combo backtest landing — see /bot/backtests comment. */}
        <Route
          path="/combo/backtests"
          element={
            <ProtectedRoute>
              <ComboBotNew />
            </ProtectedRoute>
          }
        />
        {/* Redirect legacy detail route to drawer route */}
        <Route
          path="/combo/:id"
          element={<BotViewRedirect basePath="/combo" />}
        />
        <Route
          path="/grid"
          element={
            <ProtectedRoute>
              <GridBots />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grid/new"
          element={
            <ProtectedRoute>
              <GridBotNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grid/edit/:id"
          element={
            <ProtectedRoute>
              <GridBotEdit />
            </ProtectedRoute>
          }
        />
        {/* Drawer view route for Grid bots */}
        <Route
          path="/grid/view/:id"
          element={
            <ProtectedRoute>
              <GridBots />
            </ProtectedRoute>
          }
        />
        {/* Shared grid backtest landing — see /bot/backtests comment. */}
        <Route
          path="/grid/backtests"
          element={
            <ProtectedRoute>
              <GridBotNew />
            </ProtectedRoute>
          }
        />
        {/* Redirect legacy grid detail route to drawer route */}
        <Route
          path="/grid/:id"
          element={<BotViewRedirect basePath="/grid" />}
        />
        <Route
          path="/hedge/bot"
          element={
            <ProtectedRoute>
              <HedgeDcaBots />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hedge/bot/new"
          element={
            <ProtectedRoute>
              <HedgeDcaBotNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hedge/bot/edit/:id"
          element={
            <ProtectedRoute>
              <HedgeDcaBotEdit />
            </ProtectedRoute>
          }
        />
        {/* Drawer view route for Hedge DCA bots */}
        <Route
          path="/hedge/bot/view/:id"
          element={
            <ProtectedRoute>
              <HedgeDcaBots />
            </ProtectedRoute>
          }
        />
        {/* Redirect legacy detail route to drawer route */}
        <Route
          path="/hedge/bot/:id"
          element={<BotViewRedirect basePath="/hedge/bot" />}
        />
        <Route
          path="/hedge/combo"
          element={
            <ProtectedRoute>
              <HedgeComboBots />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hedge/combo/new"
          element={
            <ProtectedRoute>
              <HedgeComboBotNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hedge/combo/edit/:id"
          element={
            <ProtectedRoute>
              <HedgeComboBotEdit />
            </ProtectedRoute>
          }
        />
        {/* Drawer view route for Hedge Combo bots */}
        <Route
          path="/hedge/combo/view/:id"
          element={
            <ProtectedRoute>
              <HedgeComboBots />
            </ProtectedRoute>
          }
        />
        {/* Redirect legacy detail route to drawer route */}
        <Route
          path="/hedge/combo/:id"
          element={<BotViewRedirect basePath="/hedge/combo" />}
        />
        <Route
          path="/trading"
          element={
            <ProtectedRoute>
              <Trades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/global-variables"
          element={
            <ProtectedRoute>
              <GlobalVariables />
            </ProtectedRoute>
          }
        />
        {/* Legacy route redirect from settings to standalone page */}
        <Route
          path="/settings/global-variables"
          element={<Navigate to="/global-variables" replace />}
        />
        <Route
          path="/settings/*"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Exchanges page */}
        <Route
          path="/exchanges"
          element={
            <ProtectedRoute>
              <Exchanges />
            </ProtectedRoute>
          }
        />

        {/* Self-hosted admin page (sh-only — cloud falls through to 404). */}
        {!IS_CLOUD && AdminPage ? (
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Suspense fallback={null}>
                  <AdminPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
        ) : null}

        {/* Development/Test Routes */}
        <Route
          path="/test/dual-arc-progress"
          element={<DualArcProgressGaugeTest />}
        />

        {/* Redirect old routes to new ones */}
        <Route
          path="/trading-terminal"
          element={<Navigate to="/terminal" replace />}
        />
        <Route path="/trading-bots" element={<Navigate to="/bot" replace />} />
        <Route path="/combo-bots" element={<Navigate to="/combo" replace />} />
        <Route path="/grid-bots" element={<Navigate to="/grid" replace />} />
        <Route
          path="/hedge-bots/dca"
          element={<Navigate to="/hedge/bot" replace />}
        />
        <Route
          path="/hedge-bots/combo"
          element={<Navigate to="/hedge/combo" replace />}
        />
        <Route path="/bot" element={<Navigate to="/bot" replace />} />
        <Route path="/bot/new" element={<Navigate to="/bot/new" replace />} />
        <Route
          path="/bot/edit/:id"
          element={<Navigate to="/bot/edit/:id" replace />}
        />
        <Route path="/bot/:id" element={<Navigate to="/bot/:id" replace />} />
        {/* Add more routes as needed */}

        {/* Catch-all 404 route */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
export default App;
