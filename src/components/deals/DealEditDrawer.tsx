import {
  ScrollableFormTabNavigation,
  type ScrollableTabItem,
} from '@/components/ui/ScrollableFormTabNavigation';
import {
  DetailDrawer,
  DetailDrawerBody,
  DetailDrawerContent,
  DetailDrawerFooter,
  DetailDrawerHeader,
  DetailDrawerTitle,
  DetailDrawerTrigger,
} from '@/components/ui/detail-drawer';
import { TradingTerminalUtilsProvider } from '@/context/TradingTerminalUtilsContext';
import { useLiveUpdate } from '@/contexts/LiveUpdateContext';
import {
  BotFormProvider,
  useBotFormSelector,
  useBotFormState,
  type BotFormMode,
  type BotFormTabId,
} from '@/features/bots';
import {
  DCASettings,
  TakeProfitSettings,
} from '@/features/bots/bot-types/dca/form/sections';
import {
  getBotExperience,
  tryGetBotExperience,
} from '@/features/bots/catalog/BotExperienceCatalog';
import type { BotExperienceDescriptor } from '@/features/bots/catalog/types';
import { StopLossSettings } from '@/features/bots/shared/sections';
import type { TabDescriptorInput } from '@/features/bots/shared/tabs/createTabDescriptors';
import { BotFormRegistryContext } from '@/features/bots/widgets/BotForm';
import BotFormAlertButton from '@/features/bots/widgets/BotForm/components/BotFormAlertButton';
import { BUTTON_PRIORITIES } from '@/features/bots/widgets/BotForm/components/BotFormFooter';
import {
  BotFormQueryProvider,
  useBotFormQuery,
} from '@/features/bots/widgets/BotForm/providers/BotFormQueryProvider';
import type {
  BotFormTabComponentProps,
  GetBalanceFn,
} from '@/features/bots/widgets/BotForm/types';
import {
  useBotFormMutations,
  type UseBotFormMutationsOptions,
} from '@/hooks/bots/base/useBotFormMutations';
import { useEditDeal, useResetDeal } from '@/hooks/useDealActions';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { isActiveDeal } from '@/lib/utils/unrealizedPnL';
import {
  BotTypesEnum,
  ExchangeEnum,
  type ComboBotSettings,
  type DCABotSettings,
  type DCADeals,
  type DCADealsSettings,
} from '@/types';
import type { BotFormData } from '@/types/bots';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronDown,
  Delete,
  InfoIcon,
  Loader2,
  Save,
  TrendingUp,
  Undo,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ResponsiveButtonRow, {
  type ResponsiveButtonConfig,
} from '../ui/ResponsiveButtonRow';
import SettingsAlert from '../ui/SettingsAlert';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Tooltip } from '../ui/tooltip';
import { DCA_FORM_DEFAULTS } from '@/contexts/bots/form/formDefaults';
import type { TradingPair } from '@/hooks/useTradingPairs';

interface DealEditDrawerProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  trade: DCADeals[] | null;
  /** When true, renders form content directly without a DetailDrawer wrapper (for embedding inline in another drawer) */
  inline?: boolean;
}

