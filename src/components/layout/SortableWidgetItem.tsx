import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { getWidgetDisplayName } from '../../utils/widgetUtils';
import { getWidgetIcon } from './widgetIconsRegistry';

interface SortableWidgetItemProps {
  widget: {
    id: string;
    type: string;
    title: string;
    layoutData?: { w: number; h: number }; // Optional for navigation widgets
    hasOptions?: boolean;
  };
  onOptions: (widgetId: string) => void;
  onRemove: (widgetId: string) => void;
}

export const SortableWidgetItem: React.FC<SortableWidgetItemProps> = ({
  widget,
  onOptions,
  onRemove,
}) => {
  // Get the current display name (handles custom titles and dynamic names)
  const [displayName, setDisplayName] = useState(() =>
    getWidgetDisplayName(widget)
  );

  // Update display name when widget settings change
  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Only update if this is our widget
      if (customEvent.detail?.widgetId === widget.id) {
        setDisplayName(getWidgetDisplayName(widget));
      }
    };

    window.addEventListener('widgetSettingsChanged', handleSettingsChange);
    return () => {
      window.removeEventListener('widgetSettingsChanged', handleSettingsChange);
    };
  }, [widget]);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get the widget icon component
  const IconComponent = useRef(getWidgetIcon(widget.type));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-sm rounded-md bg-inner-container border-2 border-border shadow-sm"
    >
      <div className="flex items-center gap-sm flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-muted/80 cursor-grab active:cursor-grabbing touch-manipulation"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {/* Widget Icon */}
        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-card/50 p-0">
          <IconComponent.current className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-card-foreground truncate">
            {displayName}
          </div>
          {widget.layoutData && (
            <div className="text-xs text-muted-foreground">
              {widget.layoutData.w} × {widget.layoutData.h}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {/* Options button - only show if widget has options */}
        {widget.hasOptions && (
          <button
            onClick={() => onOptions(widget.id)}
            className="p-xs rounded hover:bg-muted/80 hover:text-foreground transition-colors touch-manipulation"
            title="Widget Options"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
        {/* Remove button */}
        <button
          onClick={() => onRemove(widget.id)}
          className="p-xs rounded hover:bg-destructive/20 hover:text-destructive transition-colors touch-manipulation"
          title="Remove Widget"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
