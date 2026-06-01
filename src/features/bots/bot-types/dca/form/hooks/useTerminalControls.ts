import { useCallback, useMemo } from 'react';

import { deriveCapitalSummary } from '@/utils/bots/dca/capital-summary';
import type { RangeBounds } from '@/utils/bots/dca/ranges';

import { useBalanceRefreshControl } from './useBalanceRefreshControl';
import type {
  TerminalControlFormatAmountOptions,
  TerminalControlFormatRangeOptions,
  TerminalControlTelemetryEvent,
  TerminalControlTelemetryPayload,
  TerminalControlFormatters,
  TerminalControlsSummary,
  TerminalControlsToolkit,
  UseTerminalControls,
  UseTerminalControlsOptions,
} from './useTerminalControls.types';

export const formatAmount = (
  value: number,
  options?: TerminalControlFormatAmountOptions
): string => {
  if (!Number.isFinite(value)) {
    return '0.00';
  }

  const absValue = Math.abs(value);
  const minimumFractionDigits =
    options?.minimumFractionDigits ?? (absValue < 1 ? 3 : 2);
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? (absValue < 1 ? 4 : 2);

  return value.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  });
};

export const formatPercentage = (value: number): string =>
  `${formatAmount(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export const formatNumericInput = (value: number, precision = 2): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return Number(value.toFixed(precision)).toString();
};

export const formatRange = (
  range: RangeBounds,
  options?: TerminalControlFormatRangeOptions
): string => {
  const unit = options?.unit ?? '';
  const precision = options?.precision;

  const formatValue = (rawValue: number): string => {
    if (!Number.isFinite(rawValue)) {
      return '—';
    }

    const normalized =
      precision !== undefined ? Number(rawValue.toFixed(precision)) : rawValue;

    if (!unit) {
      return normalized.toString();
    }

    return `${normalized}${unit}`;
  };

  const sourceSuffix = (() => {
    if (range.source === 'override') {
      const overrideKey = range.appliedOverrides[0]?.key;
      return overrideKey ? ` (via ${overrideKey})` : ' (backend override)';
    }
    if (range.source === 'combo-default') {
      return ' (combo default)';
    }
    if (range.source === 'hedge-default') {
      return ' (hedge default)';
    }
    return '';
  })();

  if (range.max === null || range.max === undefined) {
    return `From ${formatValue(range.min)} and above${sourceSuffix}`;
  }

  if (range.min === range.max) {
    return `Fixed at ${formatValue(range.min)}${sourceSuffix}`;
  }

  return `From ${formatValue(range.min)} to ${formatValue(range.max)}${sourceSuffix}`;
};

const formatters: TerminalControlFormatters = {
  amount: formatAmount,
  percentage: formatPercentage,
  numericInput: formatNumericInput,
  range: formatRange,
};

export const useTerminalControls: UseTerminalControls = (
  options: UseTerminalControlsOptions
): TerminalControlsToolkit => {
  const { formData, tradingContext, onUpdateBalances, telemetry } = options;

  const balanceRefresh = useBalanceRefreshControl({
    formData,
    ...(typeof onUpdateBalances === 'function' ? { onUpdateBalances } : {}),
  });

  const capitalSummary = useMemo(
    () => deriveCapitalSummary({ formData, tradingContext }),
    [formData, tradingContext]
  );

  const telemetryContext = useMemo(
    () =>
      telemetry?.resolveContext?.({
        formData,
        tradingContext,
      }) ?? null,
    [telemetry, formData, tradingContext]
  );

  const emitTelemetry = useCallback(
    (
      event: TerminalControlTelemetryEvent,
      payload?: TerminalControlTelemetryPayload
    ) => {
      if (!telemetry?.track) {
        return;
      }

      if (telemetryContext) {
        telemetry.track(
          event,
          payload ? { ...telemetryContext, ...payload } : telemetryContext
        );
        return;
      }

      telemetry.track(event, payload);
    },
    [telemetry, telemetryContext]
  );

  const summary = useMemo<TerminalControlsSummary>(
    () => ({
      capital: capitalSummary,
      refresh: balanceRefresh,
    }),
    [capitalSummary, balanceRefresh]
  );

  return useMemo<TerminalControlsToolkit>(
    () => ({
      format: formatters,
      summary,
      emitTelemetry,
    }),
    [summary, emitTelemetry]
  );
};
