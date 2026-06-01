/**
 * Per-row actions cell for the hedge bot tables.
 *
 * Mirrors the action menu the regular trading-bots table renders via
 * BotActionsMenuItems, with hedge-aware wiring:
 *  - Start/Stop goes through `changeStatus` with the hedge wrapper id +
 *    `hedgeDca`/`hedgeCombo` type (the leg-level toggle would only flip
 *    a single leg and the wrapper's live store entry would never see it).
 *  - Clone navigates to `/hedge/{bot|combo}/new?load=<id>` — the new-page
 *    form recognises `?load=<id>` and seeds both legs from the source
 *    bot. Same UX as the legacy "Duplicate" item in the old table.
 *  - Delete/Archive/Share/Restart delegate to the shared mutation hooks
 *    which already accept `type: BotTypesEnum` and pass it through.
 *
 * Each menu row stops propagation so clicking an item doesn't also open
 * the row's drawer (the `<DataTable onRowClick>` would otherwise fire).
 */
import { MoreVertical } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BotActionsMenuItems } from '@/components/bots/BotActionsMenuItems';
import {
  BotStatusConfirmationModal,
  DeleteConfirmationModal,
} from '@/components/modals';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useBotArchive,
  useBotDelete,
  useBotRestart,
} from '@/hooks/useBotMutations';
import { GraphQLClient, getGraphQLConfig } from '@/lib/api';
import { otherQueries } from '@/lib/api/GraphQLQueries-other-queries';
import { logger } from '@/lib/loggerInstance';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useHedgeComboBotsStore } from '@/stores/live/hedgeComboBotsStore';
import { useHedgeDcaBotsStore } from '@/stores/live/hedgeDcaBotsStore';
import {
  BotTypesEnum,
  StrategyEnum,
  type ComboBot,
  type DCABot,
  type HedgeBot,
} from '@/types';

const findLeg = (
  bots: (DCABot | ComboBot)[] | undefined,
  strategy: StrategyEnum
): DCABot | ComboBot | undefined =>
  bots?.find((b) => b.settings?.strategy === strategy);

export interface HedgeBotActionsCellProps {
  bot: HedgeBot;
  botType: BotTypesEnum.hedgeDca | BotTypesEnum.hedgeCombo;
}

