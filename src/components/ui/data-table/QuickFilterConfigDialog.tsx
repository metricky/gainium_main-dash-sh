// QuickFilterConfigDialog - Dialog for configuring column filters
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/loggerInstance';
import type { Table } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { FILTER_OPERATORS, type FilterOperator } from './filter-components';

const logPrefix = 'QUICK_FILTER_CONFIG_DIALOG';

export interface QuickFilterConfig {
  columnId: string;
  label: string;
  value: unknown;
}

interface QuickFilterConfigDialogProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: QuickFilterConfig | null;
  table: Table<TData>;
  onSave: (filter: QuickFilterConfig) => void;
}

export function QuickFilterConfigDialog<TData>({
  open,
  onOpenChange,
  filter,
  table,
  onSave,
}: QuickFilterConfigDialogProps<TData>) {
  const [editingFilter, setEditingFilter] = useState<QuickFilterConfig | null>(
    null
  );
  const [operator, setOperator] = useState<string>('contains');
  const [filterValue, setFilterValue] = useState<unknown>('');

  useEffect(() => {
    if (filter) {
      setEditingFilter({ ...filter });

      // Extract operator and value from the filter value
      if (
        filter.value &&
        typeof filter.value === 'object' &&
        !Array.isArray(filter.value)
      ) {
        const filterObj = filter.value as {
          operator?: string;
          value?: unknown;
        };
        setOperator(filterObj.operator || 'contains');
        setFilterValue(filterObj.value ?? '');
      } else {
        // For new filters, set default operator based on filter type
        const column = table.getColumn(filter.columnId);
        const columnDef = column?.columnDef;
        const meta = columnDef?.meta as { filterType?: string } | undefined;
        const filterType = meta?.filterType || 'string';
        const operators =
          FILTER_OPERATORS[filterType as keyof typeof FILTER_OPERATORS] ||
          FILTER_OPERATORS.string;

        setOperator(operators[0]?.id || 'contains');
        setFilterValue(filter.value ?? '');
      }
    }
  }, [filter, table]);

  const handleSave = () => {
    if (!editingFilter) return;
    const needsInput = !['isEmpty', 'isNotEmpty'].includes(operator);
    const isEmptyValue =
      filterValue === '' ||
      filterValue === null ||
      filterValue === undefined ||
      (Array.isArray(filterValue) && filterValue.length === 0);

    // If value is empty, remove the filter instead of applying it
    if (needsInput && isEmptyValue) {
      onSave({
        ...editingFilter,
        value: undefined,
      });
      onOpenChange(false);
      return;
    }

    // Both string and number filters now use operator/value structure
    const finalValue = {
      operator,
      value: needsInput ? filterValue : true,
    };

    onSave({
      ...editingFilter,
      value: finalValue,
    });
    onOpenChange(false);
    logger.info(`${logPrefix}: Filter saved`, {
      filter: editingFilter,
      operator,
      value: filterValue,
    });
  };

  if (!editingFilter) return null;

  const column = table.getColumn(editingFilter.columnId);
  const columnDef = column?.columnDef;
  const meta = columnDef?.meta as { filterType?: string } | undefined;
  const filterType = meta?.filterType || 'string';
  const operators =
    FILTER_OPERATORS[filterType as keyof typeof FILTER_OPERATORS] ||
    FILTER_OPERATORS.string;
  const selectedOperator: FilterOperator | undefined = operators.find(
    (op) => op.id === operator
  );
  const needsInput = !['isEmpty', 'isNotEmpty'].includes(operator);
  const FilterComponent = selectedOperator?.component;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filter: {editingFilter.label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filter-operator">Operator</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger id="filter-operator">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.label}
                    {op.displayLabel && op.displayLabel !== op.label
                      ? ` (${op.displayLabel})`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsInput && FilterComponent && (
            <div className="space-y-2">
              <Label htmlFor="filter-value">Value</Label>
              <div id="filter-value" className="rounded-md border border-input">
                <FilterComponent
                  value={filterValue}
                  onChange={setFilterValue}
                  placeholder={selectedOperator?.label || 'Filter...'}
                  column={column}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Apply Filter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
