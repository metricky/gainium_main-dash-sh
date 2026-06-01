import { useTransformedExchangesFromContext } from '@/contexts/ExchangeDataContext';
import { useIsCompactSpacing } from '@/hooks/useSpacing';
import { useAuthStore } from '@/stores/authStore';
import { useExchangesStore } from '@/stores/exchangesStore';
import { useUIStore } from '@/stores/uiStore';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Slot, ExtensionSlot } from '@/lib/extensions';
import EmptyStateExchanges from '../components/exchanges/EmptyStateExchanges';
import MainLayout from '../components/layout/MainLayout';
import WidgetContainer from '../components/layout/WidgetContainer';
import {
  BotStatus,
  getCompatibilityDefaultSize,
  LatestOrders,
  OverviewQuickActions,
  PortfolioValue,
  Profit,
  TopDeals,
} from '../components/widgets/dashboard';
import HeroBalance from '../components/widgets/dashboard/HeroBalance';
import { PortfolioProvider } from '../contexts/PortfolioContext';

const Overview: React.FC = () => {
  const { exchanges, isLoading } = useTransformedExchangesFromContext();
  const initialLoaded = useExchangesStore((state) => state.initialLoaded);
  const filteredExchanges = React.useMemo(
    () => exchanges.filter((ex) => ex.id !== 'ALL'),
    [exchanges]
  );
  const navigate = useNavigate();
  const { user: u } = useAuthStore();

  // Drop one spacing step in compact mode so widget gaps actually feel tight.
  const isCompactSpacing = useIsCompactSpacing();
  const gapClass = isCompactSpacing ? 'gap-xs' : 'gap-md';

  // Require `onboardingSteps` to be defined: the auth-store persist slice
  // strips it on rehydrate so we wait for the fresh validateToken() payload
  // instead of flashing the widget on every reload.
  const shouldOnboard = useMemo(
    () => !!u && !!u.onboardingSteps && !u.onboardingSteps.earnProfit,
    [u]
  );

  const onboardingStepsCollapsed = useUIStore(
    (s) => s.onboardingStepsCollapsed
  );

  const onboardingStepsVisible = useUIStore((s) => s.onboardingStepsVisible);

  // Auto-show for users who still need onboarding, but never override the
  // dev-panel-driven `onboardingStepsVisible` flag — that would clobber manual
  // toggles every render.
  const showOnboardingWidget =
    onboardingStepsVisible || (shouldOnboard && !onboardingStepsCollapsed);

  const handleAddExchangeFromOverview = React.useCallback(
    () => navigate('/add-exchange'),
    [navigate]
  );

  // Only show empty state after the first successful load cycle has completed
  // to avoid flashing "No exchanges connected" during initial data bootstrap.
  const showEmptyState =
    initialLoaded && !isLoading && filteredExchanges.length === 0;

  return (
    <PortfolioProvider>
      <MainLayout pageTitle="Overview" activePage="/overview">
        {showEmptyState ? (
          <EmptyStateExchanges onAddExchange={handleAddExchangeFromOverview} />
        ) : (
          <WidgetContainer layout="none">
            <div className={`flex flex-col ${gapClass}`}>
              {showOnboardingWidget && (
                <Slot
                  name="overview.onboarding"
                  widgetId="onboarding-overview"
                  isCollapsible={false}
                  visible={showOnboardingWidget}
                />
              )}

              <div
                className={`grid grid-cols-1 ${gapClass} md:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(220px,260px)] lg:items-stretch`}
              >
                {/* At md the hero spans the row; at lg it sits beside BotStatus + QuickActions. */}
                <div
                  data-tour="overview.heroBalance"
                  className="md:col-span-2 lg:col-span-1"
                >
                  <HeroBalance />
                </div>
                <div
                  data-tour="overview.botStatus"
                  className="min-h-[300px]"
                >
                  <BotStatus
                    widgetId="bot-status-overview"
                    isCollapsible={false}
                  />
                </div>
                <div data-tour="overview.quickActions">
                  <OverviewQuickActions
                    widgetId="overview-quick-actions"
                    isCollapsible={false}
                    allowResize={false}
                    noWrapper
                    height="100%"
                  />
                </div>
              </div>

              <div className={`grid grid-cols-1 ${gapClass} lg:grid-cols-2`}>
                <div style={{ minHeight: '400px' }}>
                  <PortfolioValue
                    widgetId="portfolio-value-page"
                    allowResize={false}
                    height={`${getCompatibilityDefaultSize('portfolio-value').h * 80}px`}
                    isCollapsible={false}
                    hideHeaderValue
                  />
                </div>

                <div data-tour="overview.profit" style={{ minHeight: '400px' }}>
                  <Profit
                    widgetId="profit-over-time-page"
                    allowResize={false}
                    height={`${getCompatibilityDefaultSize('profit').h * 80}px`}
                    isCollapsible={false}
                    hideHeaderValue
                  />
                </div>
              </div>

              <div data-tour="overview.topDeals" style={{ minHeight: '220px' }}>
                <TopDeals widgetId="top-deals-overview" isCollapsible={false} />
              </div>

              <div
                className={`grid grid-cols-1 ${gapClass} lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`}
              >
                <div data-tour="overview.latestOrders" style={{ height: '700px' }}>
                  <LatestOrders
                    widgetId="latest-orders-overview"
                    showPagination={false}
                    isCollapsible={false}
                  />
                </div>

                <div style={{ height: '700px' }}>
                  <Slot
                    name="overview.curatedPresets"
                    widgetId="curated-presets-overview"
                    isCollapsible={false}
                    allowResize={false}
                    height="700px"
                  />
                </div>
              </div>
            </div>

            <ExtensionSlot name="overview.announcement" />
          </WidgetContainer>
        )}
      </MainLayout>
    </PortfolioProvider>
  );
};

export default Overview;
