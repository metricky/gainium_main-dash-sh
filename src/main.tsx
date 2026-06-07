import ReactQueryProvider from '@/lib/reactQuery';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ExchangeDataProvider } from './contexts/ExchangeDataContext';
import { LiveUpdateProvider } from './contexts/LiveUpdateContext';
import { installScreenerStub } from './lib/api/screenerStub';
import { registerAuthProvider } from './lib/auth';
import { logAuthConfig } from './lib/authConfig';
import {
  addManualClearTrigger,
  initLoadingWatchdog,
  unregisterServiceWorkersInDev,
} from './lib/cacheManager';
import { registerEntitlementsProvider } from './lib/entitlements';
import { useShEntitlements } from './lib/entitlements/impl/sh';
import { registerLicenseProvider } from './lib/license';
import { useShLicense } from './lib/license/impl/sh';
import { initThemeManager } from './lib/themeManager';
import { migrateThemeFromDashboardStore } from './utils/migrationUtils';

// Development components
import Logger from './components/dev/Logger';
import { AppErrorBoundary } from './components/AppErrorBoundary';

// Run migration before theme manager initialization
migrateThemeFromDashboardStore();

// Initialize theme manager before app render
initThemeManager();

// Stub the screener REST endpoint when the feature is off (avoids
// portfolio/treemap/heatmap widgets spinning on a 404).
installScreenerStub();

// Analytics: sh does NOT register a provider. The analytics dispatcher
// short-circuits to a no-op when no provider is registered, so every
// `track()` / `identify()` / `pageview()` call site becomes inert.
// PostHog stays out of the sh bundle.

// Register the license provider. Sh reads `user.licenseKey.isPremium`
// off the auth store — the app-sh backend validates the license key
// and sets the flag, and we just surface it through the adapter.
registerLicenseProvider(useShLicense);

// Register the entitlements provider. Sh derives "paid" status from
// the license key (no subscription object exists on sh user docs);
// cloud registers its own impl that reads `userProfile.subscription`.
// Call sites read `useEntitlements().isPaid` and don't know which
// mechanism is in play.
registerEntitlementsProvider(useShEntitlements);

// Register the auth provider with a pass-through env wrapper (no
// Google OAuth) and capabilities flagged for first-install
// registration. The Login page renders email/password only — when sh
// adds its dash@sh-style register-on-first-install branch, it'll key
// off `useAuthCapabilities().registration`.
registerAuthProvider({
  envProvider: ({ children }) => <>{children}</>,
  capabilities: { google: false, registration: true },
});

// Log authentication configuration
logAuthConfig();

// Dev only: remove any leftover service worker before rendering so localhost
// never runs a stale precached bundle. No-op in production.
void unregisterServiceWorkersInDev();

// Initialize cache management to handle loading issues
initLoadingWatchdog();
addManualClearTrigger();

const el = document.getElementById('root');
if (!el) throw new Error('Root element not found');

createRoot(el).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ReactQueryProvider>
            <LiveUpdateProvider>
              <ExchangeDataProvider>
                <App />
                {/* PWA functionality is now handled by PWAStatus in MainLayout */}
                {/* Development components - only visible in development */}
                <Logger />
              </ExchangeDataProvider>
            </LiveUpdateProvider>
          </ReactQueryProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>
);
