// Hardcoded descriptions + grouping for the compose services shipped in
// docker-sh. Used by the Services tab to render human-readable labels
// instead of just container names, and to group related services so the
// 17-row list isn't a flat wall of cards.
//
// Keep service keys in sync with docker-sh/docker-compose.yml's service
// names (the `com.docker.compose.service` label).
//
// Anything we don't recognize falls back to the "Other" group with no
// description.

export type ServiceCategory =
  | 'infrastructure'
  | 'connectors'
  | 'bots'
  | 'platform'
  | 'frontend'
  | 'admin'
  | 'other';

export interface ServiceMeta {
  /** Friendly label. Defaults to the service name if undefined. */
  label?: string;
  /** One-sentence description shown under the service name. */
  description: string;
  /** Group the service belongs to. */
  category: ServiceCategory;
  /** When true, hide the Stop button — stopping these breaks the rest of
   *  the stack so the operator has to do it manually if they really mean
   *  it (e.g. via `docker compose stop mongo`). */
  hideStop?: boolean;
  /** When true, hide the service from the admin UI entirely. Used for
   *  one-shot utility containers (e.g. cli-runner) that aren't long-
   *  running and have no useful actions in this view. */
  hidden?: boolean;
}

export const SERVICE_CATALOG: Record<string, ServiceMeta> = {
  // ---------------------------------------------------------------- Infra
  mongo: {
    label: 'MongoDB',
    description: 'Primary database — stores bots, deals, user accounts, and history.',
    category: 'infrastructure',
    hideStop: true,
  },
  redis: {
    label: 'Redis',
    description: 'Cache + pub/sub bus used by every service. Stopping it cascades.',
    category: 'infrastructure',
    hideStop: true,
  },
  rabbit: {
    label: 'RabbitMQ',
    description: 'Message broker for inter-service work queues (candle requests, bot triggers).',
    category: 'infrastructure',
    hideStop: true,
  },

  // ----------------------------------------------------------- Connectors
  'exchange-connector': {
    label: 'Exchange Connector',
    description: 'REST adapter that translates Gainium API calls into per-exchange HTTP requests.',
    category: 'connectors',
  },
  'user-update-connector': {
    label: 'User Stream',
    description: 'WebSocket subscriber for account-level events: balances, fills, position changes.',
    category: 'connectors',
  },
  'price-connector': {
    label: 'Price Stream',
    description: 'WebSocket subscriber for ticker/candle data across all enabled exchanges.',
    category: 'connectors',
  },
  'paper-trading': {
    label: 'Paper Trading',
    description: 'Simulates exchange order flow for bots running in paper mode.',
    category: 'connectors',
  },

  // ----------------------------------------------------------------- Bots
  'bots-dca': {
    label: 'DCA Bots',
    description: 'Runner for DCA (dollar-cost-averaging) bots.',
    category: 'bots',
  },
  'bots-grid': {
    label: 'Grid Bots',
    description: 'Runner for grid-trading bots.',
    category: 'bots',
  },
  'bots-combo': {
    label: 'Combo Bots',
    description: 'Runner for combo bots (DCA + grid hybrids).',
    category: 'bots',
  },
  'bots-hedge-dca': {
    label: 'Hedge DCA Bots',
    description: 'Runner for delta-hedged DCA bots.',
    category: 'bots',
  },
  'bots-hedge-combo': {
    label: 'Hedge Combo Bots',
    description: 'Runner for delta-hedged combo bots.',
    category: 'bots',
  },

  // ------------------------------------------------------------- Platform
  api: {
    label: 'API',
    description: 'GraphQL API — the dashboard talks here for everything.',
    category: 'platform',
    hideStop: true,
  },
  stream: {
    label: 'Live Stream',
    description: 'WebSocket fan-out to the dashboard for real-time bot/deal updates.',
    category: 'platform',
  },
  indicators: {
    label: 'Indicators',
    description: 'Computes technical indicators (RSI, MACD, custom) for bots and the screener.',
    category: 'platform',
  },
  cron: {
    label: 'Cron',
    description: 'Scheduled maintenance: stats rollups, stale-data cleanup, periodic checks.',
    category: 'platform',
  },
  backtest: {
    label: 'Backtest',
    description: 'Strategy backtesting engine. Only runs when a backtest is queued.',
    category: 'platform',
  },
  'cli-runner': {
    label: 'CLI Runner',
    description: 'One-shot utility container for admin CLI commands (password reset, etc.).',
    category: 'platform',
    hidden: true,
  },

  // -------------------------------------------------------------- Frontend
  frontend: {
    label: 'Frontend',
    description: 'nginx serving the dashboard SPA. Public-facing on the host port.',
    category: 'frontend',
  },

  // ------------------------------------------------------------------ Admin
  'admin-sh': {
    label: 'Admin API',
    description: 'This service. Container actions, exchange config, and image upgrades.',
    category: 'admin',
    hideStop: true,
  },
};

export const CATEGORY_ORDER: ServiceCategory[] = [
  'platform',
  'connectors',
  'bots',
  'infrastructure',
  'frontend',
  'admin',
  'other',
];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  platform: 'Platform',
  connectors: 'Connectors',
  bots: 'Bots',
  infrastructure: 'Infrastructure',
  frontend: 'Frontend',
  admin: 'Admin',
  other: 'Other',
};

export function getMeta(service: string): ServiceMeta {
  return (
    SERVICE_CATALOG[service] ?? {
      description: '',
      category: 'other',
    }
  );
}
