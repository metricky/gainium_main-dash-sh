import type { BotFormData } from '@/types/bots/form';
import type {
  BotFormUpdateValue,
  Fields,
} from '@/contexts/bots/form/BotFormProvider';
import type { DcaTradingContext } from '@/hooks/bots/dca/useDcaTradingContext';
import type { RangeBounds } from '@/utils/bots/dca/ranges';
import type { CapitalSummaryResult } from '@/utils/bots/dca/capital-summary';
import type { useBalanceRefreshControl } from './useBalanceRefreshControl';

export type TerminalBalanceRefreshState = ReturnType<
  typeof useBalanceRefreshControl
>;

export interface TerminalControlFormatAmountOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface TerminalControlFormatRangeOptions {
  unit?: string;
  precision?: number;
}

export interface TerminalControlFormatters {
  amount: (
    value: number,
    options?: TerminalControlFormatAmountOptions
  ) => string;
  percentage: (value: number) => string;
  numericInput: (value: number, precision?: number) => string;
  range: (
    range: RangeBounds,
    options?: TerminalControlFormatRangeOptions
  ) => string;
}

export type TerminalControlTelemetryEvent =
  | 'dca.control.interaction'
  | 'dca.control.slider_change'
  | 'dca.control.balance_refresh';

export interface TerminalControlTelemetryPayload extends Record<
  string,
  unknown
> {
  control?: string;
  value?: unknown;
  meta?: Record<string, unknown>;
}

export interface TerminalControlTelemetryAdapter {
  track?: (
    event: TerminalControlTelemetryEvent,
    payload?: TerminalControlTelemetryPayload
  ) => void;
  resolveContext?: (params: {
    formData: BotFormData;
    tradingContext: DcaTradingContext;
  }) => Record<string, unknown>;
}

export interface UseTerminalControlsOptions {
  formData: BotFormData;
  tradingContext: DcaTradingContext;
  updateFormData: (field: Fields, value: BotFormUpdateValue) => void;
  onUpdateBalances?: () => unknown;
  telemetry?: TerminalControlTelemetryAdapter;
}

export interface TerminalControlsSummary {
  capital: CapitalSummaryResult;
  refresh: TerminalBalanceRefreshState;
}

export interface TerminalControlsToolkit {
  format: TerminalControlFormatters;
  summary: TerminalControlsSummary;
  emitTelemetry: (
    event: TerminalControlTelemetryEvent,
    payload?: TerminalControlTelemetryPayload
  ) => void;
}

export type UseTerminalControls = (
  options: UseTerminalControlsOptions
) => TerminalControlsToolkit;