const mapFromDataToDealSettings = (
  formData: BotFormData,
  isMultiple: boolean,
  reset?: boolean,
  originalTradeSettings?: DCADealsSettings
) => {
  const newState =
    formData.type === BotTypesEnum.combo ? formData.combo : formData.dca;
  const originalState =
    originalTradeSettings ??
    ((formData.originalBot?.type === formData.type
      ? formData.originalBot.settings
      : undefined) as DCABotSettings | ComboBotSettings | undefined);
  const keys = [
    'ordersCount',
    'step',
    'baseOrderPrice',
    'useLimitPrice',
    'startOrderType',
    'tpPerc',
    'profitCurrency',
    'baseOrderSize',
    'orderSize',
    'useTp',
    'useDca',
    'useSmartOrders',
    'activeOrdersCount',
    'volumeScale',
    'stepScale',
    'minimumDeviation',
    'useSl',
    'slPerc',
    'trailingSl',
    'moveSL',
    'moveSLTrigger',
    'moveSLValue',
    'moveSLForAll',
    'trailingTp',
    'trailingTpPerc',
    'useMinTP',
    'minTp',
    'orderSizeType',
    'useMultiSl',
    'multiSl',
    'useMultiTp',
    'multiTp',
    'dealCloseCondition',
    'dealCloseConditionSL',
    'closeDealType',
    'futures',
    'coinm',
    'marginType',
    'leverage',
    'useFixedTPPrices',
    'useFixedSLPrices',
    'dcaCondition',
    'closeByTimer',
    'closeByTimerUnits',
    'closeByTimerValue',
    'dcaCustom',
    'comboTpBase',
    'fixedSlPrice',
    'fixedTpPrice',
    'comboUseSmartGrids',
    'comboSmartGridsCount',
    'baseSlOn',
    'dcaVolumeBaseOn',
    'dcaVolumeRequiredChangeRef',
    'dcaVolumeMaxValue',
    'dcaVolumeRequiredChange',
  ].filter((k) =>
    isMultiple ? k !== 'baseOrderSize' && k !== 'orderSize' : true
  ) as (keyof DCADealsSettings)[];
  const result: Partial<DCADealsSettings> = keys.reduce((acc, key) => {
    const k = key as keyof DCADealsSettings;
    if (!(k in newState)) {
      return acc;
    }
    const original =
      originalState && k in originalState
        ? originalState[k as keyof typeof originalState]
        : undefined;
    let newValue = newState[k as keyof typeof newState];
    if (
      newValue === original ||
      (`${newValue}` === 'undefined' && `${original}` === 'null') ||
      (`${original}` === 'undefined' && `${newValue}` === 'null') ||
      ((typeof newValue === 'number' && typeof original === 'string') ||
      (typeof newValue === 'string' && typeof original === 'number')
        ? `${newValue}` === `${original}`
        : false)
    ) {
      return acc;
    }
    if (typeof original === 'number' && typeof newValue === 'string') {
      newValue = parseFloat(newValue);
    }
    //@ts-expect-error accumulator typing
    acc[k] = reset ? (original ?? newValue) : (newValue ?? original);
    return acc;
  }, {} as DCADealsSettings);
  return result;
};

