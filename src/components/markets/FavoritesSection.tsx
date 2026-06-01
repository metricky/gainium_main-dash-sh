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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrendingDown, TrendingUp, X } from 'lucide-react';
import React from 'react';
import {
  useFavoritesStore,
  type FavoriteCoin,
} from '../../stores/favoritesStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import CoinIcon from '../widgets/shared/CoinIcon';
import CoinSelector from './CoinSelector';

const MiniSparkline: React.FC<{
  data: number[];
  isPositive: boolean;
  className?: string;
}> = ({ data, isPositive, className = 'w-20 h-10' }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((max - value) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={className}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={isPositive ? 'var(--color-success)' : 'var(--color-loss)'}
          strokeWidth="2"
          points={points}
        />
      </svg>
    </div>
  );
};

const SortableFavoriteCard: React.FC<{
  coin: FavoriteCoin;
  onRemove: (id: string) => void;
}> = ({ coin, onRemove }) => {
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
    <Card
      ref={setNodeRef}
      style={style}
      className="relative group hover:shadow-md transition-shadow cursor-pointer"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-xs">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 w-3 h-3 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(coin.id);
          }}
        >
          <X className="h-2 w-2" />
        </Button>

        <div className="flex items-center gap-1.5 mb-1">
          <CoinIcon symbol={coin.symbol} size="w-4 h-4" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-xs truncate">{coin.pair}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-bold">
            $
            {coin.price.toLocaleString('en-US', {
              minimumFractionDigits: coin.price < 1 ? 4 : 0,
              maximumFractionDigits: coin.price < 1 ? 4 : 0,
            })}
          </div>
          <MiniSparkline
            data={coin.sparklineData}
            isPositive={isPositive}
            className="w-12 h-4"
          />
        </div>

        <div className="flex items-center justify-center">
          <Badge
            variant={isPositive ? 'default' : 'destructive'}
            className={`text-xs px-1 py-0 h-auto ${
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
      </CardContent>
    </Card>
  );
};

const FavoritesSection: React.FC = () => {
  const { favorites, removeFavorite, reorderFavorites } = useFavoritesStore();

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

  const handleRemoveFavorite = (id: string) => {
    removeFavorite(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex((item) => item.id === active.id);
      const newIndex = favorites.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(favorites, oldIndex, newIndex);
      reorderFavorites(newOrder);
    }
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Favorites</h2>
        <div className="flex items-center gap-sm">
          <Badge variant="secondary" className="text-xs">
            {favorites.length} coins
          </Badge>
          <CoinSelector />
        </div>
      </div>

      {favorites.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={favorites.map((coin) => coin.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-xs">
              {favorites.map((coin) => (
                <SortableFavoriteCard
                  key={coin.id}
                  coin={coin}
                  onRemove={handleRemoveFavorite}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="p-xl text-center">
            <div className="text-muted-foreground">
              <p className="mb-2">No favorite coins yet</p>
              <p className="text-sm">
                Add coins to your favorites from the screener below
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FavoritesSection;
