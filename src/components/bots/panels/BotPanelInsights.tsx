import { useCallback, useMemo, type ReactNode } from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type SubtabItem,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { PanelContainer, type PanelContentConfig } from './PanelContainer';

/** Subtab configuration for Chrome-style tab groups */
export interface BotPanelInsightsSubtab extends PanelContentConfig {
  key: string;
  /** Whether this subtab is enabled (default: true) */
  enabled?: boolean;
}

export interface BotPanelInsightsTab extends PanelContentConfig {
  key: string;
  /** Whether this tab is enabled (default: true) */
  enabled?: boolean;
  /** Optional subtabs for Chrome-style tab groups */
  subtabs?: BotPanelInsightsSubtab[];
}

export interface BotPanelInsightsProps {
  tabs: BotPanelInsightsTab[];
  defaultTab?: string;
  /** Controlled active tab (overrides defaultTab when provided) */
  value?: string;
  /** Optional actions rendered to the right of the tab list. */
  actions?: ReactNode;
  /** Class override for the outer insights container. */
  containerClassName?: string;
  /** Callback when active tab changes */
  onTabChange?: (tabKey: string) => void;
}

export function BotPanelInsights({
  tabs,
  defaultTab,
  value,
  actions,
  containerClassName,
  onTabChange,
}: BotPanelInsightsProps) {
  // Filter to only enabled tabs
  const enabledTabs = useMemo(
    () => tabs.filter((tab) => tab.enabled !== false),
    [tabs]
  );

  // Build subtabs map for TabsList
  const subtabsMap = useMemo(() => {
    const map: Record<string, SubtabItem[]> = {};
    enabledTabs.forEach((tab) => {
      if (tab.subtabs && tab.subtabs.length > 0) {
        const enabledSubtabs = tab.subtabs.filter((st) => st.enabled !== false);
        if (enabledSubtabs.length > 0) {
          map[tab.key] = enabledSubtabs.map((st) => ({
            value: st.key,
            label: st.title,
            disabled: st.enabled === false,
          }));
        }
      }
    });
    return Object.keys(map).length > 0 ? map : undefined;
  }, [enabledTabs]);

  // Flatten all tab contents (main tabs + subtabs) for rendering TabsContent
  const allTabContents = useMemo(() => {
    const contents: Array<{
      key: string;
      content: ReactNode;
      bodyClassName?: string;
    }> = [];
    enabledTabs.forEach((tab) => {
      contents.push({
        key: tab.key,
        content: tab.content,
        bodyClassName: tab.bodyClassName,
      });
      if (tab.subtabs) {
        tab.subtabs
          .filter((st) => st.enabled !== false)
          .forEach((st) => {
            contents.push({
              key: st.key,
              content: st.content,
              bodyClassName: st.bodyClassName,
            });
          });
      }
    });
    return contents;
  }, [enabledTabs]);

  // Track tab changes via callback if provided
  const handleTabChange = useCallback(
    (value: string) => {
      if (onTabChange) {
        onTabChange(value);
      }
    },
    [onTabChange]
  );

  if (!enabledTabs.length) {
    return null;
  }

  return (
    <PanelContainer
      paddinglessBody
      containerClassName={cn('min-h-[220px]', containerClassName)}
      bodyClassName="flex flex-col"
      content={
        <Tabs
          // Use controlled value when provided, otherwise fall back to defaultValue
          {...(value !== undefined
            ? { value }
            : { defaultValue: defaultTab ?? enabledTabs[0]?.key })}
          onValueChange={handleTabChange}
          className="flex h-full flex-col"
        >
          <div className="flex items-center gap-sm px-sm py-xs">
            <div className="rounded-md bg-card p-1.5">
              <TabsList fullWidth={false} subtabs={subtabsMap}>
                {enabledTabs.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key}>
                    <span>{tab.title}</span>
                    {tab.badge && <span className="ml-2">{tab.badge}</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {actions ? (
              <div className="ml-auto flex items-center gap-xs text-sm text-muted-foreground">
                {actions}
              </div>
            ) : null}
          </div>
          <div className="flex-1 overflow-hidden px-sm py-sm">
            {allTabContents.map((tab) => (
              <TabsContent
                key={tab.key}
                value={tab.key}
                className="mt-0 h-full"
              >
                <div className={cn('h-full overflow-auto', tab.bodyClassName)}>
                  {tab.content}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      }
    />
  );
}
