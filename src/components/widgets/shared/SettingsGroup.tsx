import React, { useEffect, useState } from 'react';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { InfoIcon, Tooltip } from '../../ui/tooltip';

interface SettingsGroupProps {
  title: string;
  tooltipText?: string;
  tooltipUrl?: string;
  isEnabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  alwaysEnabled?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
  toggleDisabled?: boolean;
  toggleTooltip?: string | undefined;
  sectionIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  sectionDescription?: string;
}

const TooltipWrapper = ({
  children,
  tooltipUrl,
  tooltipText,
}: {
  children: React.ReactNode;
  tooltipUrl?: string | undefined;
  tooltipText: string;
}) => {
  if (!tooltipText) return <>{children}</>;

  return (
    <Tooltip
      tooltip={tooltipText}
      {...(tooltipUrl && { tooltipURL: tooltipUrl })}
    >
      {children}
    </Tooltip>
  );
};

const SettingsGroup: React.FC<SettingsGroupProps> = ({
  title,
  tooltipText,
  tooltipUrl,
  isEnabled = true,
  onToggle,
  alwaysEnabled = false,
  children,
  className,
  id,
  toggleDisabled = false,
  toggleTooltip = undefined,
  sectionIcon,
  sectionDescription,
}) => {
  const [isExpanded, setIsExpanded] = useState(alwaysEnabled || isEnabled);

  useEffect(() => {
    if (alwaysEnabled) {
      setIsExpanded(true);
    } else {
      setIsExpanded(isEnabled);
    }
  }, [isEnabled, alwaysEnabled]);

  const handleToggle = (checked: boolean) => {
    if (toggleDisabled) {
      return;
    }

    if (!alwaysEnabled && onToggle) {
      onToggle(checked);
    }
  };

  const SectionIcon = sectionIcon;
  const switchElement = (
    <Switch
      checked={isEnabled}
      onCheckedChange={handleToggle}
      disabled={toggleDisabled}
      {...(id && { id })}
    />
  );

  const switchControl = toggleTooltip ? (
    <Tooltip tooltip={toggleTooltip} delay={200}>
      <div>{switchElement}</div>
    </Tooltip>
  ) : (
    switchElement
  );

  const containerClassName = ['space-y-sm', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassName}>
      <div className="border-l-4 border-primary bg-primary/10 px-4 py-3">
        <div className="flex items-start justify-between gap-md">
          <div className="flex-1">
            <div className="flex items-start gap-sm">
              {SectionIcon && (
                <SectionIcon
                  className="h-5 w-5 shrink-0 text-primary mt-0.5"
                  aria-hidden="true"
                />
              )}
              <div>
                <div className="flex items-center gap-xs">
                  <Label className="text-lg font-semibold leading-tight">
                    {title}
                  </Label>
                  {tooltipText && (
                    <TooltipWrapper
                      tooltipText={tooltipText}
                      tooltipUrl={tooltipUrl}
                    >
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipWrapper>
                  )}
                </div>
                {sectionDescription && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {sectionDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
          {!alwaysEnabled && (
            <div className="flex items-center gap-xs self-start">
              {switchControl}
            </div>
          )}
        </div>
      </div>

      {/* Content - no animations, no scroll restrictions */}
      {isExpanded && <div className="space-y-md">{children}</div>}
    </div>
  );
};

export default SettingsGroup;
