import { useDraggable } from '@dnd-kit/core';
import React from 'react';
import { cn } from '../../lib/utils';
import type { NavItem } from '../../stores/bottomNavStore';

interface DraggableNavItemProps {
  item: NavItem;
  isDragging?: boolean;
}

export const DraggableNavItem: React.FC<DraggableNavItemProps> = ({
  item,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingFromHook,
  } = useDraggable({
    id: item.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isCurrentlyDragging = isDragging || isDraggingFromHook;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col items-center justify-center p-sm rounded-xl border transition-all duration-200 select-none group',
        'bg-gradient-to-br from-card to-muted/20 border-border/50',
        'hover:scale-105 hover:shadow-md hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10',
        'active:scale-95 active:shadow-sm active:border-primary/50 active:bg-gradient-to-br active:from-primary/10 active:to-primary/20',
        isCurrentlyDragging && 'opacity-50 scale-110 shadow-xl z-50 rotate-2'
      )}
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing touch-none w-full h-full flex flex-col items-center justify-center"
        style={{ touchAction: 'none' }}
      >
        <div
          className={cn(
            'w-8 h-8 mb-2 flex items-center justify-center rounded-lg transition-all duration-200',
            'bg-muted/30 group-hover:bg-primary/10 group-active:bg-primary/20',
            'group-hover:scale-110 group-active:scale-95',
            isCurrentlyDragging && 'animate-pulse'
          )}
        >
          {React.createElement(item.icon, {
            className: cn(
              'w-5 h-5 transition-all duration-200',
              'text-muted-foreground group-hover:text-primary group-active:text-primary',
              isCurrentlyDragging && 'text-primary animate-bounce'
            ),
          })}
        </div>
        <span
          className={cn(
            'text-xs font-medium text-center leading-tight max-w-full truncate transition-colors duration-200',
            'text-muted-foreground group-hover:text-foreground group-active:text-foreground',
            isCurrentlyDragging && 'text-primary font-semibold'
          )}
        >
          {item.label}
        </span>
      </div>
    </div>
  );
};
