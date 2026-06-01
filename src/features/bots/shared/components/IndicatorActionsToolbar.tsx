import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface IndicatorActionsToolbarProps {
  onAddIndicator?: () => void;
  addIndicatorLabel?: string;
  addIndicatorDisabled?: boolean | undefined;
  addIndicatorTooltip?: string | undefined;
  addIndicatorVariant?: React.ComponentProps<typeof Button>['variant'];
  addIndicatorIcon?: React.ReactNode;

  onAddGroup?: () => void;
  addGroupLabel?: string;
  addGroupTooltip?: string | undefined;
  addGroupIcon?: React.ReactNode;

  orientation?: 'row' | 'column';
  className?: string;
  buttonSize?: React.ComponentProps<typeof Button>['size'];
  tooltipDelay?: number;
  tooltipSide?: React.ComponentProps<typeof Tooltip>['side'];
}

const defaultIcon = <Plus className="h-4 w-4" />;

export const IndicatorActionsToolbar: React.FC<
  IndicatorActionsToolbarProps
> = ({
  onAddIndicator,
  addIndicatorLabel = 'Add indicator',
  addIndicatorDisabled,
  addIndicatorTooltip,
  addIndicatorVariant = 'outline',
  addIndicatorIcon = defaultIcon,
  onAddGroup,
  addGroupLabel = 'Add group',
  addGroupTooltip,
  addGroupIcon = defaultIcon,
  orientation = 'row',
  className,
  buttonSize = 'sm',
  tooltipDelay,
  tooltipSide,
}) => {
  type ButtonConfig = {
    onClick: () => void;
    disabled?: boolean | undefined;
    tooltip?: string | undefined;
    label: string;
    variant: React.ComponentProps<typeof Button>['variant'];
    icon?: React.ReactNode;
  };

  const renderButton = (config: ButtonConfig, key: string) => {
    const { onClick, disabled, tooltip, label, variant, icon } = config;

    const button = (
      <Button
        key={key}
        type="button"
        variant={variant}
        size={buttonSize}
        onClick={onClick}
        disabled={disabled}
        className="flex-none min-w-36 justify-center"
      >
        {icon ? (
          <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
            {icon}
          </span>
        ) : null}
        {label}
      </Button>
    );

    if (!tooltip) {
      return button;
    }

    const optionalProps: Partial<React.ComponentProps<typeof Tooltip>> = {};
    if (tooltipSide) {
      optionalProps.side = tooltipSide;
    }
    if (typeof tooltipDelay === 'number') {
      optionalProps.delay = tooltipDelay;
    }

    return (
      <Tooltip key={key} tooltip={tooltip} {...optionalProps}>
        <span>{button}</span>
      </Tooltip>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-xs',
        orientation === 'column' ? 'flex-col items-stretch' : 'flex-row',
        className
      )}
    >
      {onAddGroup
        ? renderButton(
            {
              onClick: onAddGroup,
              tooltip: addGroupTooltip,
              label: addGroupLabel,
              icon: addGroupIcon,
              variant: 'outline',
            },
            'group'
          )
        : null}
      {onAddIndicator
        ? renderButton(
            {
              onClick: onAddIndicator,
              disabled: addIndicatorDisabled,
              tooltip: addIndicatorTooltip,
              label: addIndicatorLabel,
              variant: addIndicatorVariant,
              icon: addIndicatorIcon,
            },
            'indicator'
          )
        : null}
    </div>
  );
};

IndicatorActionsToolbar.displayName = 'IndicatorActionsToolbar';

export default IndicatorActionsToolbar;
