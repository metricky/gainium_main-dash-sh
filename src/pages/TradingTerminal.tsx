import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  BotPanelLayout,
  type DesktopLayoutConfig,
} from '@/components/bots/panels/BotPanelLayout';
import { PanelContainer } from '@/components/bots/panels/PanelContainer';
import MainLayout from '@/components/layout/MainLayout';
import WidgetContainer from '@/components/layout/WidgetContainer';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
/* import { ChartIntervalActions } from '@/features/trading-terminal/components/ChartIntervalActions'; */
import { BotChartPanel } from '@/components/bots/panels';
import { TVChartPicker } from '@/components/widgets/shared/TradingViewChart';
import type { TradingViewChartRef } from '@/components/widgets/shared/TradingViewChart/TradingViewChart';
import {
  TradingTerminalUtilsProvider,
  useTradingTerminalUtils,
} from '@/context/TradingTerminalUtilsContext';
import { ExchangeOrdersPanel } from '@/features/trading-terminal/components/ExchangeOrdersPanel';
import { OpenOrdersPanel } from '@/features/trading-terminal/components/OpenOrdersPanel';
import { OrderEntryPanel } from '@/features/trading-terminal/components/OrderEntryPanel';
import { TradingTerminalProvider } from '@/features/trading-terminal/context';
import { indicatorStore } from '@/stores/indicatorStore';
import type { BotChartData } from '@/types';
import { exampleOrdersStore } from '@/utils/bots/dca/example-orders';

const TradingTerminalWidget: React.FC = () => {
  useEffect(() => {
    return () => {
      indicatorStore.reset();
      exampleOrdersStore.reset();
    };
  }, []);

  const [chartData, setChartData] = useState<BotChartData>({});

  const handleFormDataChange = useCallback((data: BotChartData) => {
    setChartData(data);
  }, []);

  const tvRef = useRef<TradingViewChartRef | null>(null);

  // Memoize desktop layout config
  const desktopLayout: DesktopLayoutConfig = useMemo(
    () => ({ topSplit: [65, 35], verticalSplit: [60, 40] }),
    []
  );

  // Memoize mobile tab labels
  const mobileTabLabels = useMemo(
    () => ({
      settings: 'Order',
      chart: 'Chart',
      insights: 'Open',
    }),
    []
  );

  const terminalContent = useMemo(
    () => ({
      content: <OrderEntryPanel onFormDataChange={handleFormDataChange} />,
    }),
    [handleFormDataChange]
  );

  const { activePickerField, handleChartPick, onActiveChanged } =
    useTradingTerminalUtils();

  const chartContent = useMemo(
    () => ({
      content: (
        <>
          <BotChartPanel
            widgetId="bot-chart"
            className="h-full"
            {...(chartData.symbol ? { symbol: chartData.symbol } : {})}
            data={{
              ...(chartData.symbol ? { symbol: chartData.symbol } : {}),
              exchange: chartData.exchange || 'binance',
              ...(chartData.botId ? { botId: chartData.botId } : {}),
            }}
            ref={tvRef}
          />
          <TVChartPicker
            chartRef={tvRef}
            isActive={!!activePickerField}
            onPick={handleChartPick}
            onActiveChange={onActiveChanged}
          />
        </>
      ),
    }),
    [chartData, activePickerField, handleChartPick, onActiveChanged]
  );

  const insightsContent = useMemo(
    () => (
      <PanelContainer
        paddinglessBody
        containerClassName="min-h-[220px]"
        content={
          <Tabs defaultValue="deals" className="h-full flex flex-col">
            <TabsList>
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="exchange">Exchange Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="deals" className="flex-1 overflow-hidden">
              <OpenOrdersPanel />
            </TabsContent>
            <TabsContent value="exchange" className="flex-1 overflow-hidden">
              <ExchangeOrdersPanel />
            </TabsContent>
          </Tabs>
        }
      />
    ),
    []
  );

  return (
    <MainLayout
      pageTitle="Trading Terminal"
      activePage="/terminal"
      fullyScrollable
    >
      <TradingTerminalProvider>
        <WidgetContainer layout="flex">
          <BotPanelLayout
            chart={chartContent}
            form={terminalContent}
            insights={insightsContent}
            desktopLayout={desktopLayout}
            className="flex-1"
            botType="terminal"
            mobileFullscreen={true}
            mobileTabLabels={mobileTabLabels}
            scrollable
          />
        </WidgetContainer>
      </TradingTerminalProvider>
    </MainLayout>
  );
};

const TradingTerminal: React.FC = () => {
  return (
    <TradingTerminalUtilsProvider>
      <TradingTerminalWidget />
    </TradingTerminalUtilsProvider>
  );
};

export default TradingTerminal;