export const HedgeBotActionsCell: React.FC<HedgeBotActionsCellProps> = ({
  bot,
  botType,
}) => {
  const navigate = useNavigate();
  const { tokens } = useAuthStore();
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  const [toggling, setToggling] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const restartMutation = useBotRestart();
  const archiveMutation = useBotArchive();
  const deleteMutation = useBotDelete();

  const basePath =
    botType === BotTypesEnum.hedgeCombo ? '/hedge/combo' : '/hedge/bot';
  const editPath = `${basePath}/edit/${bot._id}`;
  const clonePath = `${basePath}/new?load=${bot._id}`;

  const longLeg = findLeg(bot.bots, StrategyEnum.long);
  const shortLeg = findLeg(bot.bots, StrategyEnum.short);
  const name =
    longLeg?.settings?.name || shortLeg?.settings?.name || 'Hedge bot';
  const totalActiveDeals =
    (longLeg?.dealsInBot?.active ?? 0) + (shortLeg?.dealsInBot?.active ?? 0);
  const isOpen = bot.status === 'open' || bot.status === 'monitoring';

  const runToggle = useCallback(
    async (nextStatus: 'open' | 'closed', closeType?: string) => {
      if (toggling || !tokens?.accessToken) return;
      setToggling(true);

      const store =
        botType === BotTypesEnum.hedgeCombo
          ? useHedgeComboBotsStore.getState()
          : useHedgeDcaBotsStore.getState();
      const previousStatus = bot.status;
      store.updateBot({ ...bot, status: nextStatus });

      try {
        const endpoint =
          import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
        const config = getGraphQLConfig(tokens, isLiveTrading);
        const client = new GraphQLClient(
          endpoint,
          config.token,
          config.paperContext
        );
        const { query, variables } = otherQueries.changeStatus({
          id: bot._id,
          status: nextStatus,
          type: botType,
          ...(closeType ? { closeType: closeType as never } : {}),
        });
        const response = await client.request<{
          changeStatus: { status: string; reason?: string };
        }>(query, variables);
        if (response.changeStatus.status !== 'OK') {
          throw new Error(
            response.changeStatus.reason || 'Failed to change hedge status'
          );
        }
        toast.success(
          nextStatus === 'open' ? 'Hedge bot started' : 'Hedge bot stopped'
        );
      } catch (error) {
        store.updateBot({ ...bot, status: previousStatus });
        const message = error instanceof Error ? error.message : String(error);
        logger.error('[HedgeBotActionsCell] Toggle status failed', {
          botId: bot._id,
          error: message,
        });
        toast.error(`Failed to update hedge status: ${message}`);
      } finally {
        setToggling(false);
      }
    },
    [bot, botType, toggling, tokens, isLiveTrading]
  );

  // Mirrors the card / standalone footer UX: stopping with active deals
  // always opens the close-type dialog; start or stop-with-no-deals goes
  // through directly.
  const requestToggle = useCallback(() => {
    if (toggling || !tokens?.accessToken) return;
    if (isOpen && totalActiveDeals > 0) {
      setStatusModalOpen(true);
      return;
    }
    void runToggle(isOpen ? 'closed' : 'open');
  }, [toggling, tokens, isOpen, totalActiveDeals, runToggle]);

  const handleConfirmStatusChange = useCallback(
    (closeType?: string) => {
      setStatusModalOpen(false);
      void runToggle(isOpen ? 'closed' : 'open', closeType);
    },
    [runToggle, isOpen]
  );

  const handleRestart = useCallback(() => {
    restartMutation.mutate(
      { id: bot._id, type: botType },
      {
        onSuccess: () => toast.success('Hedge bot restarted'),
        onError: (e) => toast.error(`Restart failed: ${e.message}`),
      }
    );
  }, [restartMutation, bot._id, botType]);

  const handleArchive = useCallback(() => {
    const archive = bot.status !== 'archive';
    archiveMutation.mutate({ id: bot._id, archive, type: botType });
  }, [archiveMutation, bot._id, botType, bot.status]);

  const handleShareConfig = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(bot, null, 2));
      toast.success('Configuration copied to clipboard');
    } catch (e) {
      toast.error('Failed to copy configuration');
      logger.error('[HedgeBotActionsCell] Share copy failed', e);
    }
  }, [bot]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync({ id: bot._id, type: botType });
      setDeleteModalOpen(false);
    } catch (e) {
      logger.error('[HedgeBotActionsCell] Delete failed', e);
    }
  }, [deleteMutation, bot._id, botType]);

  const symbolQuote = useMemo(
    () => bot.symbol?.[0]?.value?.quoteAsset ?? '',
    [bot.symbol]
  );

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            onClick={(e) => e.stopPropagation()}
            aria-label="Open hedge bot actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <BotActionsMenuItems
          align="end"
          className="z-50 w-56"
          bot={{
            id: bot._id,
            name,
            type: botType,
            status: bot.status,
          }}
          pending={{
            statusToggle: toggling,
            restart: restartMutation.isPending,
            archive: archiveMutation.isPending,
            delete: deleteMutation.isPending,
          }}
          onToggleStatus={requestToggle}
          onRestart={handleRestart}
          onEdit={() => navigate(editPath)}
          onClone={() => navigate(clonePath)}
          onShareConfig={handleShareConfig}
          onArchive={handleArchive}
          onDelete={() => setDeleteModalOpen(true)}
          onCopyToLive={() => {
            toast.info(
              "Live↔paper copy isn't available for hedge bots yet. Cloned on the current trading context instead."
            );
            navigate(clonePath);
          }}
        />
      </DropdownMenu>

      <BotStatusConfirmationModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        onConfirm={handleConfirmStatusChange}
        botName={name}
        currentStatus={bot.status}
        targetStatus={isOpen ? 'closed' : 'open'}
        hasActiveDeals={totalActiveDeals > 0}
        isLoading={toggling}
      />

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete hedge bot"
        description="Are you sure you want to delete this hedge bot? Both legs will be removed. This action cannot be undone."
        itemName={name}
        itemType="bot"
        additionalInfo={{
          activeDeals: totalActiveDeals,
          totalValue: 0,
          currency: symbolQuote,
          lastActivity: bot?.created || 'Unknown',
        }}
        isLoading={deleteMutation.isPending}
        requireConfirmation={false}
      />
    </div>
  );
};

export default HedgeBotActionsCell;
