import { useMemo } from 'react';

import type { BotFormMode } from '@/contexts/bots/form/BotFormProvider';
import { useBotFormRegistryContext } from '@/features/bots/widgets/BotForm';
import { useBotSettings } from '@/hooks/useBotSettings';
import { useComboBots } from '@/hooks/useComboBots';
import { useDcaBots } from '@/hooks/useDcaBots';
import { useGridBots } from '@/hooks/useGridBots';
/* import { useHedgeComboBots } from '@/hooks/useHedgeComboBots';
import { useHedgeDcaBots } from '@/hooks/useHedgeDcaBots'; */
import type { DCABot, HedgeBot, ComboBot, ExchangeInUser } from '@/types';
/* import type { ComboBot } from '@/types/comboBot';
import type { DCABot } from '@/types/dcaBot'; */
import type { GridBot } from '@/types/gridBot';
import { useExchangesFromContext } from '@/contexts/ExchangeDataContext';

export interface UseBotFormDataQueryOptions {
  botId?: string;
  mode: BotFormMode;
  debug?: boolean;
}

export interface UseBotFormDataQueryResult {
  dcaBots: DCABot[];
  gridBots: GridBot[];
  comboBots: ComboBot[];
  hedgeDcaBots: HedgeBot[];
  hedgeComboBots: HedgeBot[];
  bots: Array<DCABot | GridBot | ComboBot>;
  botsLoading: boolean;
  bot: DCABot | GridBot | ComboBot | null;
  botSettings: ReturnType<typeof useBotSettings>['botSettings'];
  botSettingsLoading: boolean;
  exchanges: ExchangeInUser[];
  exchangesLoading: boolean;
  refetchExchanges: () => Promise<void>;
}

export const useBotFormDataQuery = (
  options: UseBotFormDataQueryOptions
): UseBotFormDataQueryResult => {
  const { botId, mode } = options;
  const { botExperience } = useBotFormRegistryContext();
  const isDealEdit = useMemo(
    () => mode === 'deal-edit' || mode === 'deal-mass-edit',
    [mode]
  );
  const isSettingsReadonly = useMemo(
    () => mode === 'settings-readonly',
    [mode]
  );
  const isSkipLoadingBots = useMemo(
    () => isDealEdit || isSettingsReadonly,
    [isDealEdit, isSettingsReadonly]
  );
  const { bots: dcaBots, isLoading: dcaBotsLoading } = useDcaBots(
    {
      all: true,
    },
    !isSkipLoadingBots
  );
  const { bots: gridBots, isLoading: gridBotsLoading } = useGridBots(
    undefined,
    !isSkipLoadingBots
  );
  const { bots: comboBots, isLoading: comboBotsLoading } = useComboBots(
    {
      all: true,
    },
    !isSkipLoadingBots
  );
  /*   const { bots: hedgeDcaBots } = useHedgeDcaBots({ all: true });
  const { bots: hedgeComboBots } = useHedgeComboBots({ all: true }); */

  const hedgeDcaBots: HedgeBot[] = [];
  const hedgeComboBots: HedgeBot[] = [];

  const bots = useMemo(() => {
    // Aggregate only DCA, Grid, and Combo bots for the standard BotForm context
    const aggregated = new Map<string, DCABot | GridBot | ComboBot>();
    const candidateLists: Array<
      Array<DCABot | GridBot | ComboBot> | undefined
    > = [dcaBots, gridBots, comboBots];

    candidateLists.forEach((list) => {
      list?.forEach((candidate) => {
        const identifier = (candidate as { _id?: string })._id;
        if (identifier) {
          aggregated.set(identifier, candidate);
        }
      });
    });

    return Array.from(aggregated.values());
  }, [dcaBots, gridBots, comboBots]);

  const { botSettings, isLoading: botSettingsLoading } = useBotSettings(
    botId,
    botExperience.id
  );

  const bot = useMemo(() => {
    if (mode !== 'edit' || !botId) {
      return null;
    }
    return (
      bots?.find((candidate) => candidate && candidate._id === botId) ?? null
    );
  }, [bots, botId, mode]);

  const { data, loading, refresh } = useExchangesFromContext();

  return {
    dcaBots,
    gridBots,
    comboBots,
    hedgeDcaBots,
    hedgeComboBots,
    bots,
    botsLoading: dcaBotsLoading || gridBotsLoading || comboBotsLoading,
    bot,
    botSettings,
    botSettingsLoading,
    exchanges: data.data.exchanges || [],
    exchangesLoading: loading,
    refetchExchanges: refresh,
  };
};
