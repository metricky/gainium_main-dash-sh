import type { BotFormUpdateValue, Fields } from '@/features/bots';
import { math, trimNumber, verifyNumber } from '@/lib/utils/math';
import {
  BotStartTypeEnum,
  CloseConditionEnum,
  DCAConditionEnum,
  DCAVolumeType,
  DynamicPriceFilterDirectionEnum,
  IndicatorAction,
  IndicatorSection,
  OrderSizeTypeEnum,
  RRSlTypeEnum,
  ScaleDcaTypeEnum,
  StartConditionEnum,
  StrategyEnum,
  type DCABotSettings,
} from '@/types';
import type { BotFormData } from '@/types/bots';

export type HandleSettingsUpdateResult = Partial<Omit<BotFormData, 'dca'>> & {
  dca: Partial<DCABotSettings>;
};

export const handleSettingsUpdate = (
  formData: BotFormData,
  field: Fields,
  value: BotFormUpdateValue
): HandleSettingsUpdateResult => {
  const { dca: settings, pairMetadata, pair } = formData;
  const updates: HandleSettingsUpdateResult = { dca: {} };
  if (settings) {
    const {
      orderSize,
      step,
      ordersCount,
      activeOrdersCount,
      dynamicPriceFilterDirection,
      maxNumberOfOpenDeals,
      closeAfterXopen,
      dealCloseCondition,
      dealCloseConditionSL,
      futures,
      coinm,
      useMulti,
      useRelativeVolumeFilter,
      useVolumeFilter,
      dcaCondition,
      riskSlAmountPerc,
      riskSlAmountValue,
      scaleDcaType,
      orderSizeType,
      rrSlFixedValue,
      riskUseTpRatio,
      useCloseAfterXopen,
      botStart,
      botActualStart,
      useRiskReward,
      indicators,
      indicatorGroups,
    } = settings;
    updates.dca.indicators = settings.indicators
      ? [...settings.indicators]
      : [];
    updates.dca.indicatorGroups = settings.indicatorGroups
      ? [...settings.indicatorGroups]
      : [];
    if (field === 'dcaVolumeBaseOn' && value === DCAVolumeType.change) {
      updates.dca.tpPerc = '5';
      updates.dca.dcaVolumeRequiredChange = '5';
      updates.dca.dcaVolumeMaxValue = `${+orderSize * 20}`;
      if (
        isNaN(+updates.dca.dcaVolumeMaxValue) ||
        !isFinite(+updates.dca.dcaVolumeMaxValue)
      ) {
        updates.dca.dcaVolumeMaxValue = '-1';
      }
      const deviation = +ordersCount * +step;
      if (deviation < 10) {
        updates.dca.step = `${math.round(10 / +ordersCount, 2)}`;
      }
    }
    if (field === 'gridLevel' && verifyNumber(value as string)) {
      updates.dca.comboSmartGridsCount = `${+trimNumber(value as string, true) + 1}`;
    }
    if (field === 'ordersCount' && verifyNumber(value as string)) {
      const v = trimNumber(value as string, true);
      if (v < activeOrdersCount && v !== '') {
        updates.dca.activeOrdersCount = v;
      }
      if (activeOrdersCount === '0') {
        updates.dca.activeOrdersCount = '1';
      }
    }
    if (field === 'useVolumeFilter') {
      updates.dca.useVolumeFilter = !!value;
      updates.dca.useRelativeVolumeFilter = useVolumeFilter
        ? false
        : useRelativeVolumeFilter;
    }
    if (field === 'useRelativeVolumeFilter') {
      updates.dca.useRelativeVolumeFilter = !!value;
      updates.dca.useVolumeFilter = useRelativeVolumeFilter
        ? false
        : useVolumeFilter;
    }
    if (field === 'useMulti') {
      updates.dca.useMulti = !!value;
      if (!useMulti) {
        updates.dca.pair = [pair[0]];
        field = 'pair';
        value = pair;
      }
    }
    if (field === 'useDca' && !value) {
      updates.dca.dcaCondition = DCAConditionEnum.percentage;
      updates.dca.scaleDcaType = ScaleDcaTypeEnum.percentage;
    }
    if (
      dcaCondition !== DCAConditionEnum.percentage ||
      (updates.dca.dcaCondition &&
        updates.dca.dcaCondition !== DCAConditionEnum.percentage)
    ) {
      updates.dca.scaleDcaType = ScaleDcaTypeEnum.percentage;
    }
    if (field === 'strategy' && !settings.futures) {
      if (
        value === StrategyEnum.short &&
        (orderSizeType === OrderSizeTypeEnum.quote ||
          orderSizeType === OrderSizeTypeEnum.usd)
      ) {
        updates.dca.orderSizeType = OrderSizeTypeEnum.base;
      }
      if (
        value === StrategyEnum.long &&
        orderSizeType === OrderSizeTypeEnum.base
      ) {
        updates.dca.orderSizeType = OrderSizeTypeEnum.quote;
      }
    }
    const oldDealCloseCondition = dealCloseCondition;
    if (
      field === 'useTp' &&
      !!value &&
      dealCloseCondition !== CloseConditionEnum.tp
    ) {
      updates.dca.dealCloseCondition = CloseConditionEnum.tp;
    }
    if (
      field === 'useTp' &&
      !value &&
      dealCloseCondition !== CloseConditionEnum.manual
    ) {
      updates.dca.dealCloseCondition = CloseConditionEnum.manual;
      updates.dca.indicators = indicators?.filter(
        (i) =>
          !(
            i.indicatorAction === IndicatorAction.closeDeal &&
            i.section !== IndicatorSection.sl
          )
      );
      updates.dca.indicatorGroups = indicatorGroups?.filter(
        (ig) =>
          !(
            ig.action === IndicatorAction.closeDeal &&
            ig.section !== IndicatorSection.sl
          )
      );
    }
    if (
      field === 'useSl' &&
      !!value &&
      dealCloseConditionSL !== CloseConditionEnum.tp
    ) {
      updates.dca.dealCloseConditionSL = CloseConditionEnum.tp;
    }
    if (
      field === 'useSl' &&
      !value &&
      dealCloseConditionSL !== CloseConditionEnum.manual
    ) {
      updates.dca.dealCloseConditionSL = CloseConditionEnum.manual;
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) =>
          !(
            i.indicatorAction === IndicatorAction.closeDeal &&
            i.section === IndicatorSection.sl
          )
      );
      updates.dca.indicatorGroups = (updates.dca.indicatorGroups ?? []).filter(
        (ig) =>
          !(
            ig.action === IndicatorAction.closeDeal &&
            ig.section === IndicatorSection.sl
          )
      );
    }
    const oldDealCloseConditionSL = dealCloseConditionSL;
    if (
      field === 'startCondition' &&
      (value as StartConditionEnum) !== StartConditionEnum.ti
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) => i.indicatorAction !== IndicatorAction.startDeal
      );
    }
    if (
      field === 'dealCloseCondition' &&
      (((value as CloseConditionEnum) === CloseConditionEnum.dynamicAr &&
        oldDealCloseCondition === CloseConditionEnum.techInd) ||
        ((value as CloseConditionEnum) === CloseConditionEnum.techInd &&
          oldDealCloseCondition === CloseConditionEnum.dynamicAr))
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) =>
          !(
            i.indicatorAction === IndicatorAction.closeDeal &&
            i.section !== IndicatorSection.sl
          )
      );
      updates.dca.indicatorGroups = (updates.dca.indicatorGroups ?? []).filter(
        (ig) =>
          !(
            ig.action === IndicatorAction.closeDeal &&
            ig.section !== IndicatorSection.sl
          )
      );
    }
    if (
      field === 'dealCloseConditionSL' &&
      (((value as CloseConditionEnum) === CloseConditionEnum.dynamicAr &&
        oldDealCloseConditionSL === CloseConditionEnum.techInd) ||
        ((value as CloseConditionEnum) === CloseConditionEnum.techInd &&
          oldDealCloseConditionSL === CloseConditionEnum.dynamicAr))
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) =>
          !(
            i.indicatorAction === IndicatorAction.closeDeal &&
            i.section === IndicatorSection.sl
          )
      );
      updates.dca.indicatorGroups = (updates.dca.indicatorGroups ?? []).filter(
        (ig) =>
          !(
            ig.action === IndicatorAction.closeDeal &&
            ig.section === IndicatorSection.sl
          )
      );
    }
    if (
      dcaCondition !== DCAConditionEnum.indicators &&
      (scaleDcaType === ScaleDcaTypeEnum.percentage || !scaleDcaType)
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) => i.indicatorAction !== IndicatorAction.startDca
      );
    }
    if (
      field === 'dealCloseConditionSL' &&
      (value as CloseConditionEnum) !== CloseConditionEnum.techInd &&
      (value as CloseConditionEnum) !== CloseConditionEnum.dynamicAr
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) =>
          !(
            i.indicatorAction === IndicatorAction.closeDeal &&
            i.section === IndicatorSection.sl
          )
      );
      updates.dca.indicatorGroups = (updates.dca.indicatorGroups ?? []).filter(
        (ig) =>
          !(
            ig.action === IndicatorAction.closeDeal &&
            ig.section === IndicatorSection.sl
          )
      );
    }
    if (
      field === 'dealCloseConditionSL' &&
      (value as CloseConditionEnum) === CloseConditionEnum.dynamicAr &&
      oldDealCloseConditionSL === CloseConditionEnum.techInd
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) =>
          !(
            i.indicatorAction === IndicatorAction.closeDeal &&
            i.section === IndicatorSection.sl
          )
      );
      updates.dca.indicatorGroups = (updates.dca.indicatorGroups ?? []).filter(
        (ig) =>
          !(
            ig.action === IndicatorAction.closeDeal &&
            ig.section === IndicatorSection.sl
          )
      );
    }
    if (
      field === 'dealCloseCondition' &&
      (value as CloseConditionEnum) !== CloseConditionEnum.techInd &&
      (value as CloseConditionEnum) !== CloseConditionEnum.dynamicAr
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) =>
          !(
            i.indicatorAction === IndicatorAction.closeDeal &&
            i.section !== IndicatorSection.sl
          )
      );
      updates.dca.indicatorGroups = (updates.dca.indicatorGroups ?? []).filter(
        (ig) =>
          !(
            ig.action === IndicatorAction.closeDeal &&
            ig.section !== IndicatorSection.sl
          )
      );
    }
    if (
      field === 'dealCloseCondition' &&
      (value as CloseConditionEnum) === CloseConditionEnum.dynamicAr &&
      oldDealCloseConditionSL === CloseConditionEnum.techInd
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) =>
          !(
            i.indicatorAction === IndicatorAction.closeDeal &&
            i.section !== IndicatorSection.sl
          )
      );
      updates.dca.indicatorGroups = (updates.dca.indicatorGroups ?? []).filter(
        (ig) =>
          !(
            ig.action === IndicatorAction.closeDeal &&
            ig.section !== IndicatorSection.sl
          )
      );
    }
    if (
      (field === 'useRiskReward' && !value) ||
      (useRiskReward && field === 'rrSlType' && value === RRSlTypeEnum.fixed)
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) => i.indicatorAction !== IndicatorAction.riskReward
      );
    }
    if (field === 'useMultiTp' && !value) {
      updates.dca.multiTp = [];
    }
    if (field === 'useMultiSl' && !value) {
      updates.dca.multiSl = [];
    }
    if (field === 'strategy') {
      updates.dca.dynamicPriceFilterDirection =
        dynamicPriceFilterDirection ===
        DynamicPriceFilterDirectionEnum.overAndUnder
          ? dynamicPriceFilterDirection
          : value === StrategyEnum.long
            ? DynamicPriceFilterDirectionEnum.under
            : DynamicPriceFilterDirectionEnum.over;
    }
    if (field === 'useRiskReward' && !!value) {
      updates.dca.useSl = false;
      updates.dca.useDca = false;
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) =>
          i.indicatorAction !== IndicatorAction.startDca &&
          !(
            i.indicatorAction === IndicatorAction.closeDeal &&
            i.section === IndicatorSection.sl
          )
      );
      if (!riskSlAmountPerc) {
        updates.dca.riskSlAmountPerc = '1';
      }
      if (!riskSlAmountValue) {
        updates.dca.riskSlAmountValue = '0';
      }
      if (!rrSlFixedValue) {
        updates.dca.rrSlFixedValue = '-1';
      }
      if (riskUseTpRatio) {
        updates.dca.useTp = false;
        updates.dca.indicators = (updates.dca.indicators ?? []).filter(
          (i) => i.indicatorAction !== IndicatorAction.closeDeal
        );
      }
    }
    if (field === 'riskUseTpRatio' && !!value) {
      updates.dca.useTp = false;
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) => i.indicatorAction !== IndicatorAction.closeDeal
      );
    }
    if (dcaCondition !== DCAConditionEnum.custom) {
      updates.dca.dcaCustom = [];
    }
    if (
      maxNumberOfOpenDeals &&
      closeAfterXopen &&
      useCloseAfterXopen &&
      +maxNumberOfOpenDeals > +closeAfterXopen &&
      field !== 'closeAfterXopen'
    ) {
      updates.dca.closeAfterXopen = maxNumberOfOpenDeals;
    }
    if (useMulti && field === 'strategy') {
      if (
        value === StrategyEnum.long &&
        orderSizeType === OrderSizeTypeEnum.base
      ) {
        updates.dca.orderSizeType = OrderSizeTypeEnum.quote;
      }
      if (
        value === StrategyEnum.short &&
        orderSizeType === OrderSizeTypeEnum.quote
      ) {
        updates.dca.orderSizeType = OrderSizeTypeEnum.base;
      }
      if (futures) {
        updates.dca.orderSizeType = OrderSizeTypeEnum.quote;
      }
      if (coinm) {
        updates.dca.orderSizeType = OrderSizeTypeEnum.base;
      }
      if ([pair].flat().length > 0 && field === 'strategy' && !futures) {
        const firstMeta =
          pairMetadata[[pair].flat()[0]]?.[
            value === StrategyEnum.long ? 'quoteAsset' : 'baseAsset'
          ]?.name ?? null;
        updates.pair = [pair].flat().filter((s) => {
          const meta = pairMetadata[s];
          if (!meta) {
            return false;
          }
          return value === StrategyEnum.long
            ? meta.quoteAsset.name === firstMeta
            : meta.baseAsset.name === firstMeta;
        });
      }
    }
    if (field === 'useMulti' && !!value) {
      if (botStart === BotStartTypeEnum.price) {
        updates.dca.botStart = BotStartTypeEnum.manual;
      }
      if (botActualStart === BotStartTypeEnum.price) {
        updates.dca.botActualStart = BotStartTypeEnum.manual;
      }
    }
    if (
      (field === 'botStart' && value !== BotStartTypeEnum.indicators) ||
      (field === 'useBotController' && !value)
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) => i.indicatorAction !== IndicatorAction.stopBot
      );
      updates.dca.indicatorGroups = (updates.dca.indicatorGroups ?? []).filter(
        (ig) => ig.action !== IndicatorAction.stopBot
      );
    }
    if (
      (field === 'botActualStart' && value !== BotStartTypeEnum.indicators) ||
      (field === 'useBotController' && !value)
    ) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) => i.indicatorAction !== IndicatorAction.startBot
      );
      updates.dca.indicatorGroups = (updates.dca.indicatorGroups ?? []).filter(
        (ig) => ig.action !== IndicatorAction.startBot
      );
    }
    if (field === 'scaleDcaType' && value === ScaleDcaTypeEnum.percentage) {
      updates.dca.indicators = (updates.dca.indicators ?? []).filter(
        (i) => i.indicatorAction !== IndicatorAction.startDca
      );
    }
    if (
      JSON.stringify(updates.dca.indicators) ===
      JSON.stringify(settings.indicators)
    ) {
      delete updates.dca.indicators;
    }
    if (
      JSON.stringify(updates.dca.indicatorGroups) ===
      JSON.stringify(settings.indicatorGroups)
    ) {
      delete updates.dca.indicatorGroups;
    }
    if ((updates.dca.indicators ?? []).length) {
      updates.dca.indicatorGroups = (
        updates.dca.indicatorGroups ?? settings.indicatorGroups ?? []
      ).filter(
        (ig) =>
          (updates.dca.indicators ?? []).filter((i) => i.groupId === ig.id)
            .length > 0
      );
    }
  }
  return updates;
};
