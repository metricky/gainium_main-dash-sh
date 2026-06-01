import {
  CloseConditionEnum,
  closeConditionsMap,
  type DCADealsSettings,
} from '@/types';

/**
 * Returns a human-readable description of the TP or SL configuration for a deal.
 * Ported from legacy BotDealsTable.tsx `tpSLConfig`.
 *
 * Lines are separated by '\n'. Use CSS `whitespace-pre-line` or split on '\n'
 * to render multi-line output.
 */
export const tpSLConfig = (
  settings: DCADealsSettings,
  value: 'tp' | 'sl',
  combo = false
): string => {
  const tp = value === 'tp';
  let msg = '';

  if (tp && !settings.useTp) {
    return 'Not use TP';
  }
  if (!tp && !settings.useSl) {
    return 'Not use SL';
  }

  if (combo) {
    return `Target: ${tp ? settings.tpPerc : settings.slPerc}%`;
  }

  msg = `Type: ${
    closeConditionsMap[
      (tp ? settings.dealCloseCondition : settings.dealCloseConditionSL) ??
        CloseConditionEnum.tp
    ]
  }`;

  if (
    (tp &&
      settings.dealCloseCondition === CloseConditionEnum.tp &&
      !settings.useMultiTp) ||
    (!tp &&
      settings.dealCloseConditionSL === CloseConditionEnum.tp &&
      !settings.useMultiSl)
  ) {
    msg = `${msg}\nTarget: ${tp ? settings.tpPerc : settings.slPerc}%`;
  }

  if (tp && settings.closeByTimer) {
    msg = `${msg}\nClose by timer: ${settings.closeByTimerValue ?? 1} ${
      settings.closeByTimerUnits
    }`;
  }

  if (
    tp &&
    settings.dealCloseCondition === CloseConditionEnum.tp &&
    settings.trailingTp
  ) {
    msg = `${msg}\nTrailing TP: ${settings.trailingTpPerc}%`;
  }

  if (
    !tp &&
    settings.dealCloseConditionSL === CloseConditionEnum.tp &&
    settings.trailingSl
  ) {
    msg = `${msg}\nUse trailing SL`;
  }

  if (
    tp &&
    settings.multiTp &&
    settings.useMultiTp &&
    settings.dealCloseCondition === CloseConditionEnum.tp
  ) {
    msg = `${msg}\nMulti TP: ${settings.multiTp
      .map((_tp) => `${_tp.target}%`)
      .join(', ')}`;
  }

  if (
    !tp &&
    settings.multiSl &&
    settings.useMultiSl &&
    settings.dealCloseConditionSL === CloseConditionEnum.tp
  ) {
    msg = `${msg}\nMulti SL: ${settings.multiSl
      .map((_tp) => `${_tp.target}%`)
      .join(', ')}`;
  }

  if (
    tp &&
    settings.useMinTP &&
    settings.dealCloseCondition !== CloseConditionEnum.tp
  ) {
    msg = `${msg}\nMin TP: ${settings.minTp}%`;
  }

  if (!tp && settings.moveSL && !settings.useMultiSl) {
    msg = `${msg}\nMove SL target: ${settings.moveSLTrigger}%\nMove SL value: ${settings.moveSLValue}%`;
  }

  return msg;
};
