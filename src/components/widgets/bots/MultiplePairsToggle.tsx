import React from 'react';
import { Button } from '../../ui/button';
import { InfoIcon, Tooltip } from '../../ui/tooltip';

interface MultiplePairsToggleProps {
  useMulti: boolean;
  onMultiplePairsChange: (useMulti: boolean) => void;
}

const MultiplePairsToggle: React.FC<MultiplePairsToggleProps> = ({
  useMulti,
  onMultiplePairsChange,
}) => {
  return (
    <div className="space-y-xs">
      <div className="flex items-center gap-xs">
        <span className="text-sm font-medium text-foreground">
          Multiple Pairs
        </span>
        <Tooltip tooltip="Enable trading across multiple pairs simultaneously. When enabled, the bot can manage positions on different trading pairs at the same time.">
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
        </Tooltip>
      </div>
      <div className="flex gap-1">
        <Button
          variant={!useMulti ? 'default' : 'outline'}
          size="sm"
          className={`text-xs flex-1 h-8 ${
            !useMulti
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'border-primary'
          }`}
          onClick={() => onMultiplePairsChange(false)}
        >
          Single Pair
        </Button>
        <Button
          variant={useMulti ? 'default' : 'outline'}
          size="sm"
          className={`text-xs flex-1 h-8 ${
            useMulti
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'border-primary'
          }`}
          onClick={() => onMultiplePairsChange(true)}
        >
          Multiple Pairs
        </Button>
      </div>
    </div>
  );
};

export default MultiplePairsToggle;
