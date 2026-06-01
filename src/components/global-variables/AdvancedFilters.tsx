/**
 * AdvancedFilters Component
 *
 * A clean filtering component for global variables that matches the bots page design
 */

import React, { useState, useCallback } from 'react';
import { Filter, X, Hash, Type, Bot, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import VariableTypeChip from './VariableTypeChip';
import { GlobalVariablesTypeEnum } from '@/types';
import type {
  FilterModel,
  FilterItem,
  FilterOperator,
} from '@/types/globalVariables';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterModel | null) => void;
  currentFilters: FilterModel | null;
  _totalVariables: number;
  _filteredCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
  className?: string;
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: FilterItem[];
  icon: React.ReactNode;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFiltersChange,
  currentFilters,
  _totalVariables,
  _filteredCount,
  showFilters,
  onToggleFilters,
  className = '',
}) => {
  // Local filter state
  const [localFilters, setLocalFilters] = useState<FilterItem[]>(
    currentFilters?.items || []
  );

  // Filter presets
  const filterPresets: FilterPreset[] = [
    {
      id: 'all',
      name: 'All Variables',
      description: 'Show all variables',
      filters: [],
      icon: <Hash className="h-4 w-4" />,
    },
    {
      id: 'unused',
      name: 'Unused',
      description: 'Variables not used by any bots',
      filters: [{ field: 'botAmount', operator: 'equals', value: '0' }],
      icon: <AlertCircle className="h-4 w-4" />,
    },
    {
      id: 'used',
      name: 'In Use',
      description: 'Variables used by one or more bots',
      filters: [{ field: 'botAmount', operator: 'greaterThan', value: '0' }],
      icon: <Bot className="h-4 w-4" />,
    },
    {
      id: 'text',
      name: 'Text Variables',
      description: 'String/text type variables',
      filters: [
        {
          field: 'type',
          operator: 'equals',
          value: GlobalVariablesTypeEnum.text,
        },
      ],
      icon: <Type className="h-4 w-4" />,
    },
  ];

  // Count active filters
  const activeFilterCount = localFilters.length;

  // Apply preset filters
  const applyPreset = useCallback(
    (preset: FilterPreset) => {
      setLocalFilters(preset.filters);
      const filterModel: FilterModel | null =
        preset.filters.length > 0 ? { items: preset.filters } : null;
      onFiltersChange(filterModel);
    },
    [onFiltersChange]
  );

  // Toggle type filter
  const toggleTypeFilter = useCallback(
    (type: GlobalVariablesTypeEnum) => {
      setLocalFilters((prev) => {
        const existingIndex = prev.findIndex(
          (f) => f.field === 'type' && f.value === type
        );
        let newFilters;
        if (existingIndex >= 0) {
          newFilters = prev.filter((_, index) => index !== existingIndex);
        } else {
          newFilters = [
            ...prev,
            {
              field: 'type',
              operator: 'equals' as FilterOperator,
              value: type,
            },
          ];
        }

        // Apply filters immediately
        const filterModel: FilterModel | null =
          newFilters.length > 0 ? { items: newFilters } : null;
        onFiltersChange(filterModel);

        return newFilters;
      });
    },
    [onFiltersChange]
  );

  // Toggle bot usage filter
  const toggleBotUsageFilter = useCallback(
    (value: number | string) => {
      setLocalFilters((prev) => {
        const existingIndex = prev.findIndex(
          (f) => f.field === 'botAmount' && f.value === value
        );
        let newFilters;
        if (existingIndex >= 0) {
          newFilters = prev.filter((_, index) => index !== existingIndex);
        } else {
          const operator: FilterOperator =
            value === 0 ? 'equals' : 'greaterThan';
          newFilters = [
            ...prev,
            { field: 'botAmount', operator, value: String(value) },
          ];
        }

        // Apply filters immediately
        const filterModel: FilterModel | null =
          newFilters.length > 0 ? { items: newFilters } : null;
        onFiltersChange(filterModel);

        return newFilters;
      });
    },
    [onFiltersChange]
  );

  // Remove specific filter
  const removeFilter = useCallback(
    (index: number) => {
      setLocalFilters((prev) => {
        const newFilters = prev.filter((_, i) => i !== index);
        const filterModel: FilterModel | null =
          newFilters.length > 0 ? { items: newFilters } : null;
        onFiltersChange(filterModel);
        return newFilters;
      });
    },
    [onFiltersChange]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setLocalFilters([]);
    onFiltersChange(null);
  }, [onFiltersChange]);

  // Render filter content
  const renderFilterContent = () => (
    <div className="p-lg">
      <div className="flex flex-wrap items-start gap-xl">
        {/* Quick Presets */}
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Quick Presets
          </Label>
          <div className="flex flex-wrap gap-xs">
            {filterPresets.map((preset) => (
              <Badge
                key={preset.id}
                variant="outline"
                className="cursor-pointer text-sm px-3 py-1.5 transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 hover:border-orange-300"
                onClick={() => applyPreset(preset)}
              >
                <div className="flex items-center gap-xs">
                  {preset.icon}
                  {preset.name}
                </div>
              </Badge>
            ))}
          </div>
        </div>

        {/* Variable Type Filter */}
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Variable Type
          </Label>
          <div className="flex flex-wrap gap-xs">
            {Object.values(GlobalVariablesTypeEnum).map((type) => (
              <Badge
                key={type}
                variant="outline"
                className={`cursor-pointer text-sm px-3 py-1.5 transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
                  localFilters.some(
                    (f) => f.field === 'type' && f.value === type
                  )
                    ? 'gradient-brand text-white border-transparent'
                    : 'hover:border-orange-300'
                }`}
                onClick={() => toggleTypeFilter(type)}
              >
                <VariableTypeChip type={type} />
              </Badge>
            ))}
          </div>
        </div>

        {/* Bot Usage Filter */}
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Bot Usage
          </Label>
          <div className="flex flex-wrap gap-xs">
            <Badge
              variant="outline"
              className={`cursor-pointer text-sm px-3 py-1.5 transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
                localFilters.some(
                  (f) => f.field === 'botAmount' && f.value === '0'
                )
                  ? 'gradient-brand text-white border-transparent'
                  : 'hover:border-orange-300'
              }`}
              onClick={() => toggleBotUsageFilter(0)}
            >
              <div className="flex items-center gap-xs">
                <AlertCircle className="h-4 w-4" />
                Unused (0 bots)
              </div>
            </Badge>

            <Badge
              variant="outline"
              className={`cursor-pointer text-sm px-3 py-1.5 transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
                localFilters.some(
                  (f) => f.field === 'botAmount' && f.value === '1+'
                )
                  ? 'gradient-brand text-white border-transparent'
                  : 'hover:border-orange-300'
              }`}
              onClick={() => toggleBotUsageFilter('1+')}
            >
              <div className="flex items-center gap-xs">
                <Bot className="h-4 w-4" />
                In Use (1+ bots)
              </div>
            </Badge>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {localFilters.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">
              Active Filters ({localFilters.length})
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-xs">
            {localFilters.map((filter, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-1"
              >
                {filter.field}: {filter.value}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(index)}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // If showFilters is false, we're being used inside a panel wrapper, so just render the content
  if (!showFilters) {
    return <div className={className}>{renderFilterContent()}</div>;
  }

  return (
    <div className={className}>
      {/* Filter Toggle Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggleFilters}
        className="gap-xs relative"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default AdvancedFilters;
