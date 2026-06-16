/**
 * HedgeQuickLeg — minimal Quick-mode editor for ONE hedge leg.
 *
 * Mounts its own BotFormProvider + BotFormQueryProvider (with
 * `isNestedLeg` so it's not treated as a standalone DCA bot) and
 * renders the same BasicSettings (exchange + pair) the
 * regular DCA Quick form uses. Investment is configured once at the
 * hedge level and folded into both legs' seeds on Manual switch /
 * preset apply. The leg's current formData is published up to the
 * hedge layout via the provided `formDataRef`.
 */
import { useEffect, type MutableRefObject, type ReactNode } from 'react';

import {
  BotFormProvider,
  useBotFormSelector,
  useBotFormState,
  type BotFormMode,
  type BotFormUpdateValue,
  type Fields,
} from '@/contexts/bots/form/BotFormProvider';
import { useHedgeBotFormOptional } from '@/contexts/bots/form/HedgeBotFormProvider';
import { useExchangesFromContext } from '@/contexts/ExchangeDataContext';
import { BasicSettings } from '@/features/bots/bot-types/dca/form/sections/BasicSettings';
import { tryGetBotExperience } from '@/features/bots/catalog/BotExperienceCatalog';
import {
  BotFormFooter,
  type BotFormFooterProps,
} from '@/features/bots/widgets/BotForm/components/BotFormFooter';
import { BotFormRegistryContext } from '@/features/bots/widgets/BotForm/context';
import {
  BotFormQueryProvider,
  useBotFormQuery,
} from '@/features/bots/widgets/BotForm/providers/BotFormQueryProvider';
import { BotTypesEnum, StrategyEnum } from '@/types';
import type { BotFormData } from '@/types/bots/form';

const LegPublisher: React.FC<{
  targetRef: MutableRefObject<BotFormData | null>;
}> = ({ targetRef }) => {
  const { formData } = useBotFormState();
  useEffect(() => {
    targetRef.current = formData;
  }, [formData, targetRef]);
  return null;
};

const LegStrategyPinner: React.FC<{ strategy: StrategyEnum }> = ({
  strategy,
}) => {
  const { updateFormData } = useBotFormState();
  const current = useBotFormSelector('strategy');
  useEffect(() => {
    if (current !== strategy) {
      updateFormData('strategy' as Fields, strategy);
    }
  }, [current, strategy, updateFormData]);
  return null;
};

/**
 * Publishes this leg's pair + exchange up to the hedge context so the
 * chart panel renders the right market in Quick mode (Manual mode has
 * its own publisher in HedgeBotEditLayout). Also registers a chart
 * symbol writer so picks from the TradingView widget land on this
 * leg's formData. Only the long leg mounts this in Quick mode — both
 * legs are visible at once, so we pick one to drive the chart.
 */
const QuickLegChartPublisher: React.FC = () => {
  const hedge = useHedgeBotFormOptional();
  const { formData, updateFormData } = useBotFormState();

  const firstPair = Array.isArray(formData.pair)
    ? (formData.pair[0] ?? null)
    : (formData.pair ?? null);

  useEffect(() => {
    hedge?.setActiveLegPair(firstPair || null);
  }, [firstPair, hedge]);

  useEffect(() => {
    hedge?.setActiveLegExchangeUUID(formData.exchangeUUID ?? null);
  }, [formData.exchangeUUID, hedge]);

  useEffect(() => {
    if (!hedge) return;
    // eslint-disable-next-line react-hooks/immutability
    hedge.chartSymbolWriterRef.current = (newPair: string) => {
      updateFormData('pair' as never, [newPair] as never);
    };
    return () => {
      hedge.chartSymbolWriterRef.current = null;
    };
  }, [hedge, updateFormData]);

  return null;
};

