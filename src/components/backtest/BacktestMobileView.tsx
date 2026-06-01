import React, { useState } from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { BacktestCard } from './BacktestCard';
import type { BacktestData } from '../../hooks/useBacktests';

interface BacktestMobileViewProps {
  data: BacktestData[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  strategyFilter: string;
  onStrategyFilterChange: (strategy: string) => void;
  strategies: string[];
  selectedItems: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkDelete?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'profit' | 'return' | 'created';
type SortOrder = 'asc' | 'desc';

export const BacktestMobileView: React.FC<BacktestMobileViewProps> = ({
  data,
  searchQuery,
  onSearchChange,
  strategyFilter,
  onStrategyFilterChange,
  strategies,
  selectedItems,
  onSelectionChange,
  onBulkDelete,
  onExport,
  isLoading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Transform data for display
  const displayData = data.map((backtest) => {
    // Handle different pair formats from the backend
    let pair = 'Unknown';
    if (backtest.symbol) {
      pair = backtest.symbol;
    } else if (backtest.settings?.pair) {
      if (Array.isArray(backtest.settings.pair)) {
        pair = backtest.settings.pair[0] || 'Unknown';
      } else {
        pair = backtest.settings.pair;
      }
    } else if (backtest.baseAsset && backtest.quoteAsset) {
      pair = `${backtest.baseAsset}/${backtest.quoteAsset}`;
    }

    const name = backtest.settings?.name || backtest.note || `${pair} Backtest`;

    // Use time field for creation date if available
    const createdDate = backtest.time
      ? new Date(backtest.time)
      : new Date(backtest.created || +new Date());

    return {
      ...backtest,
      displayName: name,
      displayProfit: backtest.financial?.netProfitTotal || 0,
      displayReturn: backtest.financial?.annualizedReturn || 0,
      displayCreated: createdDate,
    };
  });

  // Sort data
  const sortedData = [...displayData].sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let aVal: any, bVal: any;

    switch (sortField) {
      case 'name':
        aVal = a.displayName.toLowerCase();
        bVal = b.displayName.toLowerCase();
        break;
      case 'profit':
        aVal = a.displayProfit;
        bVal = b.displayProfit;
        break;
      case 'return':
        aVal = a.displayReturn;
        bVal = b.displayReturn;
        break;
      case 'created':
        aVal = a.displayCreated.getTime();
        bVal = b.displayCreated.getTime();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectItem = (id: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedItems, id]);
    } else {
      onSelectionChange(selectedItems.filter((item) => item !== id));
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === sortedData.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sortedData.map((item) => item._id));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-md">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-md">
      {/* Mobile Search and Filter Header */}
      <div className="space-y-sm">
        <div className="flex items-center gap-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search backtests..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="px-3"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-xs">
            <Select
              value={strategyFilter}
              onValueChange={onStrategyFilterChange}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {strategies.map((strategy) => (
                  <SelectItem key={strategy} value={strategy.toLowerCase()}>
                    {strategy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-between text-xs"
                >
                  Sort: {sortField}
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-3 w-3" />
                  ) : (
                    <SortDesc className="h-3 w-3" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSort('name')}>
                  Name{' '}
                  {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('profit')}>
                  Profit{' '}
                  {sortField === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('return')}>
                  Return{' '}
                  {sortField === 'return' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('created')}>
                  Created{' '}
                  {sortField === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Selection Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-sm bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.length} selected
          </span>
          <div className="flex items-center gap-xs">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedItems.length === sortedData.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                Export
              </Button>
            )}
            {onBulkDelete && (
              <Button variant="destructive" size="sm" onClick={onBulkDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {sortedData.length} backtest{sortedData.length !== 1 ? 's' : ''} found
      </div>

      {/* Backtest Cards */}
      <div className="space-y-sm">
        {sortedData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              No backtests match your current filters.
            </div>
          </div>
        ) : (
          sortedData.map((backtest) => (
            <BacktestCard
              key={backtest._id}
              backtest={backtest}
              isSelected={selectedItems.includes(backtest._id)}
              onSelect={(selected) => handleSelectItem(backtest._id, selected)}
              onView={() => {
                // TODO: Implement view details
                console.log('View backtest:', backtest._id);
              }}
              className="w-full"
            />
          ))
        )}
      </div>

      {/* Load More / Pagination for mobile */}
      {sortedData.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" disabled>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default BacktestMobileView;
