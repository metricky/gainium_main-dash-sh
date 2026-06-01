import { Loader2 } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  GridPageProvider,
  useOptionalGridPageContext,
} from '@/contexts/bots/grid/GridPageProvider';
import type { GridPageOptions } from '@/types/bots/grid/api';

import { useGridBotData } from '@/hooks/bots/grid/useGridBotData';
import { EventsFeed } from './sections/EventsFeed';
import { FundsOverview } from './sections/FundsOverview';
import { InfoPanel } from './sections/InfoPanel';
import { MarketOverview } from './sections/MarketOverview';
import { OrdersActivity } from './sections/OrdersActivity';
import { ProfitInsights } from './sections/ProfitInsights';
import { SummaryHeader } from './sections/SummaryHeader';
import { TransactionsPanel } from './sections/TransactionsPanel';

const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex min-h-[320px] flex-col items-center justify-center gap-sm rounded-lg border border-border/60 bg-background/40 p-lg text-sm text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
    <span>{message ?? 'Loading bot data...'}</span>
  </div>
);

const MissingBotContext: React.FC = () => (
  <Alert className="border-border/60 bg-background/50 text-muted-foreground">
    <AlertTitle>Grid bot not attached</AlertTitle>
    <AlertDescription>
      Select a grid bot from the edit page to view live analytics, or open this
      widget within a grid bot layout.
    </AlertDescription>
  </Alert>
);

type GridBotDataProps = {
  widgetId: string;
  data?: Record<string, unknown>;
} & Record<string, unknown>;

const GridBotDataContent: React.FC = () => {
  const {
    status,
    error,
    botName,
    pairLabel,
    exchangeLabel,
    currency,
    currencyOptions,
    onCurrencyChange,
    onRefresh,
    metrics,
    funds,
    isFuturesBot,
    leverage,
    orders,
    transactions,
    events,
    charts,
    marketOverview,
    onOrdersTabChange,
    onMarketOverviewChange,
    formatAmount,
    formatDateTime,
  } = useGridBotData();

  const isLoading = status === 'loading';
  const hasData = Boolean(
    metrics ||
    funds ||
    orders.rows.length ||
    transactions.rows.length ||
    charts.hasProfitData ||
    events.items.length
  );

  return (
    <div className="flex flex-col gap-lg p-lg">
      {error && (
        <Alert
          variant="destructive"
          className="border-destructive/60 bg-destructive/10 text-destructive"
        >
          <AlertTitle>Failed to load bot data</AlertTitle>
          <AlertDescription className="flex flex-col gap-sm text-sm">
            <span>{error}</span>
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                className="gap-1"
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && !hasData ? (
        <LoadingOverlay />
      ) : (
        <div className="flex flex-col gap-lg">
          <SummaryHeader
            botName={botName}
            pairLabel={pairLabel}
            exchangeLabel={exchangeLabel}
            {...(metrics?.status !== undefined
              ? { status: metrics.status }
              : {})}
            {...(metrics?.statusReason
              ? { statusReason: metrics.statusReason }
              : {})}
            {...(metrics?.workingTime
              ? { workingTime: metrics.workingTime }
              : {})}
            currency={currency}
            currencyOptions={currencyOptions}
            onCurrencyChange={onCurrencyChange}
            onRefresh={onRefresh}
            isRefreshing={isLoading}
            {...(metrics ? { metrics } : {})}
            formatAmount={formatAmount}
          />

          <div className="grid gap-lg xl:grid-cols-[2fr_1fr]">
            <div className="space-y-lg">
              <FundsOverview
                {...(funds ? { funds } : {})}
                currency={currency}
                formatAmount={formatAmount}
              />

              <ProfitInsights
                metrics={charts.metrics}
                data={charts.profit}
                hasData={charts.hasProfitData}
                currency={currency}
                formatAmount={formatAmount}
                formatDateTime={formatDateTime}
              />

              {marketOverview.showTradingView && (
                <div className="rounded-lg border border-border/60 bg-card/70 p-5 text-sm text-muted-foreground">
                  Trading view integration will appear here. Use the toggle
                  above to control visibility.
                </div>
              )}
            </div>

            <div className="space-y-lg">
              <InfoPanel
                {...(metrics ? { metrics } : {})}
                {...(funds ? { funds } : {})}
                leverage={leverage}
                isFuturesBot={isFuturesBot}
                formatAmount={formatAmount}
              />

              <MarketOverview
                state={marketOverview}
                onChange={onMarketOverviewChange}
                {...(funds ? { funds } : {})}
                pairLabel={pairLabel}
                exchangeLabel={exchangeLabel}
                formatAmount={formatAmount}
              />

              {marketOverview.showOrders && (
                <OrdersActivity
                  orders={orders}
                  onTabChange={onOrdersTabChange}
                  formatAmount={formatAmount}
                  formatDateTime={formatDateTime}
                />
              )}

              {marketOverview.showTransactions && (
                <TransactionsPanel
                  transactions={transactions}
                  currency={currency}
                  formatAmount={formatAmount}
                  formatDateTime={formatDateTime}
                />
              )}

              <EventsFeed events={events} formatDateTime={formatDateTime} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GridBotData: React.FC<GridBotDataProps> = ({
  data,
  widgetId: _widgetId,
  ..._rest
}) => {
  const context = useOptionalGridPageContext();
  const botIdRaw =
    data && typeof data['botId'] === 'string'
      ? (data['botId'] as string)
      : undefined;
  const demoFlag =
    data && typeof data['demo'] === 'boolean'
      ? (data['demo'] as boolean)
      : undefined;

  const providerOptions: GridPageOptions | undefined = botIdRaw
    ? {
        botId: String(botIdRaw),
        ...(typeof demoFlag === 'boolean' ? { demo: demoFlag } : {}),
      }
    : undefined;

  if (!context && !providerOptions) {
    return <MissingBotContext />;
  }

  if (!context && providerOptions) {
    return (
      <GridPageProvider options={providerOptions}>
        <GridBotDataContent />
      </GridPageProvider>
    );
  }

  return <GridBotDataContent />;
};

export default GridBotData;
