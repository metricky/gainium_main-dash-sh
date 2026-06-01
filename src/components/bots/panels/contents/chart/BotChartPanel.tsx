import { useEffect } from 'react';

import BotChart, {
  type BotChartProps,
} from '@/components/widgets/bots/BotChart';
import { useBotChartDisplayOptions } from '@/components/widgets/bots/hooks/useBotChartDisplayOptions';

export interface BotChartPanelProps extends BotChartProps {
  className?: string;
}

const BotChartPanel = ({
  className,
  onPanelMenuChange,
  widgetId: incomingWidgetId,
  menuActions,
  variant: _variant,
  displayOptions: _displayOptions,
  ...restProps
}: BotChartPanelProps) => {
  const resolvedWidgetId = incomingWidgetId ?? 'bot-chart';

  const displayOptions = useBotChartDisplayOptions(resolvedWidgetId);

  useEffect(() => {
    if (!onPanelMenuChange) return;
    onPanelMenuChange(null);
    return () => {
      onPanelMenuChange(null);
    };
  }, [onPanelMenuChange]);

  return (
    <BotChart
      {...restProps}
      {...(menuActions ? { menuActions } : {})}
      widgetId={resolvedWidgetId}
      variant="panel"
      displayOptions={displayOptions}
      {...(onPanelMenuChange ? { onPanelMenuChange } : {})}
      {...(className ? { className } : {})}
    />
  );
};

BotChartPanel.displayName = 'BotChartPanel';

export default BotChartPanel;
