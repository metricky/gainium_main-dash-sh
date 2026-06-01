import { useBotSpecificDeals } from '@/hooks/useBotSpecificDeals';
import { BotTypesEnum, DCADealStatusEnum } from '@/types';
import type { DrawerBot } from '@/types/bots/drawer';
import { Activity, GitBranch } from 'lucide-react';
import React, { useMemo } from 'react';
import { ProgressBar } from '../../../ui/ProgressBar';
import { DrawerSection } from './DrawerSection';

export interface DrawerDCAMetricsProps {
  widgetId: string;
  botId?: string;
  bot?: DrawerBot;
}

interface DcaDistributionItem {
  dcaCount: number;
  deals: number;
  percentage: number;
}

interface RiskMetricsData {
  totalDeals: number;
  totalActiveDeals: number;
  totalFinishedDeals: number;
  avgDcasFinished: number;
  maxDcasFinished: number;
  maxConfiguredDcas: number;
  avgFinishedDcaCoverage: number;
  avgActiveDcaCoverage: number;
  finishedDistribution: DcaDistributionItem[];
}

export const DrawerDCAMetrics: React.FC<DrawerDCAMetricsProps> = ({
  widgetId,
  botId,
  bot,
}) => {
  const isComboBot = React.useMemo(
    () => bot?.type === BotTypesEnum.combo,
    [bot?.type]
  );

  const useDealsOpenInput = useMemo(
    () => ({
      botId: botId || '',
      status: DCADealStatusEnum.open,
      dealType: isComboBot ? ('combo' as const) : ('dca' as const),
    }),
    [botId, isComboBot]
  );

  const useDealsClosedInput = useMemo(
    () => ({
      botId: botId || '',
      status: DCADealStatusEnum.closed,
      dealType: isComboBot ? ('combo' as const) : ('dca' as const),
    }),
    [botId, isComboBot]
  );

  // Combine both live and paper deals for comprehensive analysis
  const { deals: activeDealsData, isLoading: activeLoading } =
    useBotSpecificDeals(useDealsOpenInput);

  const { deals: closedDealsData, isLoading: closedLoading } =
    useBotSpecificDeals(useDealsClosedInput);

  const botDeals = React.useMemo(() => {
    const result = [...activeDealsData, ...closedDealsData];
    return result;
  }, [activeDealsData, closedDealsData]);

  const riskMetrics = useMemo((): RiskMetricsData | null => {
    if (!bot || !botDeals.length) return null;

    const activeDeals = botDeals.filter(
      (deal) =>
        deal.status !== DCADealStatusEnum.canceled &&
        deal.status !== DCADealStatusEnum.closed
    );
    const completedDeals = botDeals.filter(
      (deal) =>
        deal.status === DCADealStatusEnum.canceled ||
        deal.status === DCADealStatusEnum.closed
    );

    const getConfiguredDcas = (deal: (typeof botDeals)[number]) => {
      const configuredFromSettings = Number(deal.settings?.ordersCount);

      if (
        Number.isFinite(configuredFromSettings) &&
        configuredFromSettings >= 0
      ) {
        return Math.max(0, Math.floor(configuredFromSettings));
      }

      const configuredFromLevels = Math.max(0, (deal.levels?.all ?? 0) - 1);
      return configuredFromLevels;
    };

    const getUsedDcas = (deal: (typeof botDeals)[number]) => {
      const buyTransactions = deal.transactions?.buy;
      const usedFromBuys =
        typeof buyTransactions === 'number'
          ? Math.max(0, Math.floor(buyTransactions) - 1)
          : undefined;

      const fallbackFromLevels = Math.max(0, (deal.levels?.complete ?? 0) - 1);
      const usedRaw = usedFromBuys ?? fallbackFromLevels;

      return Math.min(usedRaw, getConfiguredDcas(deal));
    };

    const completedDcaCounts = completedDeals.map((deal) => getUsedDcas(deal));

    const activeCoverageRatios = activeDeals
      .map((deal) => {
        const configuredDcas = getConfiguredDcas(deal);
        const usedDcas = getUsedDcas(deal);

        return configuredDcas > 0 ? usedDcas / configuredDcas : 0;
      })
      .filter((value) => Number.isFinite(value));

    const finishedCoverageRatios = completedDeals
      .map((deal) => {
        const configuredDcas = getConfiguredDcas(deal);
        const usedDcas = getUsedDcas(deal);

        return configuredDcas > 0 ? usedDcas / configuredDcas : 0;
      })
      .filter((value) => Number.isFinite(value));

    const finishedDistributionMap = completedDcaCounts.reduce(
      (acc, dcaCount) => {
        acc.set(dcaCount, (acc.get(dcaCount) ?? 0) + 1);
        return acc;
      },
      new Map<number, number>()
    );

    const finishedDistribution = Array.from(finishedDistributionMap.entries())
      .sort(([left], [right]) => left - right)
      .map(([dcaCount, deals]) => ({
        dcaCount,
        deals,
        percentage:
          completedDeals.length > 0 ? (deals / completedDeals.length) * 100 : 0,
      }));

    const avgDcasFinished =
      completedDcaCounts.length > 0
        ? completedDcaCounts.reduce((sum, value) => sum + value, 0) /
          completedDcaCounts.length
        : 0;

    const maxDcasFinished =
      completedDcaCounts.length > 0 ? Math.max(...completedDcaCounts) : 0;

    // Use the bot's current ordersCount setting rather than historical deal settings
    const botOrdersCount = Number(
      (bot as { settings?: { ordersCount?: string | number } })?.settings
        ?.ordersCount
    );
    const maxConfiguredDcas =
      Number.isFinite(botOrdersCount) && botOrdersCount > 0
        ? Math.floor(botOrdersCount)
        : Math.max(
            0,
            ...activeDeals.map((deal) => getConfiguredDcas(deal)),
            ...completedDeals.map((deal) => getConfiguredDcas(deal))
          );

    const avgFinishedDcaCoverage =
      finishedCoverageRatios.length > 0
        ? (finishedCoverageRatios.reduce((sum, value) => sum + value, 0) /
            finishedCoverageRatios.length) *
          100
        : 0;

    const avgActiveDcaCoverage =
      activeCoverageRatios.length > 0
        ? (activeCoverageRatios.reduce((sum, value) => sum + value, 0) /
            activeCoverageRatios.length) *
          100
        : 0;

    return {
      totalDeals: botDeals.length,
      totalActiveDeals: activeDeals.length,
      totalFinishedDeals: completedDeals.length,
      avgDcasFinished,
      maxDcasFinished,
      maxConfiguredDcas,
      avgFinishedDcaCoverage,
      avgActiveDcaCoverage,
      finishedDistribution,
    };
  }, [bot, botDeals]);

  if (activeLoading || closedLoading) {
    return (
      <DrawerSection
        widgetId={widgetId}
        widgetType="drawer-risk-metrics"
        title="DCA Analysis"
        icon={GitBranch}
        minSize={{ w: 6, h: 10 }}
        maxSize={{ w: 12, h: 16 }}
        hasOptions={false}
      >
        <div className="p-lg">
          <div className="text-center text-muted-foreground py-8">
            Loading DCA analysis...
          </div>
        </div>
      </DrawerSection>
    );
  }

  // Hide widget completely when no data is available (instead of showing misleading message)
  if (!bot || !riskMetrics) {
    return null;
  }

  return (
    <DrawerSection
      widgetId={widgetId}
      widgetType="drawer-risk-metrics"
      title="DCA Analysis"
      icon={GitBranch}
      minSize={{ w: 6, h: 10 }}
      maxSize={{ w: 12, h: 16 }}
      hasOptions={false}
    >
      <div className="p-sm md:p-md space-y-md">
        <div className="grid grid-cols-2 gap-sm">
          <div className="rounded-lg border border-border/40 bg-background/40 p-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Avg DCAs (Finished)
            </p>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {riskMetrics.avgDcasFinished.toFixed(1)}
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-background/40 p-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Max DCAs (Finished)
            </p>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {riskMetrics.maxDcasFinished}
            </div>
          </div>
        </div>

        <div className="space-y-sm rounded-lg border border-border/40 bg-background/40 p-sm">
          <div className="flex items-center gap-xs">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              DCA Coverage
            </h4>
          </div>

          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Finished Deals Coverage
              </span>
              <span className="text-xs font-medium text-foreground">
                {riskMetrics.avgFinishedDcaCoverage.toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              value={riskMetrics.avgFinishedDcaCoverage}
              max={100}
              className="h-2"
              variant="success"
            />
            <p className="text-xs text-muted-foreground">
              Average percentage of configured DCA levels used in finished deals
            </p>
          </div>

          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Active Deals Coverage
              </span>
              <span className="text-xs font-medium text-foreground">
                {riskMetrics.avgActiveDcaCoverage.toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              value={riskMetrics.avgActiveDcaCoverage}
              max={100}
              className="h-2"
              variant="warning"
            />
            <p className="text-xs text-muted-foreground">
              Average percentage of configured DCA levels currently used
            </p>
          </div>
        </div>

        <div className="space-y-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Finished Deals by DCA Count
            </p>
            <span className="text-xs text-muted-foreground">
              Total: {riskMetrics.totalFinishedDeals} / {riskMetrics.totalDeals}
            </span>
          </div>

          <div className="space-y-xs">
            {riskMetrics.finishedDistribution.length > 0 ? (
              riskMetrics.finishedDistribution.map((bucket) => (
                <div
                  key={`dca-finished-${bucket.dcaCount}`}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {bucket.dcaCount} DCA{bucket.dcaCount === 1 ? '' : 's'}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {bucket.deals} deals ({bucket.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={bucket.percentage}
                    max={100}
                    className="h-2"
                    variant="success"
                  />
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground py-2">
                No finished deals available yet.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-sm rounded-lg border border-border/40 bg-background/40 p-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {riskMetrics.maxConfiguredDcas}
              </div>
              <div className="text-xs text-muted-foreground">
                Max Configured DCAs
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {riskMetrics.avgFinishedDcaCoverage.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Avg Finished Coverage
              </div>
            </div>
          </div>
        </div>
      </div>
    </DrawerSection>
  );
};