/**
 * Renders BotFormFooter inside the leg's BotFormProvider tree. Reads
 * formData and currentExchange from the leg's context so the footer's
 * credits + UI work like the standalone DCA bot footer. The hedge
 * layout supplies the actual onSubmit/saveLabel/backtest handlers via
 * `footerOverride`.
 */
export const HedgeQuickFooter: React.FC<{
  footerOverride: Partial<BotFormFooterProps> & { activeDeals?: number };
  /** Force the footer's create/edit mode (the shared-settings tab mounts a
   *  throwaway create provider but still needs the edit footer in edit mode:
   *  Save + start/stop instead of Create). Falls back to the provider mode. */
  modeOverride?: BotFormMode;
}> = ({ footerOverride, modeOverride }) => {
  const { formData, errors, mode } = useBotFormState();
  const { currentExchange } = useBotFormQuery();
  return (
    <BotFormFooter
      mode={modeOverride ?? mode}
      errors={errors}
      formData={formData}
      botType={BotTypesEnum.dca}
      currentExchange={currentExchange}
      submitLabel={footerOverride.submitLabel ?? 'Save'}
      submitDisabled={!!footerOverride.submitDisabled}
      submitIsPending={!!footerOverride.submitIsPending}
      onSubmit={footerOverride.onSubmit ?? (() => {})}
      {...(footerOverride.onBacktest
        ? { onBacktest: footerOverride.onBacktest }
        : {})}
      {...(footerOverride.onRunBacktestDirect
        ? { onRunBacktestDirect: footerOverride.onRunBacktestDirect }
        : {})}
      backtestPending={!!footerOverride.backtestPending}
      {...(footerOverride.backtestProgress !== undefined
        ? { backtestProgress: footerOverride.backtestProgress }
        : {})}
      {...(footerOverride.onCancelBacktest
        ? { onCancelBacktest: footerOverride.onCancelBacktest }
        : {})}
      hideTemplates={footerOverride.hideTemplates ?? true}
      showCredits={!!footerOverride.showCredits}
      creditsMultiplier={footerOverride.creditsMultiplier ?? 2}
      {...(footerOverride.menuConfig !== undefined
        ? { menuConfig: footerOverride.menuConfig }
        : {})}
      {...(footerOverride.onToggleStatus
        ? { onToggleStatus: footerOverride.onToggleStatus }
        : {})}
      {...(footerOverride.botStatus !== undefined
        ? { botStatus: footerOverride.botStatus }
        : {})}
      {...(footerOverride.toggleDisabled !== undefined
        ? { toggleDisabled: footerOverride.toggleDisabled }
        : {})}
      {...(footerOverride.togglePending !== undefined
        ? { togglePending: footerOverride.togglePending }
        : {})}
      {...(footerOverride.activeDeals !== undefined
        ? { activeDealsOverride: footerOverride.activeDeals }
        : {})}
    />
  );
};

/**
 * Mounts the BotFormProvider stack so a non-leg surface (the hedge tab with
 * the shared TP/SL settings) can render the same BACKTEST + Create/Save
 * footer the leg tabs have. The provider is a throwaway DCA context seeded
 * with the long leg so the footer's credits + exchange read sensibly; the
 * actual Save/Backtest/Start behaviour comes from `footerOverride` (the
 * hedge handlers). `children` is the tab body, rendered above the footer.
 */
export const HedgeFooterShell: React.FC<{
  widgetId: string;
  mode: BotFormMode;
  footerOverride: Partial<BotFormFooterProps> & { activeDeals?: number };
  initialFormData?: Partial<BotFormData> | undefined;
  children: ReactNode;
}> = ({ widgetId, mode, footerOverride, initialFormData, children }) => {
  const experience = tryGetBotExperience(BotTypesEnum.dca);
  if (!experience) return null;

  return (
    <BotFormRegistryContext.Provider
      value={{ botExperience: experience, widgetId }}
    >
      <BotFormProvider
        mode="create"
        botType={BotTypesEnum.dca}
        isNestedLeg
        {...(initialFormData ? { initialFormData } : {})}
      >
        <BotFormQueryProvider mode="create">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-md">
              {children}
            </div>
            <div className="shrink-0 pt-2">
              <HedgeQuickFooter
                footerOverride={footerOverride}
                modeOverride={mode}
              />
            </div>
          </div>
        </BotFormQueryProvider>
      </BotFormProvider>
    </BotFormRegistryContext.Provider>
  );
};

