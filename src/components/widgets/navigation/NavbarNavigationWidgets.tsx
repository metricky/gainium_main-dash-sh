import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import {
  useNavigationWidgetsStore,
  type NavigationWidgetConfig,
} from '../../../stores/navigationWidgetsStore';
import FearGreedNavigationView from './FearGreedNavigationView';
import PortfolioValueNavigationView from './PortfolioValueNavigationView';
import ProfitOverTimeNavigationView from './ProfitOverTimeNavigationView';
import WatchlistNavigationView from './WatchlistNavigationView';

const SortableNavigationWidgetItem: React.FC<{
  widget: NavigationWidgetConfig;
}> = ({ widget }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderWidget = () => {
    switch (widget.type) {
      case 'watchlist':
        return <WatchlistNavigationView widgetId={widget.id} compact={true} />;
      case 'profit-over-time':
        return (
          <ProfitOverTimeNavigationView widgetId={widget.id} compact={true} />
        );
      case 'fear-greed-index':
        return <FearGreedNavigationView widgetId={widget.id} compact={true} />;
      case 'portfolio-value':
        return (
          <PortfolioValueNavigationView widgetId={widget.id} compact={true} />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="shrink-0"
    >
      {renderWidget()}
    </div>
  );
};

const NavbarNavigationWidgets: React.FC = () => {
  const { widgets, reorderWidgets } = useNavigationWidgetsStore();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((item) => item.id === active.id);
      const newIndex = widgets.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(widgets, oldIndex, newIndex);
      reorderWidgets(newOrder);
    }
  };

  return (
    <div className="flex justify-between items-center w-full">
      <div></div> {/* Left spacer */}
      {widgets.length > 0 && (
        <div className="flex items-center gap-xs overflow-x-auto scrollbar-hide">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map((widget) => widget.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex items-center gap-md flex-nowrap">
                {widgets.map((widget) => (
                  <SortableNavigationWidgetItem
                    key={widget.id}
                    widget={widget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
      <div></div> {/* Right spacer */}
    </div>
  );
};

export default NavbarNavigationWidgets;
