import React from 'react';
import {
  WidgetWrapper,
  type WidgetMetadata,
  type WidgetMenuActions,
} from '../WidgetWrapper';

/**
 * Example widget component demonstrating keyboard shortcut integration
 */
export const ExampleWidget: React.FC<{
  widgetId: string;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
}> = ({ widgetId, onDelete, onDuplicate, onSettings }) => {
  const metadata: WidgetMetadata = {
    id: widgetId,
    type: 'example',
    title: 'Example Widget',
    hasOptions: Boolean(onSettings),
  };

  const menuActions: WidgetMenuActions = {
    ...(onDelete && { onDelete }),
    ...(onDuplicate && { onDuplicate }),
    ...(onSettings && { onOptions: onSettings }),
  };

  return (
    <WidgetWrapper
      metadata={metadata}
      isEditable={true}
      menuActions={menuActions}
      registry="dashboard"
    >
      <div className="p-md text-center">
        <h3 className="text-lg font-semibold mb-2">Example Widget</h3>
        <p className="text-muted-foreground mb-4">
          Click to select this widget and try keyboard shortcuts:
        </p>
        <div className="space-y-xs text-sm text-left max-w-md mx-auto">
          <div className="flex justify-between">
            <span>Settings:</span>
            <code className="bg-muted px-2 py-1 rounded">⌘+O</code>
          </div>
          <div className="flex justify-between">
            <span>Duplicate:</span>
            <code className="bg-muted px-2 py-1 rounded">⌘+D</code>
          </div>
          <div className="flex justify-between">
            <span>Refresh:</span>
            <code className="bg-muted px-2 py-1 rounded">⌘+R</code>
          </div>
          <div className="flex justify-between">
            <span>Delete:</span>
            <code className="bg-muted px-2 py-1 rounded">⌘+⌫</code>
          </div>
          <div className="flex justify-between">
            <span>Fullscreen:</span>
            <code className="bg-muted px-2 py-1 rounded">⌘+F</code>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Triple-click to toggle fullscreen mode
        </p>
      </div>
    </WidgetWrapper>
  );
};

export default ExampleWidget;