const LegFields: React.FC<{ legId: 'long' | 'short' }> = ({ legId }) => {
  const { formData, updateFormData, isFieldLocked, mode, errors } =
    useBotFormState();
  const { currentExchange } = useBotFormQuery();
  // BotFormQueryProvider only resolves `currentExchange` from formData;
  // the dropdown's full options list comes from ExchangeDataContext.
  const { data: exchangesResp, loading: exchangesLoading } =
    useExchangesFromContext();
  const exchangesData = exchangesResp?.data?.exchanges ?? [];

  return (
    <div className="space-y-xs">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {legId === 'long' ? 'LONG leg' : 'SHORT leg'}
      </h3>
      <BasicSettings
        currentExchange={currentExchange}
        formData={formData}
        updateFormData={
          updateFormData as (field: Fields, value: BotFormUpdateValue) => void
        }
        errors={errors}
        mode={mode}
        isFieldLocked={isFieldLocked}
        exchangesData={exchangesData}
        exchangesLoading={exchangesLoading}
        hideName
      />
    </div>
  );
};

export interface HedgeQuickLegProps {
  legId: 'long' | 'short';
  widgetId: string;
  initialFormData?: Partial<BotFormData> | undefined;
  formDataRef: MutableRefObject<BotFormData | null>;
  /**
   * Optional children rendered AFTER the leg's exchange/pair fields
   * but inside the leg's BotFormProvider. Used so the long leg can
   * wrap the rest of the Quick view (short leg, investment, risk
   * profile, footer) — the footer then has access to the long leg's
   * formData / currentExchange for credits + Create-bot CTA.
   */
  children?: ReactNode;
  /**
   * Optional slot rendered at the very end of the leg's BotFormProvider
   * tree (after `children`). Used to mount BotFormFooter at the bottom
   * of the Quick view.
   */
  footerSlot?: ReactNode;
}

export const HedgeQuickLeg: React.FC<HedgeQuickLegProps> = ({
  legId,
  widgetId,
  initialFormData,
  formDataRef,
  children,
  footerSlot,
}) => {
  const experience = tryGetBotExperience(BotTypesEnum.dca);
  if (!experience) return null;

  const strategy = legId === 'long' ? StrategyEnum.long : StrategyEnum.short;

  return (
    <BotFormRegistryContext.Provider
      value={{ botExperience: experience, widgetId }}
    >
      <BotFormProvider
        mode="create"
        botType={BotTypesEnum.dca}
        isNestedLeg
        {...(initialFormData ? { initialFormData } : {})}
      >
        <LegPublisher targetRef={formDataRef} />
        <LegStrategyPinner strategy={strategy} />
        {legId === 'long' && <QuickLegChartPublisher />}
        <BotFormQueryProvider mode="create">
          {footerSlot ? (
            // When this leg owns the page footer (the long leg in the
            // hedge Quick view), lay out its tree as a flex column with
            // a scrollable middle and the footer pinned at the bottom.
            // The header above sits outside this component and uses
            // position:sticky to stay in place during scroll.
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto space-y-md">
                <LegFields legId={legId} />
                {children}
              </div>
              <div className="shrink-0 pt-2">{footerSlot}</div>
            </div>
          ) : (
            <>
              <LegFields legId={legId} />
              {children}
            </>
          )}
        </BotFormQueryProvider>
      </BotFormProvider>
    </BotFormRegistryContext.Provider>
  );
};

export default HedgeQuickLeg;
