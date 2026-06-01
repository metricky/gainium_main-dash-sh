import type { DrawerBot } from '@/types/bots/drawer';
import { ExternalLink, Play, TestTube } from 'lucide-react';
import React, { useState } from 'react';
import { useBotBacktestSummary } from '../../../../hooks/useBotBacktestSummary';
/* import { useComboBots } from '../../../../hooks/useComboBots';
import { useDcaBots } from '../../../../hooks/useDcaBots';
import { useGridBots } from '../../../../hooks/useGridBots'; */
/* import { useHedgeComboBots } from '../../../../hooks/useHedgeComboBots';
import { useHedgeDcaBots } from '../../../../hooks/useHedgeDcaBots'; */
import BacktestRunnerModal from '../../../modals/BacktestRunnerModal';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { DrawerSection } from './DrawerSection';

export interface DrawerBacktestResultsProps {
  widgetId: string;
  botId?: string;
  bot?: DrawerBot;
}

// BacktestSummary interface is now imported from the hook

export const DrawerBacktestResults: React.FC<DrawerBacktestResultsProps> = ({
  widgetId,
  botId,
  bot: botProp,
}) => {
  const [backtestRunnerModalOpen, setBacktestRunnerModalOpen] = useState(false);

  // Determine bot type from prop
  /* const botType = botProp?.type || 'dca'; */

  // Get bot data (exclude terminal deals)
  /*  const { bots: dcaBots, isLoading: dcaLoading } = useDcaBots({
    terminal: false,
    paperContext: false,
    all: true,
  });

  const { bots: gridBots, isLoading: gridLoading } = useGridBots({
    paperContext: false,
  });

  const { bots: comboBots, isLoading: comboLoading } = useComboBots({
    paperContext: false,
  }); */

  /* const { bots: hedgeDcaBots, isLoading: hedgeDcaLoading } = useHedgeDcaBots({
    terminal: false,
    paperContext: false,
  });

  const { bots: hedgeComboBots, isLoading: hedgeComboLoading } =
    useHedgeComboBots({
      terminal: false,
      paperContext: false,
    }); */

  // Use prop bot if available, otherwise find from fetched data
  const bot = botProp; /* ||
    (botType === 'grid'
      ? gridBots.find((b) => b._id === botId)
      : botType === 'combo'
        ? comboBots.find((b) => b._id === botId)
        : botType === 'hedgeDca'
          ? hedgeDcaBots.find((b) => b._id === botId)
          : botType === 'hedgeCombo'
            ? hedgeComboBots.find((b) => b._id === botId)
            : dcaBots.find((b) => b._id === botId)) */

  /*  const botsLoading =
    dcaLoading ||
    gridLoading ||
    comboLoading ||
    hedgeDcaLoading ||
    hedgeComboLoading; */

  // Get backtest summary for this bot
  const {
    summary,
    isLoading: backtestLoading,
    error,
    refetch,
  } = useBotBacktestSummary(botId || '', bot);

  const isLoading = /* botsLoading ||  */ backtestLoading;

  // Handle navigation to full backtest page with bot filters
  const handleViewAllBacktests = () => {
    const params = new URLSearchParams({
      symbol: bot?.pair || '',
      strategy: bot?.settings?.strategy || '',
      exchange: bot?.exchange || '',
    });
    window.open(`/backtests?${params.toString()}`, '_blank');
  };

  if (isLoading) {
    return (
      <DrawerSection
        widgetId={widgetId}
        widgetType="drawer-backtest-results"
        title="Backtest Summary"
        icon={TestTube}
        minSize={{ w: 6, h: 8 }}
        maxSize={{ w: 12, h: 16 }}
        hasOptions={false}
      >
        <div className="p-sm">
          <div className="space-y-xs">
            <div className="h-4 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
          </div>
        </div>
      </DrawerSection>
    );
  }

  if (!bot) {
    return (
      <DrawerSection
        widgetId={widgetId}
        widgetType="drawer-backtest-results"
        title="Backtest Summary"
        icon={TestTube}
        minSize={{ w: 6, h: 8 }}
        maxSize={{ w: 12, h: 16 }}
        hasOptions={false}
      >
        <div className="p-sm">
          <div className="text-center text-muted-foreground text-sm">
            Bot not found
          </div>
        </div>
      </DrawerSection>
    );
  }

  if (error) {
    return (
      <DrawerSection
        widgetId={widgetId}
        widgetType="drawer-backtest-results"
        icon={TestTube}
        title="Backtest Summary"
        minSize={{ w: 6, h: 8 }}
        maxSize={{ w: 12, h: 16 }}
        hasOptions={false}
      >
        <div className="p-sm">
          <div className="flex items-center gap-xs mb-3">
            <TestTube className="w-4 h-4 text-white" />
            <h3 className="text-sm font-semibold">Backtest Summary</h3>
          </div>
          <div className="text-center text-muted-foreground text-sm">
            Failed to load backtest data
          </div>
        </div>
      </DrawerSection>
    );
  }

  return (
    <DrawerSection
      widgetId={widgetId}
      widgetType="drawer-backtest-results"
      title="Backtest Summary"
      icon={TestTube}
      minSize={{ w: 6, h: 8 }}
      maxSize={{ w: 12, h: 16 }}
      hasOptions={false}
      headerActions={
        <Badge variant="secondary" className="text-xs">
          {summary.totalBacktests} tests
        </Badge>
      }
    >
      <div className="p-sm">
        {summary.totalBacktests > 0 ? (
          <>
            {/* Quick Stats - Compact 2-column grid */}
            <div className="grid grid-cols-2 gap-xs mb-3">
              <div className="bg-muted/50 rounded p-xs">
                <div className="text-xs text-muted-foreground">Avg Return</div>
                <div
                  className={`text-sm font-medium ${summary.avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {summary.avgReturn >= 0 ? '+' : ''}
                  {summary.avgReturn}%
                </div>
              </div>
              <div className="bg-muted/50 rounded p-xs">
                <div className="text-xs text-muted-foreground">
                  Avg Win Rate
                </div>
                <div className="text-sm font-medium">{summary.avgWinRate}%</div>
              </div>
            </div>

            {/* Recent Backtests - Compact list */}
            <div className="space-y-1 mb-3">
              <div className="text-xs font-medium text-muted-foreground">
                Recent Tests
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {summary.recentBacktests.map((backtest) => (
                  <div
                    key={backtest._id}
                    className="flex items-center justify-between text-xs p-1 rounded hover:bg-muted/50"
                  >
                    <span className="truncate">
                      {backtest.duration?.periodName || 'Unknown period'}
                    </span>
                    <span
                      className={`font-medium ${(backtest.financial?.netProfitTotalPerc || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {(backtest.financial?.netProfitTotalPerc || 0) >= 0
                        ? '+'
                        : ''}
                      {Math.round(
                        (backtest.financial?.netProfitTotalPerc || 0) * 100
                      ) / 100}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions - Compact buttons */}
            <div className="flex gap-xs">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={() => setBacktestRunnerModalOpen(true)}
              >
                <Play className="w-3 h-3 mr-1" />
                Run Test
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs h-7"
                onClick={handleViewAllBacktests}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View All
              </Button>
            </div>
          </>
        ) : (
          // Empty state - Very compact
          <div className="text-center py-4">
            <TestTube className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-xs text-muted-foreground mb-2">
              No backtests yet
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => setBacktestRunnerModalOpen(true)}
            >
              <Play className="w-3 h-3 mr-1" />
              Run First Test
            </Button>
          </div>
        )}
      </div>

      {/* Backtest Runner Modal */}
      <BacktestRunnerModal
        open={backtestRunnerModalOpen}
        onOpenChange={setBacktestRunnerModalOpen}
        botId={botId || ''}
        botName={bot?.settings?.name}
        botSymbol={bot.pair}
        bot={bot}
        onRunBacktest={() => {
          // Backtest is now integrated with backend via useRunBacktest hook
          // Refresh backtest data after running
          refetch();
        }}
      />
    </DrawerSection>
  );
};

export default DrawerBacktestResults;
