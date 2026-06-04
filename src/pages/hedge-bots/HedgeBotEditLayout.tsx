/**
 * HedgeBotEditLayout — page-level layout for hedge bot create/edit.
 *
 * Step B.2.3: unified hedge save lands. Each leg's BotFormWidget gets a
 * formDataRef so a top-level "Save hedge bot" button can read both legs
 * synchronously without forcing a re-render on every keystroke. The save
 * handler maps each leg via the existing mapFormDataToPayload, assembles
 * { long, short, sharedSettings }, and dispatches the corresponding
 * createHedge*Bot / changeHedge*Bot mutation.
 *
 * Inner per-leg Save buttons are still present (each leg is a full
 * BotFormWidget) — they save STANDALONE dca/combo bots and should not be
 * clicked. The amber banner warns the user; suppressing them cleanly
 * requires plumbing a forceSubmitDisabled prop through BotFormShell, which
 * is a follow-up polish slice (see B.2.3.b in the plan).
 *
 * Pending:
 *  - B.2.4: shared-settings → leg sync (mirror tpPerc/useTp/etc into both
 *    legs' formData so they save consistently).
 *  - Create-from-template flow (`?load=<botId>`) still uses defaults; will
 *    use getHedge*BotSettings in a follow-up slice.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BotPanelInsights,
  BotPanelLayout,
  type BotPanelInsightsTab,
} from '@/components/bots/panels';
import { type PanelContentConfig } from '@/components/bots/panels/PanelContainer';
import { Celebration } from '@/components/onboarding/Celebration';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HedgeBacktestActiveView,
  HedgeBacktestListView,
} from '@/components/widgets/bots/backtest/HedgeBacktestTab';
import SettingsRow from '@/components/widgets/shared/SettingsRow';
import { useBotFormState } from '@/contexts/bots/form/BotFormProvider';
import {
  useHedgeBotForm,
  type HedgeLeg,
} from '@/contexts/bots/form/HedgeBotFormProvider';
import {
  useExchangesFromContext,
  useTradingPairsFromContext,
} from '@/contexts/ExchangeDataContext';
import {
  HEDGE_QUICK_PRESETS,
  getHedgeLegDcaState,
  type HedgeQuickPreset,
} from '@/features/bots/bot-types/hedge/quickPresets';
import BotFormWidget from '@/features/bots/widgets/BotForm/BotFormWidget';
import {
  BacktestSettingsDialog,
  type BacktestConfig,
} from '@/features/bots/widgets/BotForm/components/BacktestSettingsDialog';
import { QuickModeToggle } from '@/features/bots/widgets/BotForm/components/QuickModeToggle';
import {
  useHedgeBacktestRunner,
  type HedgeBacktestHistoryItem,
  type HedgeBacktestSnapshot,
} from '@/hooks/bots/hedge/useHedgeBacktestRunner';
import { GraphQLClient, getGraphQLConfig } from '@/lib/api';
import { botQueries } from '@/lib/api/GraphQLQueries-bot-queries';
import { otherQueries } from '@/lib/api/GraphQLQueries-other-queries';
import { logger } from '@/lib/loggerInstance';
import { toast } from '@/lib/toast';
import { mapFormDataToPayload } from '@/mappers/bots/dca/map-form-data-to-payload';
import { useAuthStore } from '@/stores/authStore';
import { useHedgeComboBotsStore } from '@/stores/live/hedgeComboBotsStore';
import { useHedgeDcaBotsStore } from '@/stores/live/hedgeDcaBotsStore';
import { useUIStore } from '@/stores/uiStore';
import {
  BotTypesEnum,
  ExchangeIntervals,
  StrategyEnum,
  type ComboBot,
  type DCABot,
  type HedgeBot,
} from '@/types';
import type { BotFormData } from '@/types/bots/form';
import HedgeChartPanel from './HedgeChartPanel';
import HedgeQuickLeg, { HedgeQuickFooter } from './HedgeQuickLeg';

/**
 * Publishes the active leg's current pair + exchangeUUID up to the outer
 * hedge context, and registers a writer the chart can call when the user
 * picks a new symbol on the TradingView widget. Because only the active
 * leg mounts at a time, this is always the leg the chart is showing —
 * picks land on this leg's formData and never on the other leg.
 *
 * Also pins the leg's `strategy` to the leg type. The Direction field is
 * hidden inside hedge legs (each tab's leg type implies the direction),
 * so without this pin both legs would default to `StrategyEnum.long` and
 * the chart's example-orders preview for the short leg would draw on the
 * wrong side of the price. The save flow already force-sets the payload
 * `strategy` per leg; this ensures the in-form state matches.
 */
const HedgeLegActiveChartPublisher: React.FC<{ leg: HedgeLeg }> = ({ leg }) => {
  const { setActiveLegPair, setActiveLegExchangeUUID, chartSymbolWriterRef } =
    useHedgeBotForm();
  const { formData, updateFormData } = useBotFormState();

  const firstPair = Array.isArray(formData.pair)
    ? (formData.pair[0] ?? null)
    : (formData.pair ?? null);

  const expectedStrategy =
    leg === 'long' ? StrategyEnum.long : StrategyEnum.short;
  const currentStrategy =
    formData.type === BotTypesEnum.combo
      ? formData.combo.strategy
      : formData.dca.strategy;

  useEffect(() => {
    setActiveLegPair(firstPair || null);
  }, [firstPair, setActiveLegPair]);

  useEffect(() => {
    setActiveLegExchangeUUID(formData.exchangeUUID ?? null);
  }, [formData.exchangeUUID, setActiveLegExchangeUUID]);

  useEffect(() => {
    if (currentStrategy !== expectedStrategy) {
      updateFormData('strategy' as never, expectedStrategy as never);
    }
  }, [currentStrategy, expectedStrategy, updateFormData]);

  useEffect(() => {
    chartSymbolWriterRef.current = (newPair: string) => {
      updateFormData('pair' as never, [newPair] as never);
    };
    return () => {
      chartSymbolWriterRef.current = null;
    };
  }, [chartSymbolWriterRef, updateFormData]);

  return null;
};

const findLegBot = (
  bots: HedgeBot['bots'] | undefined,
  strategy: StrategyEnum
): DCABot | ComboBot | undefined =>
  bots?.find((b) => b.settings?.strategy === strategy);

