import { NumberInput } from '@/components/ui';
import { Button } from '@/components/ui/button';
import {
  formatNumberWithTrim,
  type PrecisionGuard,
} from '@/features/bots/shared/utils/order-guard';
import { OrderSizeTypeEnum } from '@/types';
import { Lock } from 'lucide-react';
import React, { useState } from 'react';

export interface TerminalAmountTotalFieldsProps {
  /** Value shown in the Amount field (base units). */
  amountValue: number;
  /** Value shown in the Total field (quote / contract units). */
  totalValue: number;
  orderSizeType: OrderSizeTypeEnum;
  onAmountFocus: () => void;
  onAmountChange: (value: number | string) => void;
  onTotalFocus: () => void;
  onTotalChange: (value: number | string) => void;
  /** Max amount/total, pre-formatted strings (legacy `convertFromExponential`). */
  maxAmount: string;
  maxTotal: string;
  baseAsset: string;
  quoteAsset: string;
  coinm: boolean;
  providerIsBybit: boolean;
  /** USD equivalent of the Amount field (base -> quote -> USD). */
  usdEquivalent: number;
  percentButtons: number[];
  activePerc: string;
  setPercent: (num: number) => () => void;
  guard?: PrecisionGuard | null;
  disabled?: boolean;
}

/**
 * Dual Amount/Total order-size fields, ported from the legacy
 * `TerminalBotSettings`. Both fields are always visible and kept in sync via
 * price by the parent hook. The active field (per `orderSizeType`) shows the
 * raw canonical value; the inactive field shows the price-derived value. The
 * lock icon tint signals which unit is canonical (legacy `#FF9551`).
 *
 * Purely presentational: all state lives in `useStrategySettingsTab`.
 */
const TerminalAmountTotalFields: React.FC<TerminalAmountTotalFieldsProps> = ({
  amountValue,
  totalValue,
  orderSizeType,
  onAmountFocus,
  onAmountChange,
  onTotalFocus,
  onTotalChange,
  maxAmount,
  maxTotal,
  baseAsset,
  quoteAsset,
  coinm,
  providerIsBybit,
  usdEquivalent,
  percentButtons,
  activePerc,
  setPercent,
  guard,
  disabled,
}) => {
  const [freePerc, setFreePerc] = useState<string>('');

  const totalUnit = coinm ? (providerIsBybit ? 'USD' : 'Cont') : quoteAsset;

  const amountActive = orderSizeType === OrderSizeTypeEnum.base;
  const totalActive = orderSizeType === OrderSizeTypeEnum.quote;

  const guardProps: {
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
  } = {};
  if (typeof guard?.min === 'number') {
    guardProps.min = guard.min;
  }
  if (typeof guard?.max === 'number') {
    guardProps.max = guard.max;
  }
  if (typeof guard?.step === 'number') {
    guardProps.step = guard.step;
  }
  if (typeof guard?.decimals === 'number') {
    guardProps.precision = guard.decimals;
  }

  return (
    <div className="space-y-3">
      {/* Amount field */}
      <div className="space-y-xs">
        <span className="text-muted-foreground text-xs">Amount</span>
        <NumberInput
          value={amountValue}
          // Commit on blur only (legacy parity): NumberInput's internal draft
          // shows the raw typing; committing per-keystroke would thrash the
          // form store and re-derive the linked field on every character.
          onBlur={(e) => onAmountChange(e.target.value)}
          onFocus={onAmountFocus}
          disabled={disabled}
          showControls={false}
          startAdornment={
            <Lock
              className={`h-4 w-4 ${amountActive ? 'text-[#FF9551]' : 'text-muted-foreground'}`}
            />
          }
          endAdornment={
            <span className="opacity-50">
              {formatNumberWithTrim(usdEquivalent, 2)} USD
            </span>
          }
          {...guardProps}
        />

        {/* Percentage row (Amount only) */}
        <div className="flex flex-wrap items-center gap-1">
          {percentButtons.map((val) => (
            <Button
              key={val}
              type="button"
              size="sm"
              variant={activePerc === `${val}` ? 'default' : 'outline'}
              disabled={disabled}
              onClick={setPercent(val)}
            >
              {val}%
            </Button>
          ))}
          <div className="w-20">
            <NumberInput
              value={freePerc}
              onChange={(v) => setFreePerc(String(v))}
              onBlur={() => {
                if (!isNaN(+freePerc) && freePerc !== '') {
                  setPercent(+freePerc)();
                }
              }}
              disabled={disabled}
              showControls={false}
              endAdornment={<span className="opacity-50">%</span>}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Max amount {maxAmount} {baseAsset}
        </p>
      </div>

      {/* Total field */}
      <div className="space-y-xs">
        <span className="text-muted-foreground text-xs">Total</span>
        <NumberInput
          value={totalValue}
          // Commit on blur only (legacy parity) — see Amount field above.
          onBlur={(e) => onTotalChange(e.target.value)}
          onFocus={onTotalFocus}
          disabled={disabled}
          showControls={false}
          startAdornment={
            <Lock
              className={`h-4 w-4 ${totalActive ? 'text-[#FF9551]' : 'text-muted-foreground'}`}
            />
          }
          endAdornment={<span>{totalUnit}</span>}
          {...guardProps}
        />
        <p className="text-xs text-muted-foreground">
          Max total {maxTotal} {totalUnit}
        </p>
      </div>
    </div>
  );
};

export default TerminalAmountTotalFields;
