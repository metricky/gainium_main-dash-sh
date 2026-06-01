import type { BotWidgetType } from '@/components/widgets/bots';
import type { BotWidgetLayoutMap } from '@/features/bots/registry/types';

export interface WidgetInsertion {
  widget: BotWidgetType;
  after?: BotWidgetType;
  condition?: boolean;
}

export interface InheritWidgetListOptions {
  insert?: WidgetInsertion[];
  exclude?: BotWidgetType[];
  unique?: boolean;
}

const shouldInsert = (insertion: WidgetInsertion | undefined): boolean => {
  if (!insertion) {
    return false;
  }

  if (typeof insertion.condition === 'boolean') {
    return insertion.condition;
  }

  return true;
};

export const inheritWidgetList = (
  base: BotWidgetType[],
  options: InheritWidgetListOptions = {}
): BotWidgetType[] => {
  const { insert = [], exclude = [], unique = true } = options;
  const exclusions = new Set(exclude);

  const filteredBase: BotWidgetType[] = base.filter(
    (widget) => !exclusions.has(widget)
  );

  const pendingInsertions = insert.filter(shouldInsert);

  if (pendingInsertions.length === 0) {
    return unique ? Array.from(new Set(filteredBase)) : [...filteredBase];
  }

  const list: BotWidgetType[] = [...filteredBase];

  for (const insertion of pendingInsertions) {
    const alreadyPresent = list.includes(insertion.widget);
    if (alreadyPresent && unique) {
      continue;
    }

    if (insertion.after) {
      const index = list.indexOf(insertion.after);
      if (index >= 0) {
        list.splice(index + 1, 0, insertion.widget);
        continue;
      }
    }

    list.push(insertion.widget);
  }

  return unique ? Array.from(new Set(list)) : list;
};

export const deriveLayoutMap = (
  base: BotWidgetLayoutMap,
  overrides: Partial<BotWidgetLayoutMap> = {}
): BotWidgetLayoutMap => {
  const result: BotWidgetLayoutMap = {};

  for (const [widget, layout] of Object.entries(base)) {
    result[widget as BotWidgetType] = {
      mobile: { ...layout.mobile },
      tablet: { ...layout.tablet },
      desktop: { ...layout.desktop },
    };
  }

  for (const [widget, layout] of Object.entries(overrides)) {
    if (!layout) {
      continue;
    }

    result[widget as BotWidgetType] = {
      mobile: { ...layout.mobile },
      tablet: { ...layout.tablet },
      desktop: { ...layout.desktop },
    };
  }

  return result;
};
