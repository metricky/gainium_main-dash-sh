import { InlineIndicatorConfig } from '@/components/indicators/InlineIndicatorConfig';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { InfoIcon, Tooltip } from '@/components/ui/tooltip';
import {
  ExchangeIntervals,
  type ExchangeEnum,
  IndicatorAction,
  IndicatorEnum,
  timeIntervalMap,
} from '@/types';
import type { IndicatorConfig } from '@/types/indicators';
import { getIndicatorDefinition } from '@/types/indicators/indicatorLogic';
import type { IndicatorParamsState } from '@/types/indicators/indicatorParams';
import type { ReactNode } from 'react';

/**
 * Legacy-parity card for the "Dynamic ATR/ADR" mode. Legacy renders a minimal
 * card — Indicator / Length / Interval / Multiplier — NOT the full technical
 * indicator editor (no Condition / Value / Keep-true). We mirror that by
 * trimming the catalog definition down to just Length + Interval and rendering
 * the Multiplier (dynamicArFactor) explicitly with its explainer as a tooltip.
 *
 * Shared by the DCA "Base scaling on → ATR/ADR" section and the dynamic-AR
 * take-profit close condition so the two stay identical.
 */

const DYNAMIC_AR_FIELD_KEYS = new Set(['indicatorLength', 'indicatorInterval']);
const DYNAMIC_AR_TYPES: IndicatorEnum[] = [IndicatorEnum.atr, IndicatorEnum.adr];

const MULTIPLIER_TOOLTIP =
  "Multiplies the indicator's ATR/ADR value to determine distance from the latest price.";

export interface DynamicArIndicatorConfigProps {
  indicator: IndicatorConfig;
  /** Action the indicator belongs to (startDca for scaling, closeDeal for TP/SL). */
  action: IndicatorAction;
  exchange?: ExchangeEnum | null;
  /** Forwarded to InlineIndicatorConfig when Length / Interval change. */
  onChangeParams: (next: IndicatorParamsState) => void;
  /** Called when the Multiplier (dynamicArFactor) changes. */
  onChangeFactor: (value: string) => void;
  /** Minimum interval in ms — legacy forces >= 1h for the dynamic-AR mode. */
  minIntervalMs?: number;
  /** Optional slot rendered to the right of the Multiplier input. */
  factorSlot?: ReactNode;
  className?: string;
}

export function DynamicArIndicatorConfig({
  indicator,
  exchange,
  onChangeParams,
  onChangeFactor,
  minIntervalMs = timeIntervalMap[ExchangeIntervals.oneH],
  factorSlot,
  className,
}: DynamicArIndicatorConfigProps) {
  if (!DYNAMIC_AR_TYPES.includes(indicator.type as IndicatorEnum)) {
    return (
      <div className="rounded-md bg-destructive/10 p-sm text-sm text-destructive">
        {indicator.type} isn&apos;t supported for Dynamic ATR/ADR. Remove it and
        add an ATR or ADR indicator instead.
      </div>
    );
  }

  let definition: ReturnType<typeof getIndicatorDefinition>;
  try {
    definition = getIndicatorDefinition(indicator.type as IndicatorEnum);
  } catch {
    return (
      <div className="rounded-md bg-destructive/10 p-sm text-sm text-destructive">
        Selected indicator definition is unavailable.
      </div>
    );
  }

  // Use the indicator as-is (like the regular indicator card). Merging
  // `getIndicatorDefaultParams` in here re-injected default fields (e.g.
  // indicatorLength: 14) on every render, which fought edits — the field would
  // snap back to the default. InlineIndicatorConfig already falls back to each
  // field's default via `?? effectiveDefault`.
  const params: IndicatorParamsState = indicator as IndicatorParamsState;

  // Trim to the legacy field set: Length + Interval only.
  const trimmedDefinition = {
    ...definition,
    fields: definition.fields.filter((field) =>
      DYNAMIC_AR_FIELD_KEYS.has(field.key)
    ),
    advancedFields: undefined,
  };

  const rawFactor = indicator.dynamicArFactor;
  const factorValue =
    typeof rawFactor === 'string' && rawFactor.trim().length ? rawFactor : '1';

  return (
    <div className={['space-y-md', className].filter(Boolean).join(' ')}>
      <InlineIndicatorConfig
        definition={trimmedDefinition}
        params={params}
        indicatorUuid={indicator.uuid}
        exchange={exchange ?? undefined}
        minIntervalMs={minIntervalMs}
        onChange={onChangeParams}
        className="space-y-md"
      />
      <div className="space-y-xs">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm">Multiplier</Label>
          <Tooltip tooltip={MULTIPLIER_TOOLTIP}>
            <InfoIcon />
          </Tooltip>
        </div>
        <div className="flex items-center gap-sm">
          <NumberInput
            value={factorValue}
            onChange={(value) =>
              onChangeFactor(typeof value === 'string' ? value : String(value))
            }
            min={0.1}
            step={0.1}
            precision={2}
            className="w-24"
          />
          {factorSlot}
        </div>
      </div>
    </div>
  );
}
