import ShortcutChip from '@/components/common/ShortcutChip';
import NewBotWizard from '@/components/wizards/NewBotWizard';
import { IS_CLOUD } from '@/config/mode';
import { SHORTCUT_IDS } from '@/config/shortcuts';
import { Copy, Plus, Repeat, Link2 } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetWrapper from '../WidgetWrapper';
import { getWidgetMetadata } from './index';

export interface OverviewQuickActionsProps {
  widgetId?: string;
  isEditable?: boolean;
  isCollapsible?: boolean;
  allowResize?: boolean;
  height?: string | number;
  onRemove?: () => void;
  onSettings?: () => void;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: import('../WidgetWrapper').WidgetMenuActions;
  /** Render without the standard WidgetWrapper header chrome. */
  noWrapper?: boolean;
}

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  /** Shortcut id from SHORTCUT_IDS — rendered as a ShortcutChip. */
  shortcutId?: string;
  variant?: 'primary' | 'default';
  onClick: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  label,
  shortcutId,
  variant = 'default',
  onClick,
}) => {
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between gap-sm rounded-xl px-sm py-sm text-left transition-colors ${
        isPrimary
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-muted text-foreground hover:bg-muted/70'
      }`}
    >
      <span className="flex min-w-0 items-center gap-sm">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            isPrimary
              ? 'bg-white/15 text-primary-foreground'
              : 'bg-card text-muted-foreground'
          }`}
        >
          {icon}
        </span>
        <span className="truncate text-sm font-medium">{label}</span>
      </span>
      {shortcutId && (
        <ShortcutChip id={shortcutId} muted className="shrink-0" />
      )}
    </button>
  );
};

export const OverviewQuickActions: React.FC<OverviewQuickActionsProps> = ({
  widgetId = 'overview-quick-actions',
  isEditable = false,
  isCollapsible = false,
  allowResize = true,
  height = 'auto',
  onRemove,
  onSettings,
  onCollapse,
  onTabMove,
  menuActions,
  noWrapper = false,
}) => {
  const navigate = useNavigate();
  const [showNewBotWizard, setShowNewBotWizard] = React.useState(false);

  const handleCreateBot = () => setShowNewBotWizard(true);
  const handleNewTrade = () => navigate('/terminal');
  const handleConnectExchange = () => navigate('/exchanges');
  // Cloud-only — the Market Screener Strategies tab is gated behind
  // `IS_CLOUD` (curated presets are a cloud feature), so don't surface
  // a dead link in OSS builds.
  const handleCopyStrategy = () => navigate('/market-screener?view=strategies');

  const content = (
    <div className="flex h-full flex-col gap-xs p-md">
      <ActionRow
        icon={<Plus size={14} />}
        label="Create bot"
        shortcutId={SHORTCUT_IDS.NewDcaBot}
        variant="primary"
        onClick={handleCreateBot}
      />
      <ActionRow
        icon={<Repeat size={14} />}
        label="New trade"
        shortcutId={SHORTCUT_IDS.NavTradingTerminal}
        onClick={handleNewTrade}
      />
      <ActionRow
        icon={<Link2 size={14} />}
        label="Connect exchange"
        shortcutId={SHORTCUT_IDS.NavExchanges}
        onClick={handleConnectExchange}
      />
      {IS_CLOUD && (
        <ActionRow
          icon={<Copy size={14} />}
          label="Copy a Strategy"
          onClick={handleCopyStrategy}
        />
      )}
    </div>
  );

  const widgetMetadata = getWidgetMetadata('overview-quick-actions');
  const cssHeight = typeof height === 'number' ? `${height}px` : height;
  const wrapperProps = {
    metadata: {
      ...widgetMetadata,
      id: widgetId,
    },
    isEditable,
    isCollapsible,
    allowResize,
    style: { height: cssHeight },
    ...(onRemove && { onRemove }),
    ...(onSettings && { onSettings }),
    ...(onCollapse && { onCollapse }),
    ...(onTabMove && { onTabMove }),
    ...(menuActions && { menuActions }),
  };

  return (
    <>
      {noWrapper ? (
        <div
          className="h-full overflow-hidden rounded-lg bg-card shadow-md"
          style={{ height: cssHeight }}
        >
          {content}
        </div>
      ) : (
        <WidgetWrapper {...wrapperProps}>{content}</WidgetWrapper>
      )}
      <NewBotWizard
        open={showNewBotWizard}
        onOpenChange={setShowNewBotWizard}
      />
    </>
  );
};

export default OverviewQuickActions;