export const DealEditDrawerInner: React.FC<DealEditDrawerProps> = React.memo(
  ({ children, onClose, trade, inline = false }) => {
    const {
      formData,
      isFieldLocked,
      updateFormData,
      errors,
      mode,
      activeTab,
      setActiveTab,
      features,
      setFormData,
    } = useBotFormState();
    const useBotFromMutationOptions: UseBotFormMutationsOptions = useMemo(
      () => ({
        mode: trade?.length === 1 ? 'deal-edit' : 'deal-mass-edit',
        botType: trade?.[0]?.combo ? BotTypesEnum.combo : BotTypesEnum.dca,
      }),
      [trade]
    );
    const { getBalances } = useBotFormMutations(useBotFromMutationOptions);
    useEffect(() => {
      if (!trade || trade.some((t) => !isActiveDeal(t))) {
        onClose();
      } else {
        const isSingle = trade.length === 1;
        const combinedSettings = isSingle
          ? {
              ...trade[0].dcaBot?.settings,
              ...trade[0].settings,
            }
          : { ...DCA_FORM_DEFAULTS };
        setFormData((prev) => {
          const clonedPrev = JSON.parse(JSON.stringify(prev)) as BotFormData;
          clonedPrev.exchangeUUID = trade[0].exchangeUUID;
          if (prev.type === BotTypesEnum.combo) {
            clonedPrev.combo = {
              ...clonedPrev.combo,
              ...combinedSettings,
            };
          } else {
            clonedPrev.dca = {
              ...clonedPrev.dca,
              ...combinedSettings,
            };
          }
          clonedPrev.originalBot = {
            type:
              prev.type === BotTypesEnum.combo
                ? BotTypesEnum.combo
                : BotTypesEnum.dca,
            settings: {
              ...(clonedPrev.type === BotTypesEnum.combo
                ? clonedPrev.combo
                : clonedPrev.dca),
              ...(isSingle ? trade[0].dcaBot?.settings : DCA_FORM_DEFAULTS),
            },
          };
          clonedPrev.pair = trade.map((t) => t.symbol.symbol);
          clonedPrev.pairMetadata = trade.reduce(
            (acc, t) => {
              acc[t.symbol.symbol] = {
                pair: t.symbol.symbol,
                baseAsset: {
                  name: t.symbol.baseAsset,
                  minAmount: 0,
                  maxAmount: 0,
                  step: 0,
                },
                quoteAsset: {
                  name: t.symbol.quoteAsset,
                  minAmount: 0,
                },
                exchange: t.exchange || ExchangeEnum.binance,
                priceAssetPrecision: 8,
                crossAvailable: true,
              };
              return acc;
            },
            {} as Record<string, TradingPair>
          );

          return clonedPrev;
        });
        if (trade[0]?.exchangeUUID) {
          getBalances(trade[0].exchangeUUID);
        }
      }
    }, [trade, onClose, setFormData, getBalances]);
    const { bot, exchanges, exchangesLoading, currentExchange } =
      useBotFormQuery();
    const useRiskReward = useBotFormSelector('useRiskReward');
    const [collapsedSections, setCollapsedSections] = useState<
      Record<string, boolean>
    >(() => ({ webhook: true }));
    const {
      balanceSelectors: { getBalance },
    } = useLiveUpdate();
    const isSectionCollapsed = useCallback(
      (id: string) => Boolean(collapsedSections[id]),
      [collapsedSections]
    );

    const toggleSectionCollapsed = useCallback((id: string) => {
      setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);
    const isCombo = useMemo(() => !!trade?.[0]?.combo, [trade]);

    const handleDrawerOpenChange = useCallback(
      (nextOpen: boolean) => {
        if (!nextOpen && onClose) {
          onClose();
        }
      },
      [onClose]
    );

    const handleDrawerClose = useCallback(() => {
      handleDrawerOpenChange(false);
    }, [handleDrawerOpenChange]);
    const sectionToggleMap: Record<string, string> = useMemo(
      () => ({
        dca: 'useDca',
        'take-profit': 'useTp',
        'stop-loss': 'useSl',
        'risk-reward': 'useRiskReward',
        'bot-controller': 'useBotController',
        experimental: 'useExperimental',
      }),
      []
    );
    const visibleDescriptors: TabDescriptorInput[] = useMemo(() => {
      return [
        {
          id: 'dca',
          label: 'DCA',
          icon: TrendingUp,
          Component: DCASettings,
          description: 'Dollar Cost Averaging configuration',
          tooltipText: 'Enable DCA to average down on losing positions',
          tooltipUrl: '/help/dca-mode',
          isTerminal: true,
          isDca: true,
        },
        {
          id: 'take-profit',
          label: 'Take Profit',
          icon: TrendingUp,
          Component: TakeProfitSettings,
          description: 'Take profit settings and targets',
          tooltipText: 'Configure take profit parameters',
          tooltipUrl: '/help/multiple-take-profit-targets',
          isTerminal: true,
          isDca: true,
        },
        {
          id: 'stop-loss',
          label: 'Stop Loss',
          icon: AlertTriangle,
          Component: StopLossSettings,
          description: 'Stop loss and risk management settings',
          tooltipText: 'Configure stop loss parameters',
          tooltipUrl: '/help/multiple-stop-loss-targets',
          isTerminal: true,
          isDca: true,
        },
      ];
    }, []);
    const getBalanceFn = useMemo<GetBalanceFn>(
      () => getBalance as unknown as GetBalanceFn,
      [getBalance]
    );
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const isScrolling = useRef(false);
    const handleTabChangeWithScroll = useCallback(
      (tabId: string) => {
        setActiveTab(tabId as BotFormTabId);

        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          const sectionElement = sectionRefs.current[tabId];
          const scrollContainer = scrollContainerRef.current;

          if (sectionElement && scrollContainer) {
            isScrolling.current = true;

            // Use scrollIntoView for more reliable scrolling
            sectionElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });

            // Reset scrolling flag after animation
            setTimeout(() => {
              isScrolling.current = false;
            }, 800);
          }
        });
      },
      [setActiveTab]
    );
    const componentProps: BotFormTabComponentProps = useMemo(
      () => ({
        currentExchange,
        formData,
        updateFormData:
          updateFormData as BotFormTabComponentProps['updateFormData'],
        errors,
        mode,
        isFieldLocked,
        getBalance: getBalanceFn,
        bot,
        exchangesData: exchanges,
        exchangesLoading,
        activeTab,
        onTabChange: handleTabChangeWithScroll,
        features,
      }),
      [
        formData,
        updateFormData,
        isFieldLocked,
        errors,
        mode,
        getBalanceFn,
        bot,
        exchanges,
        exchangesLoading,
        activeTab,
        handleTabChangeWithScroll,
        features,
        currentExchange,
      ]
    );

    const navigationTabs = useMemo<ScrollableTabItem[]>(() => {
      // Filter out disabled tabs completely (user requested removal instead of just disabling)
      return visibleDescriptors.map(({ id, label, icon, description }) => ({
        id,
        label,
        icon,
        ...(description ? { description } : {}),
      }));
    }, [visibleDescriptors]);

    useEffect(() => {
      if (navigationTabs.map((tab) => tab.id).indexOf(activeTab) === -1) {
        setActiveTab(navigationTabs[0]?.id as BotFormTabId);
      }
    }, [navigationTabs, activeTab, setActiveTab]);

    const shouldShowNavigation = useMemo(
      () => visibleDescriptors.length > 1,
      [visibleDescriptors.length]
    );
    const [submitIsPending, setSubmitIsPending] = useState(false);
    const editOptions = useMemo(
      () => ({
        onSuccess: () => onClose(),
        onError: (e: Error) => {
          toast.error('Failed to edit deal: ' + e.message);
          setSubmitIsPending(false);
        },
      }),
      [onClose]
    );
    const editMutation = useEditDeal(editOptions);
    const resetMutation = useResetDeal(editOptions);
    const isAnySettingChanged = useMemo(() => {
      const newState =
        formData.type === BotTypesEnum.combo ? formData.combo : formData.dca;
      return Object.entries(newState).some(([key, value]) => {
        const originalValue =
          formData.originalBot?.type === formData.type
            ? formData.originalBot.settings[
                key as keyof BotFormData['originalBot']
              ]
            : undefined;
        return value !== originalValue;
      });
    }, [formData.type, formData.combo, formData.dca, formData.originalBot]);
    const handleSubmit = useCallback(() => {
      if (!trade) {
        return;
      }
      if (isAnySettingChanged) {
        setSubmitIsPending(true);
      }
      const isSingle = trade.length === 1;
      const settings = mapFromDataToDealSettings(formData, !isSingle);
      for (const t of trade) {
        const localSettings = isSingle
          ? settings
          : mapFromDataToDealSettings(formData, !isSingle, false, t.settings);
        editMutation.mutate({
          dealId: t._id,
          botId: t.botId,
          type: formData.type,
          terminal: false,
          settings: localSettings,
        });
      }
    }, [trade, formData, isAnySettingChanged, editMutation]);
    const handleCancel = useCallback(() => {
      onClose();
    }, [onClose]);
    const handleResetToGlobal = useCallback(() => {
      if (!trade) {
        return;
      }
      const isSingle = trade.length === 1;
      const originalSettings = mapFromDataToDealSettings(
        formData,
        !isSingle,
        true
      );
      for (const t of trade) {
        const localSettings = isSingle
          ? originalSettings
          : mapFromDataToDealSettings(formData, !isSingle, true, t.settings);
        resetMutation.mutate({
          dealId: t._id,
          botId: t.botId,
          type: formData.type,
          terminal: false,
          originalSettings: localSettings,
        });
      }
    }, [trade, formData, resetMutation]);
    const submitLabel = useMemo(() => 'Save Changes', []);
    const cancelLabel = useMemo(() => 'Cancel', []);
    const resetLabel = useMemo(() => 'Reset to Global Settings', []);

    const buttonConfigs = useMemo((): ResponsiveButtonConfig[] => {
      const configs: ResponsiveButtonConfig[] = [];

      const showSubmit = isAnySettingChanged;

      configs.push({
        id: 'submit',
        priority: BUTTON_PRIORITIES.SUBMIT,
        fullContent: () => (
          <Button
            type="button"
            aria-busy={submitIsPending}
            onClick={handleSubmit}
            disabled={!showSubmit}
            aria-label={submitLabel}
            fullwidth
            className={cn(
              'gradient-brand hover:opacity-90 text-white font-semibold shadow-lg hover:shadow-xl duration-200 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase'
            )}
          >
            {submitIsPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="truncate">{submitLabel}</span>
              </>
            ) : (
              <div className="flex items-center justify-center w-full gap-xs">
                <Save className="w-4 h-4 shrink-0" />
                <span className="truncate">{submitLabel}</span>
              </div>
            )}
          </Button>
        ),
        compactContent: (
          <Button
            type="button"
            aria-busy={submitIsPending}
            onClick={handleSubmit}
            disabled={!showSubmit}
            aria-label={submitLabel}
            size="icon"
            className={cn(
              'gradient-brand hover:opacity-90 text-white font-semibold shadow-lg hover:shadow-xl duration-200 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase'
            )}
          >
            {submitIsPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="sr-only">{submitLabel}</span>
          </Button>
        ),
        // Submit button should never overflow - it's the primary action
        neverOverflow: true,
      });

      configs.push({
        id: 'cancel',
        priority: BUTTON_PRIORITIES.TOGGLE,
        fullContent: (
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex items-center justify-center gap-xs font-semibold uppercase px-4 py-2"
            aria-label={cancelLabel}
          >
            <Delete className="w-4 h-4 shrink-0" />
            <span className="truncate">{cancelLabel}</span>
          </Button>
        ),
        compactContent: (
          <Button
            onClick={handleCancel}
            size="icon"
            variant="outline"
            className={cn(
              'flex items-center justify-center font-semibold uppercase'
            )}
            aria-label={cancelLabel}
          >
            <Delete className="w-4 h-4" />
            <span className="sr-only">{cancelLabel}</span>
          </Button>
        ),
        menuLabel: cancelLabel,
      });

      if (trade?.some((t) => t.settings.changed)) {
        configs.push({
          id: 'reset',
          priority: BUTTON_PRIORITIES.TEMPLATES,
          fullContent: (
            <Button
              onClick={handleResetToGlobal}
              variant="outline"
              className="flex items-center justify-center gap-xs font-semibold uppercase px-4 py-2"
              aria-label={resetLabel}
            >
              <Undo className="w-4 h-4 shrink-0" />
              <span className="truncate">{resetLabel}</span>
            </Button>
          ),
          compactContent: (
            <Button
              onClick={handleResetToGlobal}
              size="icon"
              variant="outline"
              className={cn(
                'flex items-center justify-center font-semibold uppercase'
              )}
              aria-label={cancelLabel}
            >
              <Undo className="w-4 h-4" />
              <span className="sr-only">{resetLabel}</span>
            </Button>
          ),
          menuLabel: resetLabel,
        });
      }

      return configs;
    }, [
      submitIsPending,
      handleSubmit,
      submitLabel,
      handleCancel,
      cancelLabel,
      trade,
      resetLabel,
      handleResetToGlobal,
      isAnySettingChanged,
    ]);
    const navigationContent = useMemo(
      () =>
        shouldShowNavigation ? (
          <motion.div
            className="sticky top-0 z-10 bg-background mb-4 px-1 border-b border-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <ScrollableFormTabNavigation
                  tabs={navigationTabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChangeWithScroll}
                />
              </div>
              <div className="flex items-center gap-1 px-2 shrink-0">
                <BotFormAlertButton />
              </div>
            </div>
          </motion.div>
        ) : null,
      [
        navigationTabs,
        activeTab,
        handleTabChangeWithScroll,
        shouldShowNavigation,
      ]
    );

    const bodyContent = useMemo(
      () => (
        <div className="flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="custom-scrollbar h-full overflow-y-auto px-3 mobile-bottom-nav-padding"
          >
            <fieldset className="m-0 border-0 p-0 space-y-xl pb-2">
              {visibleDescriptors.map((descriptor) => {
                const SectionComponent = descriptor.Component;
                const toggleField = sectionToggleMap[
                  descriptor.id
                ] as keyof BotFormData['dca'];
                const hasToggle = toggleField !== undefined;
                const toggleEnabled = hasToggle
                  ? isCombo
                    ? Boolean(formData['combo'][toggleField])
                    : Boolean(formData['dca'][toggleField])
                  : false;

                return (
                  <div
                    key={descriptor.id}
                    ref={(el) => {
                      sectionRefs.current[descriptor.id] = el;
                    }}
                    id={`section-${descriptor.id}`}
                    className="transition-opacity scroll-mt-4"
                    data-section-id={descriptor.id}
                  >
                    <div className="mb-4 border-t-2 border-primary/60 pt-4 pb-3 bg-primary/10 rounded-lg px-4 -mx-2">
                      <div className="flex items-start justify-between gap-md">
                        <div className="flex-1">
                          <div className="flex items-start gap-sm">
                            <descriptor.icon className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-xs">
                                <h2 className="text-lg font-semibold leading-tight">
                                  {descriptor.label}
                                </h2>
                                {(descriptor.tooltipText || descriptor.description) && (
                                  <Tooltip
                                    tooltip={descriptor.tooltipText ?? descriptor.description ?? ''}
                                    {...(descriptor.tooltipUrl
                                      ? {
                                          tooltipURL: descriptor.tooltipUrl,
                                        }
                                      : {})}
                                  >
                                    <InfoIcon />
                                  </Tooltip>
                                )}
                              </div>
                              {(descriptor.id === 'stop-loss' ||
                                descriptor.id === 'take-profit' ||
                                descriptor.id === 'dca') &&
                                useRiskReward && (
                                  <SettingsAlert title="Disabled by Risk:Reward module" />
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-xs self-start pt-0.5">
                          {
                            // determine if collapse control should be shown: if the section has a toggle, only allow collapse when enabled; otherwise always allow
                          }
                          {(hasToggle ? toggleEnabled : true) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              aria-expanded={!isSectionCollapsed(descriptor.id)}
                              aria-controls={`section-${descriptor.id}`}
                              onClick={() =>
                                toggleSectionCollapsed(descriptor.id)
                              }
                              className={cn('p-0', 'opacity-100')}
                              title={
                                isSectionCollapsed(descriptor.id)
                                  ? 'Expand section'
                                  : 'Collapse section'
                              }
                            >
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 transition-transform',
                                  isSectionCollapsed(descriptor.id)
                                    ? 'rotate-0'
                                    : 'rotate-180'
                                )}
                              />
                            </Button>
                          )}
                          {hasToggle && (
                            <div className="flex items-center gap-xs">
                              <Switch
                                checked={toggleEnabled}
                                onCheckedChange={(checked: boolean) =>
                                  updateFormData(toggleField, checked)
                                }
                                disabled={!!isFieldLocked(toggleField)}
                                id={`toggle-${descriptor.id}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isSectionCollapsed(descriptor.id) && (
                      <SectionComponent {...componentProps} />
                    )}
                  </div>
                );
              })}
            </fieldset>
          </div>
        </div>
      ),
      [
        visibleDescriptors,
        componentProps,
        sectionToggleMap,
        isCombo,
        formData,
        isFieldLocked,
        updateFormData,
        isSectionCollapsed,
        toggleSectionCollapsed,
        useRiskReward,
      ]
    );

    const footerContent = useMemo(
      () => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="w-full"
        >
          <div className="px-4 pt-3 pb-4 border-t border-border space-y-1 w-full">
            <ResponsiveButtonRow
              buttons={buttonConfigs}
              gap={8}
              buffer={16}
              alignment="right"
              highestPriorityFullWidth
              compactThreshold={280}
            />
          </div>
        </motion.div>
      ),
      [buttonConfigs]
    );
    if (!trade) {
      return null;
    }

    // When inline, render content directly without a DetailDrawer wrapper
    if (inline) {
      return (
        <>
          {navigationContent}
          <DetailDrawerBody className="px-4 py-5 sm:px-6 sm:py-6">
            {bodyContent}
          </DetailDrawerBody>
          <DetailDrawerFooter className="px-0 py-0">
            {footerContent}
          </DetailDrawerFooter>
        </>
      );
    }

    return (
      <DetailDrawer open onOpenChange={handleDrawerOpenChange}>
        <DetailDrawerTrigger asChild>{children}</DetailDrawerTrigger>

        <DetailDrawerContent
          className="max-w-xl z-50"
          showCloseButton
          onClose={handleDrawerClose}
          resizable={false}
        >
          <DetailDrawerHeader className="relative">
            <div className="flex w-full flex-col gap-md">
              <div className="flex w-full items-center justify-between gap-md">
                <div className="flex flex-1 min-w-0 items-center gap-1 pr-4">
                  <DetailDrawerTitle className="text-balance text-2xl leading-tight sm:text-3xl">
                    Edit Deal
                  </DetailDrawerTitle>
                </div>
              </div>
            </div>
            {navigationContent}
          </DetailDrawerHeader>

          <DetailDrawerBody className="px-4 py-5 sm:px-6 sm:py-6">
            {bodyContent}
          </DetailDrawerBody>
          <DetailDrawerFooter className="px-0 py-0">
            {footerContent}
          </DetailDrawerFooter>
        </DetailDrawerContent>
      </DetailDrawer>
    );
  }
);

export const DealEditDrawer: React.FC<DealEditDrawerProps> = React.memo(
  (props) => {
    const mode: BotFormMode = useMemo(
      () => (props.trade?.length === 1 ? 'deal-edit' : 'deal-mass-edit'),
      [props.trade]
    );
    const debugEnabled = useMemo(
      () => import.meta.env['VITE_BOT_FORM_DEBUG'] === 'true',
      []
    );
    const botType = useMemo(
      () => (props.trade?.[0]?.combo ? BotTypesEnum.combo : BotTypesEnum.dca),
      [props.trade]
    );
    const resolvedExperience: BotExperienceDescriptor = useMemo(
      () => tryGetBotExperience(botType) ?? getBotExperience(BotTypesEnum.dca),
      [botType]
    );
    const contextValue = useMemo(
      () => ({ botExperience: resolvedExperience, widgetId: 'deal-edit' }),
      [resolvedExperience]
    );
    const defaultTab: BotFormTabId = useMemo(() => 'dca', []);
    if (!props.trade || !props.open || props.trade.length === 0) {
      return null;
    }
    return (
      <TradingTerminalUtilsProvider>
        <BotFormRegistryContext.Provider value={contextValue}>
          <BotFormProvider
            mode={mode}
            botType={botType}
            defaultTab={defaultTab}
          >
            <BotFormQueryProvider mode={mode} debug={debugEnabled}>
              <DealEditDrawerInner {...props} />
            </BotFormQueryProvider>
          </BotFormProvider>
        </BotFormRegistryContext.Provider>
      </TradingTerminalUtilsProvider>
    );
  }
);
