import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../../ui/button';
import { BotMarginTypeEnum } from '@/types';

interface MarginTypeSelectorProps {
  marginType?: BotMarginTypeEnum | undefined;
  onMarginTypeChange: (marginType: BotMarginTypeEnum) => void;
  availableTypes?: BotMarginTypeEnum[];
  disabled?: boolean;
  className?: string;
}

export const MarginTypeSelector: React.FC<MarginTypeSelectorProps> = ({
  marginType,
  onMarginTypeChange,
  availableTypes,
  disabled = false,
  className,
}) => {
  const types: BotMarginTypeEnum[] = React.useMemo(() => {
    if (availableTypes && availableTypes.length > 0) {
      return availableTypes;
    }

    return [BotMarginTypeEnum.isolated, BotMarginTypeEnum.cross];
  }, [availableTypes]);

  const handleSelect = (type: BotMarginTypeEnum) => {
    if (disabled || !types.includes(type)) {
      return;
    }

    onMarginTypeChange(type);
  };

  return (
    <div className={cn('flex gap-xs', className)}>
      {types.includes(BotMarginTypeEnum.isolated) && (
        <Button
          variant={
            !marginType || marginType === BotMarginTypeEnum.isolated
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() => handleSelect(BotMarginTypeEnum.isolated)}
          className="flex-1"
          disabled={disabled}
        >
          Isolated
        </Button>
      )}
      {types.includes(BotMarginTypeEnum.cross) && (
        <Button
          variant={
            marginType === BotMarginTypeEnum.cross ? 'default' : 'outline'
          }
          size="sm"
          onClick={() => handleSelect(BotMarginTypeEnum.cross)}
          className="flex-1"
          disabled={disabled}
        >
          Cross
        </Button>
      )}
    </div>
  );
};

export default MarginTypeSelector;
