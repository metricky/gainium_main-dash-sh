import React from 'react';
import { cn } from '../../../lib/utils';
import { Label } from '../../ui/label';
import { InfoIcon, Tooltip } from '../../ui/tooltip';

import BotFormAlertSummary from '@/components/ui/BotFormAlertSummary';
import type { SettingsNavId } from '@/hooks/bots/useSettingsNavigation';
import type { BotFormAlert } from '@/types/bots/form';

interface SettingsRowProps {
  name?: string;
  description?: React.ReactNode;
  tooltip?: string;
  tooltipURL?: string;
  children?: React.ReactNode;
  /**
   * Number of columns to span in the grid layout
   * @default 1
   */
  colSpan?: 1 | 2 | 3 | 'full';
  /**
   * Optional trailing content rendered on the right side of the header row (e.g. switches, buttons).
   */
  trailing?: React.ReactNode;
  /**
   * Custom classes for the outer card.
   */
  className?: string;
  /**
   * Custom classes for the header wrapper.
   */
  headerClassName?: string;
  /**
   * Custom classes for the content area beneath the header.
   */
  contentClassName?: string;
  /**
   * Alignment for header items.
   * @default 'start'
   */
  headerAlign?: 'start' | 'center';
  /**
   * Optional alerts associated with this setting row (errors, warnings, info)
   */
  alerts?: BotFormAlert[];
  /**
   * Optional navigation id to allow external links to focus this settings row.
   * Use a value from SETTINGS_NAV_IDS for type safety and reliable navigation.
   */
  navId?: SettingsNavId | string;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  name,
  description,
  tooltip,
  tooltipURL,
  children,
  colSpan = 1,
  trailing,
  className,
  headerClassName,
  contentClassName,
  headerAlign = 'start',
  alerts,
  navId,
}) => {
  const getColSpanClass = () => {
    if (colSpan === 'full') {
      return 'col-span-full';
    }

    switch (colSpan) {
      case 2:
        return 'col-span-1 @[500px]:col-span-2';
      case 3:
        return 'col-span-1 @[500px]:col-span-2 @[800px]:col-span-3';
      case 1:
      default:
        return 'col-span-1';
    }
  };

  const hasHeader = Boolean(name || tooltip || description || trailing);

  const hasAlerts = Array.isArray(alerts) && alerts.length > 0;

  return (
    <div
      data-slot="settings-row"
      className={cn(
        // Transparent by default — let section spacing/typography group
        // rows. Hover tint and the nav-highlight class still work because
        // they target this element directly.
        'p-2 rounded-md transition-colors hover:bg-muted/30',
        getColSpanClass(),
        className
      )}
      data-settings-nav-id={navId}
      {...(name ? { 'data-settings-nav-name': name } : {})}
      tabIndex={navId ? -1 : undefined}
    >
      <div className={cn('flex flex-col gap-1', contentClassName)}>
        {hasHeader && (
          <div
            className={cn(
              'flex flex-wrap justify-between gap-xs',
              headerAlign === 'center' ? 'items-center' : 'items-start',
              headerClassName
            )}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-xs">
                {name && <Label className="text-sm font-medium">{name}</Label>}
                {tooltip && (
                  <Tooltip
                    tooltip={tooltip}
                    {...(tooltipURL ? { tooltipURL } : {})}
                    side="right"
                  >
                    <InfoIcon />
                  </Tooltip>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            {trailing && (
              <div className="flex shrink-0 items-center justify-end gap-xs">
                {trailing}
              </div>
            )}
          </div>
        )}
        {children}
        {hasAlerts && (
          <div className="flex justify-end">
            <BotFormAlertSummary alerts={alerts} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsRow;

type SettingsRowSurfaceTone =
  | 'muted'
  | 'faint'
  | 'surface'
  | 'transparent'
  | 'inner';
type SettingsRowSurfaceSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg';
type SettingsRowSurfacePadding = 'none' | 'sm' | 'md';
type SettingsRowSurfaceBorder = 'solid' | 'dashed';

interface SettingsRowSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: SettingsRowSurfaceTone;
  spacing?: SettingsRowSurfaceSpacing;
  padding?: SettingsRowSurfacePadding;
  borderStyle?: SettingsRowSurfaceBorder;
}

const toneClassNames: Record<SettingsRowSurfaceTone, string> = {
  muted: 'bg-muted/20',
  faint: 'bg-muted/10',
  surface: 'bg-card',
  transparent: 'bg-transparent',
  inner: 'bg-inner-container',
};

const spacingClassNames: Record<SettingsRowSurfaceSpacing, string> = {
  none: '',
  xs: 'space-y-1.5',
  sm: 'space-y-sm',
  md: 'space-y-md',
  lg: 'space-y-lg',
};

const paddingClassNames: Record<SettingsRowSurfacePadding, string> = {
  none: 'p-0',
  sm: 'p-sm',
  md: 'p-md',
};

const borderClassNames: Record<SettingsRowSurfaceBorder, string> = {
  solid: 'border border-border/60',
  dashed: 'border border-dashed border-border/50',
};

export const SettingsRowSurface = React.forwardRef<
  HTMLDivElement,
  SettingsRowSurfaceProps
>(
  (
    {
      tone = 'muted',
      spacing = 'md',
      padding = 'md',
      borderStyle = 'solid',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg',
          borderClassNames[borderStyle],
          toneClassNames[tone],
          paddingClassNames[padding],
          spacingClassNames[spacing],
          className
        )}
        {...props}
      />
    );
  }
);

SettingsRowSurface.displayName = 'SettingsRowSurface';
