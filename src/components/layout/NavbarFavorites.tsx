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
import { TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';
import {
  useFavoritesStore,
  type FavoriteCoin,
} from '../../stores/favoritesStore';
import { Badge } from '../ui/badge';
import CoinIcon from '../widgets/shared/CoinIcon';

const SortableNavbarFavoriteItem: React.FC<{ coin: FavoriteCoin }> = ({
  coin,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: coin.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPositive = (coin.change24h || 0) > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-0.5 shrink-0 cursor-pointer hover:bg-accent/50 px-1.5 py-1 rounded transition-all duration-200 hover:scale-105 min-w-[60px]"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1 justify-center">
        <CoinIcon symbol={coin.symbol} size="w-3 h-3" />
        <span className="font-medium text-xs">{coin.symbol}</span>
      </div>

      <div className="text-xs font-medium text-center">
        $
        {coin.price.toLocaleString('en-US', {
          minimumFractionDigits: coin.price < 1 ? 4 : 0,
          maximumFractionDigits: coin.price < 1 ? 4 : 0,
        })}
      </div>

      <Badge
        variant={isPositive ? 'default' : 'destructive'}
        className={`text-xs px-1 py-0 h-auto self-center ${
          isPositive
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-red-100 text-red-700 border-red-200'
        }`}
      >
        {isPositive ? (
          <TrendingUp className="w-2 h-2 mr-0.5" />
        ) : (
          <TrendingDown className="w-2 h-2 mr-0.5" />
        )}
        {isPositive ? '+' : ''}
        {(coin.change24h || 0).toFixed(1)}%
      </Badge>
    </div>
  );
};

const NavbarFavorites: React.FC = () => {
  const { favorites, reorderFavorites } = useFavoritesStore();

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
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
      const oldIndex = favorites.findIndex((item) => item.id === active.id);
      const newIndex = favorites.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(favorites, oldIndex, newIndex);
      reorderFavorites(newOrder);
    }
  };

  const displayFavorites = favorites.slice(0, 6);

  return (
    <div className="flex justify-between items-center w-full">
      <div></div> {/* Left spacer */}
      {favorites.length > 0 ? (
        <div className="flex items-center gap-xs overflow-x-auto scrollbar-hide">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayFavorites.map((coin) => coin.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex items-center gap-xs flex-nowrap">
                {displayFavorites.map((coin) => (
                  <SortableNavbarFavoriteItem key={coin.id} coin={coin} />
                ))}
                {favorites.length > 6 && (
                  <div className="text-xs text-muted-foreground shrink-0 px-2 whitespace-nowrap">
                    +{favorites.length - 6} more
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div></div>
      )}
      <div></div> {/* Right spacer */}
    </div>
  );
};

export default NavbarFavorites;
