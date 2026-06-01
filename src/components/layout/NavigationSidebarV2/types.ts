export type SecondaryPanel =
  | 'dashboards'
  | 'more'
  | 'help'
  | 'trading'
  | 'dcaBots'
  | 'comboBots'
  | 'gridBots'
  | 'portfolio'
  | 'backtesting'
  | 'rulebooks'
  | 'journal'
  | 'reports';

export interface NavigationGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  hasSecondaryPanel?: boolean;
  panelType?: SecondaryPanel;
  badge?: {
    text: string;
    variant?: 'default' | 'pro' | 'beta';
  };
}
