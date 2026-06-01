import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import React from 'react';
import { useLongPress } from '../../hooks/useLongPress';
import { cn } from '../../lib/utils';
import { useBottomNavStore, type NavItem } from '../../stores/bottomNavStore';

interface SortableNavItemProps {
  item: NavItem;
  isActive: boolean;
  isPressed: boolean;
  showRemoveButton?: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  children?: React.ReactNode;
}

export const SortableNavItem: React.FC<SortableNavItemProps> = ({
  item,
  isActive,
  isPressed,
  showRemoveButton = false,
  onClick,
  onLongPress,
  children,
}) => {
  const { removeFromActiveNav } = useBottomNavStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: item.id === 'more', // Don't allow dragging the More button
  });

  // Long press for customization
  const longPressProps = useLongPress({
    onLongPress: () => {
      if (onLongPress) {
        onLongPress();
      }
    },
    onClick: () => {
      onClick();
    },
    delay: 500,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.id !== 'more') {
      removeFromActiveNav(item.id);
    }
  };

  const Icon = item.icon;

  if (children) {
    // Custom content (used for special cases like bots menu)
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative flex flex-col items-center justify-center min-w-0 py-2 px-2 rounded-xl transition-all duration-200 cursor-pointer touch-manipulation',
          'hover:bg-muted/50 active:bg-muted hover:scale-105 active:scale-95',
          isActive && 'bg-primary/10 text-primary shadow-sm',
          isPressed && 'scale-95',
          isPressed && isActive ? 'bg-primary/20' : isPressed && 'bg-muted',
          isDragging && 'opacity-50 z-50',
          item.id !== 'more' && 'cursor-grab active:cursor-grabbing',
          'group'
        )}
        {...longPressProps}
        {...(item.id !== 'more' ? listeners : {})}
        {...(item.id !== 'more' ? attributes : {})}
      >
        {/* Remove button */}
        {showRemoveButton && item.id !== 'more' && (
          <button
            onClick={handleRemove}
            onTouchEnd={handleRemove}
            className={cn(
              'absolute -top-1 -right-1 w-5 h-5 aspect-square shrink-0 bg-destructive hover:bg-destructive/80 text-white rounded-full',
              'flex items-center justify-center transition-all duration-200',
              'hover:scale-110 active:scale-95 z-10 touch-manipulation'
            )}
          >
            <X className="w-3 h-3 shrink-0" />
          </button>
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex flex-col items-center justify-center min-w-0 py-2 px-2 rounded-xl transition-all duration-200 cursor-pointer touch-manipulation',
        'hover:scale-105 active:scale-95',
        isActive
          ? 'text-primary bg-primary/10 shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        isPressed && 'scale-95',
        isPressed && isActive ? 'bg-primary/20' : isPressed && 'bg-muted/70',
        isDragging && 'opacity-50 z-50',
        item.id !== 'more' && 'cursor-grab active:cursor-grabbing',
        'group'
      )}
      {...longPressProps}
      {...(item.id !== 'more' ? listeners : {})}
      {...(item.id !== 'more' ? attributes : {})}
    >
      {/* Remove button */}
      {showRemoveButton && item.id !== 'more' && (
        <button
          onClick={handleRemove}
          onTouchEnd={handleRemove}
          className={cn(
            'absolute -top-1 -right-1 w-5 h-5 aspect-square shrink-0 bg-destructive hover:bg-destructive/80 text-white rounded-full',
            'flex items-center justify-center transition-all duration-200',
            'hover:scale-110 active:scale-95 z-10 touch-manipulation'
          )}
        >
          <X className="w-3 h-3 shrink-0" />
        </button>
      )}

      <div
        className={cn(
          'w-6 h-6 mb-0.5 flex items-center justify-center transition-all duration-200 rounded-lg',
          'group-hover:scale-110 group-active:scale-95',
          isActive &&
            'bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-sm',
          isPressed && 'animate-bounce'
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4 transition-colors duration-200',
            isActive
              ? 'text-white drop-shadow-sm'
              : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
      </div>
      <span
        className={cn(
          'text-xs font-medium truncate transition-colors duration-200',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground group-hover:text-foreground'
        )}
      >
        {item.label}
      </span>
    </div>
  );
};
