import type { PanelMenuConfig, PanelMenuItem } from './PanelContainer';
import type { WidgetMenuActionItem } from '@/components/widgets/WidgetWrapper';

export interface WidgetMenuConversionOptions {
  triggerAriaLabel?: string;
  contentClassName?: string;
  idPrefix?: string;
}

const toPanelMenuItem = (
  item: WidgetMenuActionItem,
  index: number,
  options?: WidgetMenuConversionOptions
): PanelMenuItem => {
  const idBase = options?.idPrefix ?? 'panel-menu-item';
  const id = `${idBase}-${index}`;

  if (typeof item.isChecked === 'boolean') {
    const checkboxItem: PanelMenuItem = {
      type: 'checkbox',
      id,
      label: item.label,
      checked: item.isChecked,
      onCheckedChange: () => {
        item.onSelect();
      },
      onSelect: item.onSelect,
    };

    if (item.icon) {
      checkboxItem.icon = item.icon;
    }

    if (item.disabled != null) {
      checkboxItem.disabled = item.disabled;
    }

    return checkboxItem;
  }

  const actionItem: PanelMenuItem = {
    type: 'item',
    id,
    label: item.label,
    onSelect: item.onSelect,
  };

  if (item.icon) {
    actionItem.icon = item.icon;
  }

  if (item.disabled != null) {
    actionItem.disabled = item.disabled;
  }

  return actionItem;
};

export const mapWidgetMenuItemsToPanelMenu = (
  items: WidgetMenuActionItem[] | undefined,
  options?: WidgetMenuConversionOptions
): PanelMenuConfig | null => {
  if (!items || items.length === 0) {
    return null;
  }

  const converted = items.map((item, index) =>
    toPanelMenuItem(item, index, options)
  );

  if (!converted.length) {
    return null;
  }

  const config: PanelMenuConfig = {
    items: converted,
  };

  if (typeof options?.triggerAriaLabel === 'string') {
    config.triggerAriaLabel = options.triggerAriaLabel;
  }

  if (typeof options?.contentClassName === 'string') {
    config.contentClassName = options.contentClassName;
  }

  return config;
};
