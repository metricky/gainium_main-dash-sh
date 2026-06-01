import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import CoinIcon from '../widgets/shared/CoinIcon';

const CoinSelector: React.FC = () => {
  const { addFavorite } = useFavoritesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter coins that are not already in favorites
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableCoins: any[] = [];

  const handleAddCoin = (coinSymbol: string) => {
    addFavorite(coinSymbol);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-xs">
          <Plus className="h-4 w-4" />
          Add Coin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel>Add to Favorites</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-xs">
          <Input
            placeholder="Search coins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {availableCoins.length > 0 ? (
            availableCoins.slice(0, 10).map((coin) => (
              <DropdownMenuItem
                key={coin.symbol}
                onClick={() => handleAddCoin(coin.symbol)}
                className="flex items-center gap-sm p-sm cursor-pointer"
              >
                <CoinIcon symbol={coin.symbol} size="w-6 h-6" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{coin.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {coin.name}
                  </div>
                </div>
                <div className="text-sm font-medium">
                  $
                  {coin.price.toLocaleString('en-US', {
                    minimumFractionDigits: coin.price < 1 ? 4 : 2,
                    maximumFractionDigits: coin.price < 1 ? 4 : 2,
                  })}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-sm text-center text-sm text-muted-foreground">
              {searchQuery
                ? 'No coins found'
                : 'All available coins are already in favorites'}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CoinSelector;
