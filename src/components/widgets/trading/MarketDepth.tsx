import React from 'react';
import WidgetWrapper, { type WidgetMenuActions } from '../WidgetWrapper';

export interface MarketDepthProps {
  widgetId?: string;
  isEditable?: boolean;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: WidgetMenuActions;
  data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

const MarketDepth: React.FC<MarketDepthProps> = ({
  widgetId = 'market-depth',
  isEditable = false,
  onCollapse,
  onTabMove,
  menuActions,
  data,
  settings: _settings,
}) => {
  return (
    <WidgetWrapper
      metadata={{
        id: widgetId,
        type: 'market-depth',
        title: 'Market Depth',
        hasOptions: false,
      }}
      isEditable={isEditable}
      {...(onCollapse && { onCollapse })}
      {...(onTabMove && { onTabMove })}
      {...(menuActions && { menuActions })}
    >
      <div className="h-full flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center border border-border rounded-lg">
          <div className="text-center space-y-xs">
            <h3 className="text-lg font-semibold text-foreground">
              Market Depth
            </h3>
            <p className="text-sm text-muted-foreground">
              Visual market depth chart with liquidity analysis
            </p>
            <div className="text-xs text-muted-foreground/80">
              Depth data:{' '}
              {data ? JSON.stringify(data).substring(0, 50) + '...' : 'No data'}
            </div>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default MarketDepth;
