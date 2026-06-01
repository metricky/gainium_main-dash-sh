/**
 * ResponsiveVariableList Component
 *
 * A responsive component that switches between DataTable (desktop) and
 * mobile card view based on screen size and user preference.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table/data-table';
import { Separator } from '@/components/ui/separator';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { GlobalVariable } from '@/types/globalVariables';
import { type ColumnDef } from '@tanstack/react-table';
import { Grid, List, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import MobileVariableCard from './MobileVariableCard';

interface ResponsiveVariableListProps {
  variables: GlobalVariable[];
  columns: ColumnDef<GlobalVariable>[];
  isLoading: boolean;
  totalCount: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  selectedVariables: Set<string>;
  onSelectVariable: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onViewVariable: (variable: GlobalVariable) => void;
  onEditVariable: (variable: GlobalVariable) => void;
  onDeleteVariable: (variable: GlobalVariable) => void;
  onViewRelatedBots: (variableId: string, variableName: string) => void;
  relatedBotsPopover: {
    isOpen: boolean;
    variableId: string | null;
    variableName: string | null;
  };
  onRelatedBotsPopoverChange: (open: boolean) => void;
  emptyMessage?: string;
  className?: string;
  forcedViewMode?: 'table' | 'cards'; // Allow parent to force view mode
}

const ResponsiveVariableList: React.FC<ResponsiveVariableListProps> = ({
  variables,
  columns,
  isLoading,
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
  selectedVariables,
  onSelectVariable,
  onSelectAll,
  onViewVariable,
  onEditVariable,
  onDeleteVariable,
  onViewRelatedBots,
  relatedBotsPopover,
  onRelatedBotsPopoverChange,
  emptyMessage = 'No variables found.',
  className = '',
  forcedViewMode,
}) => {
  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 768px)');

  // View mode state (user can override responsive default)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [userOverride, setUserOverride] = useState(false);

  // Auto-switch view mode based on screen size unless user has overridden or parent forces a mode
  useEffect(() => {
    if (forcedViewMode) {
      setViewMode(forcedViewMode);
      setUserOverride(true); // Prevent automatic switching when parent controls mode
    } else if (!userOverride) {
      setViewMode(isMobile ? 'cards' : 'table');
    }
  }, [isMobile, userOverride, forcedViewMode]);

  // Handle manual view mode change
  const handleViewModeChange = (mode: 'table' | 'cards') => {
    setViewMode(mode);
    setUserOverride(true);
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalCount);

  // Handle select all for mobile view
  const handleMobileSelectAll = () => {
    const allSelected = variables.every((v) => selectedVariables.has(v.id));
    onSelectAll(!allSelected);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-xl ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading variables...
        </span>
      </div>
    );
  }

  // Render empty state
  if (variables.length === 0) {
    return (
      <div className={`text-center p-xl ${className}`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* View Mode Toggle (only show on tablet/desktop and when not controlled by parent) */}
      {!isMobile && !forcedViewMode && (
        <div className="flex items-center justify-between mb-4 px-6">
          <div className="flex items-center gap-xs">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('table')}
                className="h-7 px-2"
              >
                <List className="h-3 w-3 mr-1" />
                Table
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('cards')}
                className="h-7 px-2"
              >
                <Grid className="h-3 w-3 mr-1" />
                Cards
              </Button>
            </div>
          </div>

          {/* Selection info */}
          {selectedVariables.size > 0 && (
            <Badge variant="secondary">{selectedVariables.size} selected</Badge>
          )}
        </div>
      )}

      {/* Selection info when view toggle is hidden */}
      {(isMobile || forcedViewMode) && selectedVariables.size > 0 && (
        <div className="flex justify-end mb-4 px-6">
          <Badge variant="secondary">{selectedVariables.size} selected</Badge>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable
          tableId="global-variables"
          columns={columns}
          data={variables}
          enableGlobalFilter={false}
          enableColumnFilters={true}
          enableSorting={true}
          enableColumnVisibility={true}
          showPagination={true}
          emptyMessage={emptyMessage}
          className="border-0"
        />
      )}

      {/* Mobile Cards View */}
      {viewMode === 'cards' && (
        <div className="space-y-md">
          {/* Mobile header with select all */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMobileSelectAll}
                className="h-8"
              >
                {variables.every((v) => selectedVariables.has(v.id))
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
              {selectedVariables.size > 0 && (
                <Badge variant="secondary">
                  {selectedVariables.size} selected
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {startItem}-{endItem} of {totalCount}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {variables.map((variable) => (
              <MobileVariableCard
                key={variable.id}
                variable={variable}
                isSelected={selectedVariables.has(variable.id)}
                onSelect={(selected) => onSelectVariable(variable.id, selected)}
                onView={() => onViewVariable(variable)}
                onEdit={() => onEditVariable(variable)}
                onDelete={() => onDeleteVariable(variable)}
                onViewRelatedBots={() =>
                  onViewRelatedBots(variable.id, variable.name)
                }
                relatedBotsPopoverOpen={
                  relatedBotsPopover.isOpen &&
                  relatedBotsPopover.variableId === variable.id
                }
                onRelatedBotsPopoverChange={onRelatedBotsPopoverChange}
              />
            ))}
          </div>

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <>
              <Separator />
              <div className="flex items-center justify-between px-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-xs">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ResponsiveVariableList;
