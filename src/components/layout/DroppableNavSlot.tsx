import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, X } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { useBottomNavStore, type NavItem } from '../../stores/bottomNavStore';

interface DroppableNavSlotProps {
  id: string;
  item?: NavItem;
  isEmpty?: boolean;
  isActive?: boolean;
  isDragging?: boolean;
}

export const DroppableNavSlot: React.FC<DroppableNavSlotProps> = ({
  id,
  item,
  isEmpty = false,
  isActive = false,
  isDragging = false,
}) => {
  const { removeFromActiveNav } = useBottomNavStore();

  // Always call hooks at the top level
  const { isOver: emptyDroppableOver, setNodeRef: setEmptyDroppableRef } =
    useDroppable({
      id: isEmpty ? id : `empty-${id}`,
      disabled: !isEmpty,
    });

  const { isOver: activeDroppableOver, setNodeRef: setActiveDroppableRef } =
    useDroppable({
      id: isActive && item ? id : `active-${id}`,
      disabled: !isActive || !item,
    });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: item?.id || id,
    disabled: !isActive || !item,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item && item.id !== 'more') {
      removeFromActiveNav(item.id);
    }
  };

  // CASE 1: Empty slot - only droppable
  if (isEmpty) {
    return (
      <div
        ref={setEmptyDroppableRef}
        className={cn(
          'flex flex-col items-center justify-center min-w-0 py-2 px-2 h-16 border-2 border-dashed rounded-xl transition-all duration-200',
          emptyDroppableOver
            ? 'border-primary bg-primary/10 scale-105 shadow-lg animate-pulse'
            : 'border-muted-foreground/30 hover:border-muted-foreground/50',
          'group'
        )}
        style={{ minHeight: '4rem', minWidth: '4rem' }}
      >
        <Plus
          className={cn(
            'w-4 h-4 transition-all duration-200',
            emptyDroppableOver
              ? 'text-primary scale-110'
              : 'text-muted-foreground/50 group-hover:text-muted-foreground/70'
          )}
        />
        <span
          className={cn(
            'text-xs mt-1 transition-colors duration-200',
            emptyDroppableOver
              ? 'text-primary font-medium'
              : 'text-muted-foreground/50 group-hover:text-muted-foreground/70'
          )}
        >
          Empty
        </span>
      </div>
    );
  }

  if (!item) return null;

  // CASE 2: Active item - sortable and droppable
  if (isActive) {
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const isCurrentlyDragging = isDragging || isSortableDragging;

    // Combine both refs
    const combineRefs = (node: HTMLElement | null) => {
      setActiveDroppableRef(node);
      setSortableRef(node);
    };

    return (
      <div
        ref={combineRefs}
        style={style}
        className={cn(
          'relative flex flex-col items-center justify-center min-w-0 py-2 px-2 rounded-xl transition-all duration-200',
          isCurrentlyDragging && 'opacity-50 scale-110 rotate-1 z-10',
          activeDroppableOver && 'ring-2 ring-primary ring-offset-2 scale-105',
          'bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30 shadow-sm',
          'touch-none select-none group'
        )}
      >
        {/* Remove button */}
        {item.id !== 'more' && (
          <button
            onClick={handleRemove}
            className={cn(
              'absolute -top-1 -right-1 w-5 h-5 aspect-square shrink-0 bg-destructive hover:bg-destructive/80 text-white rounded-full',
              'flex items-center justify-center transition-all duration-200',
              'hover:scale-110 active:scale-95 z-20'
            )}
          >
            <X className="w-3 h-3 shrink-0" />
          </button>
        )}

        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full cursor-grab active:cursor-grabbing',
            'hover:scale-105 active:scale-95'
          )}
        >
          <div
            className={cn(
              'w-8 h-8 mb-1 flex items-center justify-center rounded-lg transition-all duration-200',
              'bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110',
              isCurrentlyDragging && 'animate-pulse'
            )}
          >
            {React.createElement(item.icon, {
              className: cn(
                'w-5 h-5 transition-all duration-200 text-primary group-hover:scale-110',
                isCurrentlyDragging && 'animate-bounce'
              ),
            })}
          </div>
          <span
            className={cn(
              'text-xs font-medium text-center leading-tight transition-colors duration-200 max-w-full truncate',
              'text-primary font-semibold',
              isCurrentlyDragging && 'text-primary'
            )}
          >
            {item.label}
          </span>
        </div>
      </div>
    );
  }

  // CASE 3: Non-active item - just display
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center min-w-0 py-2 px-2 rounded-xl transition-all duration-200',
        'bg-gradient-to-br from-muted/20 to-muted/40 border border-border/50',
        'group'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 mb-1 flex items-center justify-center rounded-lg transition-all duration-200',
          'bg-muted/30'
        )}
      >
        {React.createElement(item.icon, {
          className:
            'w-5 h-5 transition-all duration-200 text-muted-foreground',
        })}
      </div>
      <span
        className={cn(
          'text-xs font-medium text-center leading-tight transition-colors duration-200 max-w-full truncate',
          'text-muted-foreground'
        )}
      >
        {item.label}
      </span>
    </div>
  );
};
