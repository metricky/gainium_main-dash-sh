import React from 'react';
import { Button } from '../../ui/button';
import { StrategyEnum } from '@/types';

interface StrategySelectorProps {
  strategy: StrategyEnum;
  onStrategyChange: (strategy: StrategyEnum) => void;
  disabled?: boolean;
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({
  strategy,
  onStrategyChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-xs">
      <div className="flex gap-xs">
        <Button
          variant={strategy === StrategyEnum.long ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (disabled) {
              return;
            }
            onStrategyChange(StrategyEnum.long);
          }}
          className={`flex-1 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
          disabled={disabled}
        >
          Long
        </Button>
        <Button
          variant={strategy === StrategyEnum.short ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (disabled) {
              return;
            }
            onStrategyChange(StrategyEnum.short);
          }}
          className={`flex-1 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
          disabled={disabled}
        >
          Short
        </Button>
      </div>
    </div>
  );
};

export default StrategySelector;