export const HedgeBotEditLayout: React.FC = () => {
  const {
    mode,
    botType,
    legBotType,
    botId,
    sharedSettings,
    updateSharedSetting,
    longInitialFormData,
    shortInitialFormData,
    isLoadingHedgeBot,
    loadError,
    hedgeBot,
    refetchHedgeBot,
  } = useHedgeBotForm();

  const navigate = useNavigate();
  const { tokens } = useAuthStore();
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);
  const { data: exchangesData } = useExchangesFromContext();
  const { pairsByExchange } = useTradingPairsFromContext();
  const exchanges = useMemo(
    () => exchangesData?.data?.exchanges ?? [],
    [exchangesData?.data?.exchanges]
  );

  // The form panel uses three top-level tabs: a Hedge tab for shared
  // settings (TP / SL applied at the hedge level) and one tab per leg
  // (Long / Short) showing the leg's full BotFormWidget. The "Hedge"
  // tab is the default so users land on the unified controls first.
  type HedgeTab = 'hedge' | HedgeLeg;
  const [activeTab, setActiveTab] = useState<HedgeTab>('hedge');
  //const activeLeg: HedgeLeg = activeTab === 'short' ? 'short' : 'long';
  const [saving, setSaving] = useState(false);
  // Bumped after a successful edit-mode save. Threaded into each leg's
  // widgetId so React fully remounts the leg's BotFormWidget — the new
  // mount picks up the freshly-mapped initial form data from the
  // refetched hedge bot, replacing whatever the user had typed with the
  // server's confirmed state. Without the remount, the leg's existing
  // BotFormProvider keeps its (now stale) `isDirty` flag and
  // `useBotFormInitialization` skips re-mapping.
  const [postSaveSeq, setPostSaveSeq] = useState(0);

  // Hedge backtest is local-only (no SSB hedge variant). We open the
  // settings dialog from the footer's onBacktest hook, run via the
  // hedge runner hook, and render the result inside the Insights →
  // Backtests panel where the placeholder used to live.
  const [backtestDialogOpen, setBacktestDialogOpen] = useState(false);
  // Snapshot captured at the moment the dialog opens — gives the
  // dialog a stable `formData` (used for fee defaults) and survives
  // even if the user navigates between tabs while the dialog is up.
  const [dialogSnapshot, setDialogSnapshot] =
    useState<HedgeBacktestSnapshot | null>(null);

  // History-row selection lives here so it can drive both the
  // active-backtest tab's visibility and an auto-switch from the
  // Backtests list to the Active tab when the user clicks a row.
  const [selectedBacktestMeta, setSelectedBacktestMeta] =
    useState<HedgeBacktestHistoryItem | null>(null);
  const [activatingBacktest, setActivatingBacktest] = useState(false);
  const [insightsTab, setInsightsTab] = useState<string>('backtests');

  // Refs each leg's BotFormWidget keeps synced with its current formData.
  // Read at save time only — no re-render storm from per-keystroke changes.
  const longFormDataRef = useRef<BotFormData | null>(null);
  const shortFormDataRef = useRef<BotFormData | null>(null);

  // Re-mount seed per leg. We can't keep both legs mounted at once because
  // exampleOrdersStore (the example/estimated-orders pipeline) is a single
  // global store both legs would race over. Instead we mount only the
  // active leg and persist the inactive leg's edits via these refs: when
  // the user switches tabs, we snapshot the outgoing leg's current
  // formData here, and the next time it mounts we feed this snapshot in
  // as `initialFormData`. Refs (not state) so updating them doesn't
  // trigger a re-render.
  const longSeedRef = useRef<Partial<BotFormData> | undefined>(
    longInitialFormData
  );
  const shortSeedRef = useRef<Partial<BotFormData> | undefined>(
    shortInitialFormData
  );
  // Keep seed refs in sync with the loader as it produces new initial
  // form data — important on first edit-mode load where the hedge fetch
  // resolves AFTER the initial render of this layout.
  useEffect(() => {
    if (longInitialFormData) longSeedRef.current = longInitialFormData;
  }, [longInitialFormData]);
  useEffect(() => {
    if (shortInitialFormData) shortSeedRef.current = shortInitialFormData;
  }, [shortInitialFormData]);

  const handleTabChange = useCallback(
    (next: HedgeTab) => {
      // Snapshot the outgoing leg's current formData so its edits aren't
      // lost when it unmounts. The publisher inside BotFormWidget keeps
      // these refs current up to this point.
      if (activeTab === 'long' && longFormDataRef.current) {
        longSeedRef.current = longFormDataRef.current;
      } else if (activeTab === 'short' && shortFormDataRef.current) {
        shortSeedRef.current = shortFormDataRef.current;
      }
      setActiveTab(next);
    },
    [activeTab]
  );

  // Quick/Manual mode for the hedge form. Quick shows preset tiles
  // that seed both legs + shared settings; Manual shows the 3-tab
  // layout. Bumping `quickSeedSeq` when a preset is applied forces
  // the leg widgets to remount with their new seeds.
  // Clone-from-template (`create` mode with a botId) defaults to Manual
  // — the user already has a full configuration to start from and
  // overwriting it with a Quick preset would defeat the purpose.
  const [hedgeMode, setHedgeMode] = useState<'quick' | 'manual'>(
    mode === 'create' && !botId ? 'quick' : 'manual'
  );
  const [selectedHedgePreset, setSelectedHedgePreset] = useState<string | null>(
    null
  );
  const [quickSeedSeq, setQuickSeedSeq] = useState(0);

  // Quick-mode per-leg formData refs. Each HedgeQuickLeg mounts a
  // BotFormProvider with its own state for exchange + pair; the ref
  // is its publisher, kept in sync on every formData change.
  const longQuickRef = useRef<BotFormData | null>(null);
  const shortQuickRef = useRef<BotFormData | null>(null);
  // Investment lives at the hedge level — same value flows into both
  // legs' baseOrderSize/orderSize at Manual switch or preset apply.
  const [quickInvestment, setQuickInvestment] = useState<string>('10');

  // Stable widget IDs so each leg's BotFormProvider keeps its own draft
  // state across tab toggles. Includes the hedge bot ID so different
  // hedge bots don't share drafts. quickSeedSeq is bumped when a Quick
  // preset is applied to force a fresh mount with the new seeds.
  const longWidgetId = `hedge-${botType}-${botId ?? 'new'}-long-${postSaveSeq}-${quickSeedSeq}`;
  const shortWidgetId = `hedge-${botType}-${botId ?? 'new'}-short-${postSaveSeq}-${quickSeedSeq}`;

  // BotFormProvider only consumes initialFormData on mount, so when we have
  // a botId (edit OR clone-from-template) we must defer mounting the leg
  // widgets until the hedge bot has loaded. A fresh create (no botId)
  // mounts immediately with catalog defaults.
  const seedReady =
    (mode === 'create' && !botId) ||
    (Boolean(longInitialFormData) && Boolean(shortInitialFormData));

  // Each leg's actual bot record from the loaded hedge bot — passed into
  // BotFormWidget as `initialBot` so the leg's `useBotFormInitialization`
  // can complete (otherwise it waits forever for a bot the standard
  // botId-based query can't fetch, since hedge legs aren't standalone).
  const longLegBot = useMemo(
    () => findLegBot(hedgeBot?.bots, StrategyEnum.long) ?? null,
    [hedgeBot?.bots]
  );
  const shortLegBot = useMemo(
    () => findLegBot(hedgeBot?.bots, StrategyEnum.short) ?? null,
    [hedgeBot?.bots]
  );

  const handleSave = useCallback(async () => {
    if (saving) return;

    if (!tokens?.accessToken) {
      toast.error('Not authenticated.');
      return;
    }

    // The mounted leg's ref is fresh; the unmounted leg's ref stops
    // updating, but the seed ref carries the last known formData from
    // the previous mount. With the new Hedge tab it's possible NEITHER
    // leg is mounted at save time, so always fall back to the seed.
    let longData: BotFormData | null =
      activeTab === 'long'
        ? longFormDataRef.current
        : (longFormDataRef.current ?? (longSeedRef.current as BotFormData));
    let shortData: BotFormData | null =
      activeTab === 'short'
        ? shortFormDataRef.current
        : (shortFormDataRef.current ?? (shortSeedRef.current as BotFormData));

    // Create-mode shortcut: in a fresh hedge the user only has to visit
    // one leg, configure it, and save. The untouched leg gets a copy of
    // the visited leg's formData — the create payload's `strategy` is
    // forced per leg below, so saving as long+short still produces two
    // independent backend bots that the user can customize separately
    // after the initial save.
    if (mode === 'create') {
      if (!longData && shortData) longData = shortData;
      if (!shortData && longData) shortData = longData;
    }

    if (!longData || !shortData) {
      toast.error('Both legs must finish loading before saving.');
      return;
    }

    setSaving(true);
    try {
      // mapFormDataToPayload's create-mode buildCreatePayload returns null
      // without an exchange, which leaves the create payload essentially
      // empty (only the strategy override survives) and the backend
      // rejects the mutation for missing required fields. Resolve each
      // leg's exchange from formData.exchangeUUID before mapping.
      const longExchange =
        exchanges.find((e) => e.uuid === longData.exchangeUUID) ?? null;
      const shortExchange =
        exchanges.find((e) => e.uuid === shortData.exchangeUUID) ?? null;
      const longMapping = mapFormDataToPayload(
        longData,
        { mode },
        null,
        longExchange
      );
      const shortMapping = mapFormDataToPayload(
        shortData,
        { mode },
        null,
        shortExchange
      );

      if (!longMapping.success || !shortMapping.success) {
        const errors = [
          ...(longMapping.errors ?? []).map((e) => `Long: ${e}`),
          ...(shortMapping.errors ?? []).map((e) => `Short: ${e}`),
        ];
        toast.error(
          errors.length
            ? `Validation failed:\n${errors.join('\n')}`
            : 'Validation failed.'
        );
        return;
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      const config = getGraphQLConfig(tokens, isLiveTrading);
      const client = new GraphQLClient(
        endpoint,
        config.token,
        config.paperContext
      );

      let mutation: { query: string; variables: unknown };
      let resultKey: string;

      if (mode === 'create') {
        // For create, each leg's payload becomes a CreateHedgeComboBotInput.
        // We force the leg's strategy onto the payload so backend accepts
        // the hedge pair regardless of what the form mapper inferred.
        // Both `createHedgeDCABot` and `createHedgeComboBot` validate each
        // leg as `createComboBotInput` server-side, which rejects DCA-only
        // fields like `importFrom`. The dca-mapper only strips it when
        // `formData.type === combo`; for hedge DCA legs (`type === dca`)
        // it survives and the mutation 400s. Strip it here regardless.
        const longPayload = {
          ...(longMapping.createPayload ?? {}),
          strategy: StrategyEnum.long,
        };
        const shortPayload = {
          ...(shortMapping.createPayload ?? {}),
          strategy: StrategyEnum.short,
        };
        delete (longPayload as Record<string, unknown>)['importFrom'];
        delete (shortPayload as Record<string, unknown>)['importFrom'];
        const input = {
          long: longPayload as Parameters<
            typeof botQueries.createHedgeDCABot
          >[0]['long'],
          short: shortPayload as Parameters<
            typeof botQueries.createHedgeDCABot
          >[0]['short'],
          sharedSettings,
        };

        if (botType === BotTypesEnum.hedgeCombo) {
          mutation = botQueries.createHedgeComboBot(input);
          resultKey = 'createHedgeComboBot';
        } else {
          mutation = botQueries.createHedgeDCABot(input);
          resultKey = 'createHedgeDCABot';
        }
      } else {
        // Edit: each leg gets its bot _id + the *delta* between the form's
        // mapped payload and the bot's loaded settings. The legacy hedge
        // save sends only changed fields per leg (see `compareSettings`
        // in dash/components/dcabot/.../hooks/utils.ts) — sending the full
        // payload makes the backend silently drop some updates (e.g. the
        // `name` field) and is also where all the
        // "Field X is not defined by type changeComboBotInput" errors
        // come from, since defaults from the form schema include fields
        // the change-input doesn't accept.
        const longBot = findLegBot(hedgeBot?.bots, StrategyEnum.long);
        const shortBot = findLegBot(hedgeBot?.bots, StrategyEnum.short);
        if (!longBot || !shortBot || !botId) {
          toast.error('Cannot save: hedge bot context is missing.');
          return;
        }

        const computeLegDelta = (
          newPayload: Record<string, unknown>,
          oldSettings: Record<string, unknown> | undefined | null
        ): Record<string, unknown> => {
          const old = (oldSettings ?? {}) as Record<string, unknown>;
          const delta: Record<string, unknown> = {};
          // Iterate keys present on the loaded bot's settings; for each,
          // include the new value if it differs. Always include indicators
          // / indicatorGroups / dcaCustom (legacy convention — array fields
          // the diff for which is unreliable, so the backend just expects
          // whichever the form has).
          //
          // `pair` is intentionally NOT in alwaysInclude: the underlying
          // changeDCABot / changeComboBot resolvers reject the whole
          // update with "Cannot change pair for non-multi pairs bot" when
          // pair rides a non-multi bot. Hedge legs are non-multi by
          // default and the hedge endpoint silently swallows the per-leg
          // failure (returns OK overall while no field actually persists).
          const alwaysInclude = new Set([
            'indicators',
            'indicatorGroups',
            'dcaCustom',
          ]);
          for (const key of Object.keys(old)) {
            if (!(key in newPayload)) continue;
            const next = newPayload[key];
            const prev = old[key];
            if (alwaysInclude.has(key)) {
              delta[key] = next;
              continue;
            }
            if (Array.isArray(next) || Array.isArray(prev)) {
              if (JSON.stringify(next) !== JSON.stringify(prev)) {
                delta[key] = next;
              }
              continue;
            }
            if (next !== prev) {
              delta[key] = next;
            }
          }
          // Always include `name` when the form has it set — the legacy
          // diff catches it via the same iteration but only if `name` is
          // a key on the loaded settings; certain bots have it at the
          // wrapper level instead, so include defensively.
          if (
            typeof newPayload['name'] === 'string' &&
            (newPayload['name'] as string).trim().length > 0 &&
            newPayload['name'] !== old['name']
          ) {
            delta['name'] = newPayload['name'];
          }
          return delta;
        };

        // Strip per-leg fields the underlying single-bot change resolver
        // rejects. The hedge endpoint delegates each leg to either
        // changeDCABot or changeComboBot internally, and crucially
        // *discards their return value* (it Promise.all's the leg calls
        // then returns getBot — see app/core/src/bot/index.ts
        // changeHedgeDcaBot / changeHedgeComboBot). So if the payload
        // includes a field that resolver rejects, the leg's settings
        // update is silently dropped while the hedge mutation returns OK.
        // This mirrors useFormHandlers' deletes for the standalone flows,
        // plus also strips `pair` when the leg's `useMulti` is false —
        // both core resolvers fail with "Cannot change pair for non-multi
        // pairs bot" when pair rides a non-multi bot, killing every
        // sibling change in the same payload (name, baseOrderSize,
        // ordersCount, …).
        const stripPerLeg = (
          payload: Record<string, unknown>,
          legSettings: Record<string, unknown> | undefined | null
        ): Record<string, unknown> => {
          const next = { ...payload };
          // Always-strip: form/import-only fields no change-input accepts.
          delete next['useMulti'];
          delete next['type'];
          delete next['useLimitPrice'];
          delete next['terminalDealType'];
          delete next['useExperimental'];
          delete next['importFrom'];
          // Strip pair on non-multi legs (default for hedge bots).
          if (!(legSettings && legSettings['useMulti'])) {
            delete next['pair'];
          }
          if (botType === BotTypesEnum.hedgeDca) {
            // Strip combo-only fields when the leg goes through
            // changeDCABot. Matches the dca branch of useFormHandlers.
            delete next['gridLevel'];
            delete next['baseStep'];
            delete next['baseGridLevels'];
            delete next['useActiveMinigrids'];
            delete next['comboActiveMinigrids'];
            delete next['feeOrder'];
            delete next['comboSlLimit'];
            delete next['comboTpLimit'];
          }
          return next;
        };

        const longSettingsRaw = longBot.settings as unknown as
          | Record<string, unknown>
          | undefined;
        const shortSettingsRaw = shortBot.settings as unknown as
          | Record<string, unknown>
          | undefined;

        const longDelta = stripPerLeg(
          computeLegDelta(longMapping.updatePayload ?? {}, longSettingsRaw),
          longSettingsRaw
        );
        const shortDelta = stripPerLeg(
          computeLegDelta(shortMapping.updatePayload ?? {}, shortSettingsRaw),
          shortSettingsRaw
        );

        const input = {
          id: botId,
          long: {
            id: longBot._id,
            ...longDelta,
          } as Parameters<typeof botQueries.changeHedgeDCABot>[0]['long'],
          short: {
            id: shortBot._id,
            ...shortDelta,
          } as Parameters<typeof botQueries.changeHedgeDCABot>[0]['short'],
          sharedSettings,
        };

        if (botType === BotTypesEnum.hedgeCombo) {
          mutation = botQueries.changeHedgeComboBot(input);
          resultKey = 'changeHedgeComboBot';
        } else {
          mutation = botQueries.changeHedgeDCABot(input);
          resultKey = 'changeHedgeDCABot';
        }
      }

      const response = await client.request<
        Record<string, { status: string; reason?: string; data?: HedgeBot }>
      >(mutation.query, mutation.variables);
      const payload = response[resultKey];
      if (!payload || payload.status !== 'OK') {
        throw new Error(payload?.reason || 'Mutation returned NOTOK');
      }

      toast.success(
        mode === 'create' ? 'Hedge bot created' : 'Hedge bot updated'
      );

      // After create, navigate to the new bot's edit page. After edit,
      // refetch the hedge bot so each leg's `initialBot` reference
      // updates and `useBotFormInitialization` re-maps the form to the
      // freshly persisted state — without this the form keeps showing
      // the user's typed values until a hard refresh, which masks
      // whether the backend actually applied each change.
      const newBotId = payload.data?._id;
      if (mode === 'create' && newBotId) {
        setCreatedBotId(newBotId);
        setShowCelebration(true);
      } else if (mode === 'edit') {
        // Refetch first so the mapped longInitialFormData /
        // shortInitialFormData reflect what the server now has, then
        // bump the post-save counter — the seedRef sync effects pick up
        // the fresh formData and the leg widgets remount keyed off the
        // new seq, replacing user-edited state with the persisted state.
        refetchHedgeBot();
        setPostSaveSeq((n) => n + 1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[HedgeBotEditLayout] Save failed', {
        error: message,
        mode,
        botType,
      });
      toast.error(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    tokens,
    isLiveTrading,
    mode,
    botType,
    botId,
    hedgeBot,
    sharedSettings,
    exchanges,
    refetchHedgeBot,
    activeTab,
  ]);

  const saveLabel = useMemo(() => {
    if (saving) return 'Saving…';
    return mode === 'edit' ? 'Save hedge bot' : 'Create hedge bot';
  }, [saving, mode]);

  // Hedge start/stop. The leg's BotFormFooter would otherwise call
  // changeStatus with the leg's id + dca/combo type, which only flips
  // the leg bot status — the hedge wrapper (and the live bots store)
  // never sees the change. This handler dispatches changeStatus with the
  // hedge id + hedgeDca/hedgeCombo type, optimistically updates the
  // matching live bots store (so the badge / list reflect immediately),
  // and refetches the hedge bot so the form rebinds to the new status.
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [createdBotId, setCreatedBotId] = useState<string | undefined>();

  const buildHedgeEditPath = useCallback(
    (id: string) =>
      botType === BotTypesEnum.hedgeCombo
        ? `/hedge/combo/edit/${id}`
        : `/hedge/bot/edit/${id}`,
    [botType]
  );

  const handleHedgeCelebrationStartBot = useCallback(() => {
    if (!createdBotId) return;
    const idToStart = createdBotId;
    // Fire-and-forget: navigate immediately, let the start mutation
    // resolve in the background. Matches the DCA/Combo/Grid pattern in
    // BotForm/index.tsx → handleCelebrationStartBot.
    (async () => {
      if (!tokens?.accessToken) {
        toast.error('Not authenticated.');
        return;
      }
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
          id: idToStart,
          status: 'open',
          type: botType,
        });
        const response = await client.request<{
          changeStatus: { status: string; reason?: string };
        }>(query, variables);
        if (response.changeStatus.status !== 'OK') {
          throw new Error(
            response.changeStatus.reason || 'Failed to start hedge bot'
          );
        }
        toast.success('Hedge bot started');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('[HedgeBotEditLayout] Post-create start failed', {
          error: message,
        });
        toast.error(`Failed to start hedge bot: ${message}`);
      }
    })();
    navigate(buildHedgeEditPath(idToStart));
  }, [
    createdBotId,
    botType,
    tokens,
    isLiveTrading,
    navigate,
    buildHedgeEditPath,
  ]);

  const handleHedgeCelebrationClose = useCallback(() => {
    setShowCelebration(false);
    if (createdBotId) {
      navigate(buildHedgeEditPath(createdBotId));
    }
  }, [createdBotId, navigate, buildHedgeEditPath]);
  const handleHedgeToggleStatus = useCallback(
    async (payload: { nextStatus: string; closeType?: string }) => {
      const nextStatus =
        payload.nextStatus === 'open' ? ('open' as const) : ('closed' as const);
      if (togglingStatus) return;
      if (!tokens?.accessToken) {
        toast.error('Not authenticated.');
        return;
      }
      if (!botId || !hedgeBot) {
        toast.error('Hedge bot context is missing.');
        return;
      }

      setTogglingStatus(true);

      // Optimistic store update so the toggle button + any list views
      // reflect the requested status immediately.
      const store =
        botType === BotTypesEnum.hedgeCombo
          ? useHedgeComboBotsStore.getState()
          : useHedgeDcaBotsStore.getState();
      const previousStatus = hedgeBot.status;
      store.updateBot({ ...hedgeBot, status: nextStatus });

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
          id: botId,
          status: nextStatus,
          type: botType,
          ...(payload.closeType
            ? { closeType: payload.closeType as never }
            : {}),
        });
        const response = await client.request<{
          changeStatus: {
            status: string;
            reason?: string;
            data?: { _id: string };
          };
        }>(query, variables);
        if (response.changeStatus.status !== 'OK') {
          throw new Error(
            response.changeStatus.reason || 'Failed to change hedge status'
          );
        }
        toast.success(
          nextStatus === 'open' ? 'Hedge bot started' : 'Hedge bot stopped'
        );
        // Intentionally NOT refetching here. The hedge bot's GraphQL
        // endpoint can race the backend's status propagation — a refetch
        // fired right after `changeStatus` succeeds occasionally returns
        // the pre-toggle status, which then overwrites our optimistic
        // update via the provider's "push query data into store"
        // useEffect. WebSocket events for the hedge wrapper / its legs
        // sync the rest of the bot state, and the optimistic status set
        // above is what we trust until those land.
      } catch (error) {
        // Roll back the optimistic update on failure.
        store.updateBot({ ...hedgeBot, status: previousStatus });
        const message = error instanceof Error ? error.message : String(error);
        logger.error('[HedgeBotEditLayout] Toggle status failed', {
          error: message,
        });
        toast.error(`Failed to update hedge status: ${message}`);
      } finally {
        setTogglingStatus(false);
      }
    },
    [togglingStatus, tokens, botId, hedgeBot, botType, isLiveTrading]
  );

  // The unified footer is the regular BotFormFooter rendered by each leg's
  // BotFormShell; we override its onSubmit/label/disabled state via
  // footerOverride so clicking Save / Backtest on either leg goes to the
  // hedge handlers. Both legs get the same override, so the footer follows
  // the active leg. Templates are hidden (hedge templates not supported)
  // and credits are doubled — the leg footer counts one bot's cost; a
  // hedge runs two of those bots.
  // Hedge stop affects both legs simultaneously, so the deal count the
  // footer's stop-confirmation dialog gates on is the sum across legs.
  // Without this override the footer reads only the active leg's
  // dealsInBot.active and would skip the dialog when the *other* leg
  // is the one with active deals.
  const totalActiveDeals = useMemo(() => {
    const longActive =
      findLegBot(hedgeBot?.bots, StrategyEnum.long)?.dealsInBot?.active ?? 0;
    const shortActive =
      findLegBot(hedgeBot?.bots, StrategyEnum.short)?.dealsInBot?.active ?? 0;
    return longActive + shortActive;
  }, [hedgeBot?.bots]);

  // Lazy snapshot builder for the backtest runner. Reads whichever leg
  // refs hold the latest formData — Quick mode writes to `*QuickRef`,
  // Manual mode writes to `*FormDataRef`, and the inactive Manual leg
  // falls back to its `*SeedRef`. Called at click/run time so the
  // result picks up the user's most recent edits without needing the
  // parent to re-render on every keystroke (refs don't trigger one).
  const getBacktestSnapshot = useCallback((): HedgeBacktestSnapshot | null => {
    const longData =
      longQuickRef.current ??
      longFormDataRef.current ??
      (longSeedRef.current as BotFormData | null);
    const shortData =
      shortQuickRef.current ??
      shortFormDataRef.current ??
      (shortSeedRef.current as BotFormData | null);
    if (!longData || !shortData) return null;
    const longExchange = exchanges.find(
      (e) => e.uuid === longData.exchangeUUID
    );
    const shortExchange = exchanges.find(
      (e) => e.uuid === shortData.exchangeUUID
    );
    if (!longExchange || !shortExchange) return null;

    // Enrich each leg's `pairMetadata` from the global trading-pairs
    // context. The leg's own pairMetadata gets populated as the user
    // interacts with BasicSettings; if the form mounted with a default
    // pair (e.g. BTCUSDT) and the user hasn't touched it,
    // pairMetadata is empty and `mapFormDataToPayload` fails with
    // "Unable to resolve quote/base asset". Fill any gaps here so
    // the mapper has what it needs in every state.
    const enrich = (
      data: BotFormData,
      exchange: typeof longExchange
    ): BotFormData => {
      const pairs = Array.isArray(data.pair) ? data.pair : [];
      const exchangePairs = pairsByExchange?.[exchange.provider] ?? [];
      const enrichedMeta = { ...(data.pairMetadata ?? {}) };
      for (const pair of pairs) {
        if (enrichedMeta[pair]) continue;
        const match = exchangePairs.find((p) => p.pair === pair);
        if (match) {
          enrichedMeta[pair] = match as BotFormData['pairMetadata'][string];
        }
      }
      return { ...data, pairMetadata: enrichedMeta };
    };

    return {
      longFormData: enrich(longData, longExchange),
      longExchange,
      shortFormData: enrich(shortData, shortExchange),
      shortExchange,
      sharedSettings,
      hedgeBotType: botType,
    };
  }, [exchanges, sharedSettings, botType, pairsByExchange]);

  const backtestRunner = useHedgeBacktestRunner({
    getSnapshot: getBacktestSnapshot,
    hedgeBotType: botType,
  });

  // Click on a history row: pull the full payload from IndexedDB, then
  // switch the insights tab to the Active view so the user lands on the
  // backtest they just opened.
  const handleSelectBacktest = useCallback(
    async (item: HedgeBacktestHistoryItem) => {
      setSelectedBacktestMeta(item);
      setActivatingBacktest(true);
      try {
        await backtestRunner.loadById(item._id);
      } finally {
        setActivatingBacktest(false);
      }
      setInsightsTab('active-backtest');
    },
    [backtestRunner]
  );

  // After a fresh run finishes, surface the result automatically by
  // switching to the Active tab — same UX as DCA where the just-run
  // backtest jumps into focus.
  useEffect(() => {
    if (backtestRunner.result && backtestRunner.resultId) {
      setInsightsTab('active-backtest');
    }
  }, [backtestRunner.result, backtestRunner.resultId]);

  const footerOverride = useMemo(
    () => ({
      onSubmit: handleSave,
      submitLabel: saveLabel,
      submitDisabled: saving || !seedReady,
      submitIsPending: saving,
      backtestPending: backtestRunner.running,
      // Live progress for the footer's inline progress bar — matches
      // the DCA/Combo UX where the big Backtest button renders an
      // inline progress bar instead of opening the dialog.
      backtestProgress: backtestRunner.progress,
      onCancelBacktest: backtestRunner.cancel,
      // "More backtest settings" 3-dot menu → opens the dialog
      // (progress is shown inside the dialog when running).
      onBacktest: () => {
        const snap = getBacktestSnapshot();
        if (!snap) {
          toast.error('Pick a pair on both legs before backtesting.');
          return;
        }
        setDialogSnapshot(snap);
        setBacktestDialogOpen(true);
      },
      // Big Backtest button → run directly with the footer's period
      // + timeframe (no dialog). Mirrors DCA's `onRunBacktestDirect`.
      onRunBacktestDirect: async (cfg: BacktestConfig) => {
        const snap = getBacktestSnapshot();
        if (!snap) {
          toast.error('Pick a pair on both legs before backtesting.');
          return;
        }
        // Don't open the dialog — runner's progress flows through
        // the footer instead. Dialog state stays untouched.
        const from = cfg.startDate
          ? new Date(cfg.startDate).getTime()
          : undefined;
        const to = cfg.endDate ? new Date(cfg.endDate).getTime() : undefined;
        await backtestRunner.run({
          timeframe: cfg.timeframe,
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
          slippagePercent: cfg.slippagePercent ?? 0,
          userFee: cfg.userFee ?? 0,
          RFR: cfg.RFR ?? '2',
          MAR: cfg.MAR ?? '7',
        });
      },
      showCredits: mode === 'create',
      hideTemplates: true,
      creditsMultiplier: 2,
      onToggleStatus: handleHedgeToggleStatus,
      toggleDisabled: togglingStatus || !botId || mode !== 'edit',
      togglePending: togglingStatus,
      botStatus: hedgeBot?.status ?? null,
      activeDeals: totalActiveDeals,
    }),
    [
      handleSave,
      saveLabel,
      saving,
      seedReady,
      mode,
      handleHedgeToggleStatus,
      togglingStatus,
      botId,
      hedgeBot?.status,
      totalActiveDeals,
      backtestRunner,
      getBacktestSnapshot,
    ]
  );

  // Compose the form-side content as a three-tab layout: Hedge (shared
  // settings), Long leg, Short leg. The leg tabs each mount a full
  // BotFormWidget; the Hedge tab is a compact controls card. Only the
  // active leg ever mounts because exampleOrdersStore (and a few other
  // BotFormProvider side-effect stores) are singletons — mounting
  // both at once makes them fight. Inactive-leg edits survive tab
  // switches via the seedRefs snapshot in handleTabChange.
  const hedgeSharedContent = (
    <div className="space-y-md">
      <SettingsRow
        name="Take Profit (hedge)"
        tooltip="Each leg has its own TP/SL unless this is activated. When on, the hedge controller closes both legs together when this percentage is reached."
        navId="hedge-tp"
        trailing={
          <Switch
            checked={sharedSettings.useTp}
            onCheckedChange={(checked) => updateSharedSetting('useTp', checked)}
          />
        }
      >
        {sharedSettings.useTp && (
          <Input
            type="number"
            step="0.01"
            value={sharedSettings.tpPerc}
            onChange={(e) => updateSharedSetting('tpPerc', e.target.value)}
            endAdornment="%"
          />
        )}
      </SettingsRow>

      <SettingsRow
        name="Stop Loss (hedge)"
        tooltip="Each leg has its own TP/SL unless this is activated. When on, the hedge controller closes both legs together when this loss percentage is reached."
        navId="hedge-sl"
        trailing={
          <Switch
            checked={sharedSettings.useSl}
            onCheckedChange={(checked) => updateSharedSetting('useSl', checked)}
          />
        }
      >
        {sharedSettings.useSl && (
          <Input
            type="number"
            step="0.01"
            value={sharedSettings.slPerc}
            onChange={(e) => updateSharedSetting('slPerc', e.target.value)}
            endAdornment="%"
          />
        )}
      </SettingsRow>
    </div>
  );

  // Fold Quick-mode leg refs (exchange / pair / investment, captured
  // live by HedgeQuickLeg's publisher) into the leg seed refs so the
  // Manual-mode BotFormWidgets mount pre-configured. If `preset` is
  // given, its dca values overlay on top of the leg's current dca
  // (preserving the user's exchange/pair selection).
  const writeSeeds = useCallback(
    (preset: HedgeQuickPreset | null) => {
      const presetDca = preset ? getHedgeLegDcaState(preset) : null;
      const longLive = longQuickRef.current;
      const shortLive = shortQuickRef.current;
      const investment = quickInvestment || '10';

      if (longLive || presetDca) {
        const existing = longSeedRef.current ?? {};
        const baseDca =
          (longLive?.dca as BotFormData['dca']) ??
          ((existing as Partial<BotFormData>).dca as BotFormData['dca']) ??
          ({} as BotFormData['dca']);
        longSeedRef.current = {
          ...existing,
          ...(longLive
            ? {
                exchangeUUID: longLive.exchangeUUID,
                pair: longLive.pair,
              }
            : {}),
          dca: {
            ...baseDca,
            ...(presetDca ?? {}),
            strategy: StrategyEnum.long,
            baseOrderSize: investment,
            orderSize: investment,
          },
        } as Partial<BotFormData>;
      }
      if (shortLive || presetDca) {
        const existing = shortSeedRef.current ?? {};
        const baseDca =
          (shortLive?.dca as BotFormData['dca']) ??
          ((existing as Partial<BotFormData>).dca as BotFormData['dca']) ??
          ({} as BotFormData['dca']);
        shortSeedRef.current = {
          ...existing,
          ...(shortLive
            ? {
                exchangeUUID: shortLive.exchangeUUID,
                pair: shortLive.pair,
              }
            : {}),
          dca: {
            ...baseDca,
            ...(presetDca ?? {}),
            strategy: StrategyEnum.short,
            baseOrderSize: investment,
            orderSize: investment,
          },
        } as Partial<BotFormData>;
      }
      setQuickSeedSeq((n) => n + 1);
    },
    [quickInvestment]
  );

  // Apply a Quick-mode preset: writes both leg seeds and mirrors the
  // preset's shared TP/SL into sharedSettings.
  const applyHedgePreset = useCallback(
    (preset: HedgeQuickPreset) => {
      writeSeeds(preset);
      Object.entries(preset.shared).forEach(([key, value]) => {
        updateSharedSetting(key as keyof typeof preset.shared, value as never);
      });
      setSelectedHedgePreset(preset.id);
    },
    [writeSeeds, updateSharedSetting]
  );

  // Wrap onSubmit so any Quick-mode edits (per-leg exchange/pair from
  // the live refs, investment from local state) are folded into the
  // seed refs before handleSave reads them.
  const quickFooterOverride = useMemo(
    () => ({
      ...footerOverride,
      onSubmit: () => {
        writeSeeds(null);
        return handleSave();
      },
    }),
    [footerOverride, writeSeeds, handleSave]
  );

  const hedgeQuickContent = (
    <div className="flex h-full min-h-0 flex-col">
      <HedgeQuickLeg
        legId="long"
        widgetId={`hedge-quick-long-${quickSeedSeq}`}
        {...(longSeedRef.current
          ? { initialFormData: longSeedRef.current }
          : {})}
        formDataRef={longQuickRef}
        footerSlot={<HedgeQuickFooter footerOverride={quickFooterOverride} />}
      >
        <HedgeQuickLeg
          legId="short"
          widgetId={`hedge-quick-short-${quickSeedSeq}`}
          {...(shortSeedRef.current
            ? { initialFormData: shortSeedRef.current }
            : {})}
          formDataRef={shortQuickRef}
        />

        <SettingsRow
          name="Investment"
          tooltip="Quote-asset amount each leg deploys. Applied to both legs."
          navId="hedge-investment"
        >
          <div className="space-y-xs">
            <Input
              id="hedge-investment"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={quickInvestment}
              onChange={(e) => setQuickInvestment(e.target.value)}
              placeholder="0.00"
            />
            <Slider
              value={Math.max(0, Number(quickInvestment) || 0)}
              min={0}
              max={Math.max(100, Number(quickInvestment) || 0)}
              step={1}
              onChange={(v) => setQuickInvestment(String(v))}
              aria-label="Investment amount"
            />
          </div>
        </SettingsRow>

        <div className="rounded-lg bg-muted/40 p-md space-y-sm">
          <div>
            <h3 className="text-sm font-semibold">Risk profile</h3>
            <p className="text-xs text-muted-foreground">
              Pick a starting point. Configures both legs identically. Switch to
              Manual to fine-tune each leg.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Hedge risk profile"
            className="grid grid-cols-3 gap-xs"
          >
            {HEDGE_QUICK_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedHedgePreset;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => applyHedgePreset(preset)}
                  className={`flex flex-col items-start gap-1 rounded-md px-sm py-sm text-left transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  <span className="text-sm font-semibold">{preset.label}</span>
                  <span
                    // eslint-disable-next-line spacing/no-hardcoded-font-size
                    className={`text-[11px] leading-tight ${
                      isSelected
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {preset.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </HedgeQuickLeg>
    </div>
  );

  const formContent = (
    <div className="flex h-full flex-col p-1">
      {/* Floating header matches the DCA bot form header style. */}
      <div className="mb-3 mx-1 rounded-lg bg-background/95 px-2 py-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 min-w-0 items-center gap-1 px-1">
            <h2 className="text-sm font-semibold">
              {hedgeMode === 'quick' ? 'Quick Setup' : 'Hedge bot'}
            </h2>
          </div>
          <QuickModeToggle
            value={hedgeMode}
            onChange={(next) => {
              // When leaving Quick mode, fold any local edits (exchange,
              // pair, investment) into the seed refs so the legs mount
              // pre-configured in Manual.
              if (hedgeMode === 'quick' && next === 'manual') {
                writeSeeds(null);
              }
              setHedgeMode(next);
            }}
          />
        </div>
      </div>

      {hedgeMode === 'quick' ? (
        <div className="flex min-h-0 flex-1 flex-col">{hedgeQuickContent}</div>
      ) : (
        <>
          <Tabs
            value={activeTab}
            onValueChange={(v) => handleTabChange(v as HedgeTab)}
          >
            <TabsList>
              <TabsTrigger value="hedge">Hedge</TabsTrigger>
              <TabsTrigger value="long">Long leg</TabsTrigger>
              <TabsTrigger value="short">Short leg</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex min-h-0 flex-1 flex-col">
            {activeTab === 'hedge' ? (
              hedgeSharedContent
            ) : !seedReady ? (
              <div className="px-md py-lg text-sm text-muted-foreground">
                {loadError
                  ? `Failed to load hedge bot: ${loadError.message}`
                  : isLoadingHedgeBot
                    ? 'Loading hedge bot…'
                    : 'Preparing form…'}
              </div>
            ) : activeTab === 'long' ? (
              <BotFormWidget
                key={longWidgetId}
                widgetId={longWidgetId}
                botType={legBotType}
                mode={mode}
                terminal={false}
                variant="panel"
                formDataRef={longFormDataRef}
                forceSubmitDisabled
                isNestedLeg
                footerOverride={footerOverride}
                initialBot={longLegBot}
                innerSlot={<HedgeLegActiveChartPublisher leg="long" />}
                {...(longSeedRef.current
                  ? { initialFormData: longSeedRef.current }
                  : {})}
              />
            ) : (
              <BotFormWidget
                key={shortWidgetId}
                widgetId={shortWidgetId}
                botType={legBotType}
                mode={mode}
                terminal={false}
                variant="panel"
                formDataRef={shortFormDataRef}
                forceSubmitDisabled
                isNestedLeg
                footerOverride={footerOverride}
                initialBot={shortLegBot}
                innerSlot={<HedgeLegActiveChartPublisher leg="short" />}
                {...(shortSeedRef.current
                  ? { initialFormData: shortSeedRef.current }
                  : {})}
              />
            )}
          </div>
        </>
      )}
    </div>
  );

  const formPanel: PanelContentConfig = {
    content: formContent,
    contentClassName: 'flex h-full flex-col',
    containerClassName: 'min-h-[360px]',
  };

  const chartPanel: PanelContentConfig = {
    content: <HedgeChartPanel />,
    contentClassName: 'flex h-full flex-col',
    containerClassName: 'min-h-[360px]',
  };

  // Insights panel — mirrors DCA's pattern: a stable "Backtests" table
  // tab (always clickable, with a count badge) plus an "Active backtest"
  // tab that materialises whenever a row is selected or a run has just
  // finished. Local-only (no SSB hedge variant); see
  // `useHedgeBacktestRunner`.
  const activeMeta = selectedBacktestMeta ?? backtestRunner.lastRunMeta;
  const hasActiveBacktest = !!(
    activeMeta ||
    (backtestRunner.result && backtestRunner.resultId)
  );

  const insightsTabs: BotPanelInsightsTab[] = [
    {
      key: 'backtests',
      title: 'Backtests',
      badge: backtestRunner.historyLoading ? (
        <Badge variant="secondary">…</Badge>
      ) : (
        <Badge variant="default">{backtestRunner.history.length}</Badge>
      ),
      content: (
        <HedgeBacktestListView
          runner={backtestRunner}
          onSelect={handleSelectBacktest}
          activating={activatingBacktest}
        />
      ),
    },
  ];
  if (hasActiveBacktest) {
    insightsTabs.push({
      key: 'active-backtest',
      title: 'Active backtest',
      content: (
        <HedgeBacktestActiveView
          result={backtestRunner.result}
          meta={activeMeta}
        />
      ),
    });
  }

  const insightsContent = (
    <BotPanelInsights
      tabs={insightsTabs}
      value={hasActiveBacktest ? insightsTab : 'backtests'}
      onTabChange={setInsightsTab}
    />
  );

  return (
    <div className="flex flex-col gap-md">
      <BotPanelLayout
        chart={chartPanel}
        form={formPanel}
        insights={insightsContent}
        className="flex-1"
        botType="dca"
        mobileFullscreen
        scrollable
      />

      {/* Hedge backtest settings — local-only mode (no SSB variant). */}
      {dialogSnapshot && (
        <BacktestSettingsDialog
          open={backtestDialogOpen}
          onClose={() => setBacktestDialogOpen(false)}
          formData={dialogSnapshot.longFormData}
          forceLocalMode
          backtestProgress={backtestRunner.progress}
          onCancelLocal={backtestRunner.cancel}
          initialData={{
            mode: 'local',
            timeframe: ExchangeIntervals.oneH,
          }}
          onRun={async (cfg) => {
            // Keep the dialog open — its built-in progress UI
            // (BacktestSettingsDialog renders an inline progress bar
            // + Cancel button when `backtestProgress` is non-null)
            // gives the user feedback right where they started the
            // run. Same UX as DCA's settings dialog. Closing here
            // would punt them back to the tab and they'd see the
            // progress only in the footer, which the user reported
            // as inconsistent. The dialog also auto-closes after a
            // successful run via the runner's resolution.
            await backtestRunner.run({
              timeframe: cfg.timeframe,
              from: cfg.startDate
                ? new Date(cfg.startDate).getTime()
                : undefined,
              to: cfg.endDate ? new Date(cfg.endDate).getTime() : undefined,
              slippagePercent: cfg.slippagePercent,
              userFee: cfg.userFee,
              RFR: cfg.RFR,
              MAR: cfg.MAR,
              ...(cfg.periodId && !['auto', 'custom'].includes(cfg.periodId)
                ? { periodName: cfg.periodId }
                : {}),
            });
            setBacktestDialogOpen(false);
          }}
        />
      )}

      <Celebration
        open={showCelebration}
        onClose={handleHedgeCelebrationClose}
        title="🎉 Hedge bot created successfully!"
        description="Your new hedge bot is ready to go. You can start it now or make additional adjustments first."
        primaryAction={{
          label: 'Start bot',
          onClick: handleHedgeCelebrationStartBot,
        }}
        secondaryAction={{
          label: 'Close',
          variant: 'outline',
        }}
      />
    </div>
  );
};

export default HedgeBotEditLayout;
