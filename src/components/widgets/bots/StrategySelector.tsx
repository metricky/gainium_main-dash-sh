/* eslint-disable spacing/no-hardcoded-font-size */
import React from 'react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { StrategyEnum } from '@/types';

interface StrategySelectorProps {
  strategy: StrategyEnum;
  onStrategyChange: (strategy: StrategyEnum) => void;
  disabled?: boolean;
  /**
   * Optional balance caption rendered under the Long button (legacy terminal
   * parity — shows the available balance of the asset spent when going long).
   */
  longBalanceLabel?: string;
  /** Optional balance caption rendered under the Short button. */
  shortBalanceLabel?: string;
  /** Override the long-button label (terminal shows "Buy"). Defaults to "Long". */
  longLabel?: string;
  /** Override the short-button label (terminal shows "Sell"). Defaults to "Short". */
  shortLabel?: string;
  /**
   * Import-deal inversion: when true the "Buy" button sets StrategyEnum.short
   * and is highlighted when strategy === short, and vice-versa. Legacy parity
   * (TerminalBotSettings.tsx L931-987).
   */
  invert?: boolean;
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({
  strategy,
  onStrategyChange,
  disabled = false,
  longBalanceLabel,
  shortBalanceLabel,
  longLabel,
  shortLabel,
  invert = false,
}) => {
  const buyTargets = invert ? StrategyEnum.short : StrategyEnum.long;
  const sellTargets = invert ? StrategyEnum.long : StrategyEnum.short;
  const buyActive = strategy === buyTargets;
  const sellActive = strategy === sellTargets;
  const withCaption = !!longBalanceLabel || !!shortBalanceLabel;
  const buttonClass = (isDisabled: boolean) =>
    cn(
      'flex-1',
      withCaption && 'h-auto flex-col gap-0.5 py-1.5',
      isDisabled && 'pointer-events-none opacity-60'
    );

  return (
    <div className="space-y-xs">
      <div className="flex gap-xs">
        <Button
          variant={buyActive ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (disabled) {
              return;
            }
            onStrategyChange(buyTargets);
          }}
          className={buttonClass(disabled)}
          disabled={disabled}
        >
          <span>{longLabel ?? 'Long'}</span>
          {longBalanceLabel ? (
            <span className="text-[11px] font-normal leading-none opacity-70">
              {longBalanceLabel}
            </span>
          ) : null}
        </Button>
        <Button
          variant={sellActive ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (disabled) {
              return;
            }
            onStrategyChange(sellTargets);
          }}
          className={buttonClass(disabled)}
          disabled={disabled}
        >
          <span>{shortLabel ?? 'Short'}</span>
          {shortBalanceLabel ? (
            <span className="text-[11px] font-normal leading-none opacity-70">
              {shortBalanceLabel}
            </span>
          ) : null}
        </Button>
      </div>
    </div>
  );
};

export default StrategySelector;
