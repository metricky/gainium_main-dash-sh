import type { Layout } from 'react-grid-layout';
import type { WidgetConfig } from './dashboardStore';

export type DashboardTemplateCategory =
  | 'trading'
  | 'analysis'
  | 'portfolio'
  | 'market'
  | 'custom';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: DashboardTemplateCategory;
  preview?: string;
  widgets: WidgetConfig[];
  layout: Layout[];
  tags: string[];
}

/**
 * Helper: keep widget + layout entries in sync. Each template lists
 * `[type, x, y, w, h]` tuples and we generate both arrays from them so
 * the two never drift.
 */
type TemplateWidgetSpec = [type: string, x: number, y: number, w: number, h: number];

const buildTemplate = (
  meta: Omit<DashboardTemplate, 'widgets' | 'layout'>,
  specs: TemplateWidgetSpec[]
): DashboardTemplate => {
  const widgets: WidgetConfig[] = specs.map(([type, x, y, w, h]) => ({
    id: type,
    type,
    title: '',
    layoutData: { i: type, x, y, w, h },
    settings: {},
  }));
  const layout: Layout[] = specs.map(([type, x, y, w, h]) => ({
    i: type,
    x,
    y,
    w,
    h,
  }));
  return { ...meta, widgets, layout };
};

/**
 * Core dashboard templates. Every widget type referenced here MUST be
 * present in core's `WIDGET_REGISTRY` so the templates render correctly
 * in both sh (open-source) and cloud builds. Cloud adds extra templates
 * via `registerDashboardTemplates()` at boot — see `src/main.tsx`.
 */
export const DEFAULT_DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  buildTemplate(
    {
      id: 'portfolio',
      name: 'Portfolio Overview',
      description:
        'Big-picture portfolio: value, profit, allocation, and balances at a glance.',
      category: 'portfolio',
      tags: ['portfolio', 'overview', 'starter'],
    },
    [
      ['portfolio-value', 0, 0, 4, 3],
      ['profit', 4, 0, 4, 3],
      ['accumulated-profit', 8, 0, 4, 3],
      ['portfolio-allocation', 0, 3, 6, 5],
      ['portfolio-balances', 6, 3, 6, 5],
    ]
  ),
  buildTemplate(
    {
      id: 'trading',
      name: 'Trading Desk',
      description:
        'Active-trading layout with chart, watchlist, latest orders, and quick actions.',
      category: 'trading',
      tags: ['trading', 'charts', 'orders'],
    },
    [
      ['coin-chart', 0, 0, 8, 6],
      ['watchlist', 8, 0, 4, 6],
      ['latest-orders', 0, 6, 8, 4],
      ['overview-quick-actions', 8, 6, 4, 4],
    ]
  ),
  buildTemplate(
    {
      id: 'bots',
      name: 'Bot Performance',
      description:
        'Monitor running bots, deal allocation, and detailed bot statistics.',
      category: 'trading',
      tags: ['bots', 'performance', 'deals'],
    },
    [
      ['bot-status', 0, 0, 6, 4],
      ['treemap-deals', 6, 0, 6, 4],
      ['bot-stats-advanced', 0, 4, 12, 5],
      ['latest-orders', 0, 9, 12, 4],
    ]
  ),
  buildTemplate(
    {
      id: 'portfolio-deep-dive',
      name: 'Portfolio Deep Dive',
      description:
        'Analytical view: allocation, categories, exchange split, and full balances.',
      category: 'analysis',
      tags: ['portfolio', 'analysis', 'allocation'],
    },
    [
      ['portfolio-value', 0, 0, 6, 3],
      ['portfolio-allocation', 6, 0, 6, 3],
      ['portfolio-categories-analysis', 0, 3, 6, 4],
      ['portfolio-exchange-distribution', 6, 3, 6, 4],
      ['portfolio-balances', 0, 7, 12, 5],
    ]
  ),
  buildTemplate(
    {
      id: 'daily-briefing',
      name: 'Daily Briefing',
      description:
        'Start-the-day view: portfolio snapshot, market chart, news feed, and notes.',
      category: 'analysis',
      tags: ['news', 'overview', 'daily'],
    },
    [
      ['portfolio-value', 0, 0, 6, 3],
      ['overview-quick-actions', 6, 0, 6, 3],
      ['coin-chart', 0, 3, 8, 5],
      ['news-rss', 8, 3, 4, 5],
      ['notes', 0, 8, 12, 3],
    ]
  ),
  buildTemplate(
    {
      id: 'market',
      name: 'Market Watch',
      description:
        'Lightweight market view: live chart, watchlist, and a news ticker.',
      category: 'market',
      tags: ['market', 'watchlist', 'news'],
    },
    [
      ['coin-chart', 0, 0, 8, 6],
      ['watchlist', 8, 0, 4, 6],
      ['news-rss', 0, 6, 12, 4],
    ]
  ),
  buildTemplate(
    {
      id: 'minimal',
      name: 'Minimal',
      description:
        'A clean starting point — portfolio value, profit, and a watchlist.',
      category: 'portfolio',
      tags: ['minimal', 'starter'],
    },
    [
      ['portfolio-value', 0, 0, 6, 3],
      ['profit', 6, 0, 6, 3],
      ['watchlist', 0, 3, 12, 4],
    ]
  ),
];

// ---------------------------------------------------------------------------
// Template registry — mutable, host apps (e.g. cloud overlay) extend it
// at boot via `registerDashboardTemplates()`. Mirrors the widget-registry
// pattern in `components/widgets/dashboard/index.ts`.
// ---------------------------------------------------------------------------

const TEMPLATE_REGISTRY: DashboardTemplate[] = [...DEFAULT_DASHBOARD_TEMPLATES];

/**
 * Register additional dashboard templates at boot. Host apps with extra
 * templates call this from `main.tsx` before the first render. Sh ships
 * only the `DEFAULT_DASHBOARD_TEMPLATES` set; cloud adds entries that
 * use cloud-only widgets (screener, treemap-market, …).
 *
 * Duplicate IDs replace the existing entry so cloud can override a core
 * template when it wants a richer cloud-specific version.
 */
export function registerDashboardTemplates(
  extras: DashboardTemplate[]
): void {
  for (const template of extras) {
    const idx = TEMPLATE_REGISTRY.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      TEMPLATE_REGISTRY[idx] = template;
    } else {
      TEMPLATE_REGISTRY.push(template);
    }
  }
}

/**
 * Return every registered template (core + any host-app extras).
 * Use this from UI components instead of importing
 * `DEFAULT_DASHBOARD_TEMPLATES` directly so cloud's extras show up too.
 */
export function getAllDashboardTemplates(): DashboardTemplate[] {
  return TEMPLATE_REGISTRY;
}

export function getDashboardTemplate(
  id: string
): DashboardTemplate | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}
