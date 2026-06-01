import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';
import { type ComponentType, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type PanelMenuItem =
  | {
      type?: 'item';
      label: ReactNode;
      onSelect: () => void;
      icon?: ComponentType<{ className?: string }>;
      disabled?: boolean;
      shortcut?: string;
      id?: string;
    }
  | {
      type: 'checkbox';
      label: ReactNode;
      checked: boolean;
      onCheckedChange: (checked: boolean) => void;
      onSelect?: () => void;
      icon?: ComponentType<{ className?: string }>;
      disabled?: boolean;
      id?: string;
    }
  | {
      type: 'separator';
      id?: string;
    };

export interface PanelMenuConfig {
  items: PanelMenuItem[];
  triggerAriaLabel?: string;
  contentClassName?: string;
}

export interface PanelMenuDropdownProps extends PanelMenuConfig {
  triggerClassName?: string;
}

const filterMenuItems = (items: PanelMenuItem[] | undefined) =>
  (items ?? []).filter((item): item is PanelMenuItem => Boolean(item));

export function PanelMenuDropdown({
  items,
  triggerAriaLabel,
  contentClassName,
  triggerClassName,
}: PanelMenuDropdownProps) {
  const menuItems = filterMenuItems(items);

  if (!menuItems.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 text-muted-foreground hover:text-foreground',
            triggerClassName
          )}
        >
          <span className="sr-only">
            {triggerAriaLabel ?? 'Open panel menu'}
          </span>
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn('w-56', contentClassName)}>
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <DropdownMenuSeparator key={item.id ?? `separator-${index}`} />
            );
          }

          const Icon = item.icon;

          if (item.type === 'checkbox') {
            const handleCheckedChange = (checked: boolean) => {
              item.onCheckedChange(checked);
            };

            return (
              <DropdownMenuCheckboxItem
                key={item.id ?? `checkbox-${index}`}
                checked={item.checked}
                onCheckedChange={handleCheckedChange}
                className="rounded-lg"
                disabled={Boolean(item.disabled)}
              >
                <div className="flex items-center gap-xs">
                  {Icon ? (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                  <span>{item.label}</span>
                </div>
              </DropdownMenuCheckboxItem>
            );
          }

          return (
            <DropdownMenuItem
              key={item.id ?? `item-${index}`}
              onSelect={item.onSelect}
              className="rounded-lg"
              disabled={Boolean(item.disabled)}
            >
              <div className="flex items-center gap-xs">
                {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                <span>{item.label}</span>
              </div>
              {item.shortcut ? (
                <span className="ml-auto text-xs tracking-wider text-muted-foreground/70">
                  {item.shortcut}
                </span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface PanelContentConfig {
  /**
   * Optional unique identifier. Required when used within tab collections.
   */
  key?: string;
  /**
   * Main heading for the panel. Accepts plain text or JSX.
   */
  title?: ReactNode;
  /**
   * Secondary line under the title.
   */
  description?: ReactNode;
  /**
   * Custom header markup. When provided, title/description/actions are ignored.
   */
  header?: ReactNode;
  /**
   * Right-aligned actions within the default header (ignored when `header` is provided).
   */
  actions?: ReactNode;
  /**
   * Primary body content.
   */
  content: ReactNode;
  /**
   * Optional footer content displayed below the body.
   */
  footer?: ReactNode;
  /**
   * Class applied to the panel container.
   */
  containerClassName?: string;
  /**
   * Class applied to the body wrapper.
   */
  bodyClassName?: string;
  /**
   * Class applied to the immediate wrapper around `content`.
   */
  contentClassName?: string;
  /**
   * Optional badge or additional adornment rendered next to the title.
   */
  badge?: ReactNode;
  /**
   * Optional contextual menu rendered as a three-dot dropdown in the header.
   */
  menu?: PanelMenuConfig;
}

interface PanelContainerProps extends PanelContentConfig {
  /**
   * When true, the body wrapper will skip default padding.
   */
  paddinglessBody?: boolean;
}

export function PanelContainer({
  title,
  description,
  header,
  actions,
  content,
  footer,
  containerClassName,
  bodyClassName,
  contentClassName,
  badge,
  menu,
  paddinglessBody,
}: PanelContainerProps) {
  const menuItems = filterMenuItems(menu?.items);
  const normalizedMenu: PanelMenuDropdownProps | null = menuItems.length
    ? {
        items: menuItems,
        ...(menu?.triggerAriaLabel
          ? { triggerAriaLabel: menu.triggerAriaLabel }
          : {}),
        ...(menu?.contentClassName
          ? { contentClassName: menu.contentClassName }
          : {}),
      }
    : null;

  const hasTitleContent = Boolean(title || description || badge);
  const hasActionContent = Boolean(actions) || Boolean(normalizedMenu);
  const shouldRenderDefaultHeader = Boolean(
    !header && (hasTitleContent || hasActionContent)
  );

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg bg-card text-card-foreground shadow-sm',
        containerClassName
      )}
    >
      {header ? (
        header
      ) : shouldRenderDefaultHeader ? (
        <div className="flex items-start gap-sm px-sm py-sm">
          {hasTitleContent ? (
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-xs">
                {title ? (
                  <h2 className="text-sm font-medium text-foreground">
                    {title}
                  </h2>
                ) : null}
                {badge}
              </div>
              {description ? (
                <p className="text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          ) : null}
          {hasActionContent ? (
            <div
              className={cn(
                'flex items-center gap-xs',
                hasTitleContent ? '' : 'ml-auto'
              )}
            >
              {actions}
              {normalizedMenu ? (
                <PanelMenuDropdown {...normalizedMenu} />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          'flex-1 overflow-auto',
          paddinglessBody ? undefined : 'px-sm py-sm',
          bodyClassName
        )}
      >
        <div className={cn('h-full', contentClassName)}>{content}</div>
      </div>

      {footer ? (
        <div className="px-sm py-sm text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
