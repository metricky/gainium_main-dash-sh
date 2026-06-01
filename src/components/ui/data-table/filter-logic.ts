/**
 * Centralized filter logic for DataTable.
 *
 * All operator matching (contains, equals, isAnyOf, isNoneOf, between, etc.)
 * lives here. Columns can declare `meta.getFilterValue` to provide the
 * searchable string(s) from row.original — the operator logic is handled
 * entirely by this module.
 *
 * This eliminates the need for custom `filterFn` on individual column
 * definitions in page files (TradingBots, ComboBots, GridBots, etc.).
 */

import type { ColumnFiltersState } from '@tanstack/react-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Filter state stored per-column in the table's columnFilters array. */
export interface FilterState {
  operator: string;
  value: unknown;
}

/** Type guard for FilterState. */
export const isFilterState = (value: unknown): value is FilterState => {
  return typeof value === 'object' && value !== null && 'operator' in value;
};

// ---------------------------------------------------------------------------
// Multi-field string helpers
// ---------------------------------------------------------------------------

function includesAny(strings: string[], search: string): boolean {
  const s = search.toLowerCase();
  return strings.some((v) => v.toLowerCase().includes(s));
}

function startsWithAny(strings: string[], search: string): boolean {
  const s = search.toLowerCase();
  return strings.some((v) => v.toLowerCase().startsWith(s));
}

function endsWithAny(strings: string[], search: string): boolean {
  const s = search.toLowerCase();
  return strings.some((v) => v.toLowerCase().endsWith(s));
}

function equalsAny(strings: string[], search: string): boolean {
  const s = search.toLowerCase();
  return strings.some((v) => v.toLowerCase() === s);
}

// ---------------------------------------------------------------------------
// Core operator matching
// ---------------------------------------------------------------------------

/**
 * Apply a single operator to a cell value.
 *
 * When `searchableStrings` is provided (from `meta.getFilterValue`), string-
 * based operators match against ANY of the provided strings (OR logic).
 * Numeric / date operators always use `cellValue` directly.
 */
function applyOperator(
  cellValue: unknown,
  operator: string,
  value: unknown,
  searchableStrings?: string[] | null
): boolean {
  const strings = searchableStrings || [String(cellValue ?? '')];

  switch (operator) {
    // -- String operators --
    case 'contains':
      return includesAny(strings, String(value));

    case 'equals':
      if (searchableStrings) return equalsAny(strings, String(value));
      if (typeof cellValue === 'number' && typeof value === 'string')
        return cellValue === Number(value);
      if (typeof cellValue === 'boolean' && typeof value === 'string')
        return cellValue === (value === 'true');
      return cellValue === value || String(cellValue) === String(value);

    case 'startsWith':
      return startsWithAny(strings, String(value));

    case 'endsWith':
      return endsWithAny(strings, String(value));

    case 'notContains':
      return !includesAny(strings, String(value));

    // -- Numeric operators --
    case 'greaterThan':
      return Number(cellValue) > Number(value);
    case 'lessThan':
      return Number(cellValue) < Number(value);
    case 'greaterThanOrEqual':
      return Number(cellValue) >= Number(value);
    case 'lessThanOrEqual':
      return Number(cellValue) <= Number(value);

    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        if (typeof value[0] === 'number' || typeof value[1] === 'number') {
          const numValue = Number(cellValue);
          const min = value[0] !== '' ? Number(value[0]) : -Infinity;
          const max = value[1] !== '' ? Number(value[1]) : Infinity;
          return numValue >= min && numValue <= max;
        }
        // Date between
        const date = new Date(cellValue as string);
        const startDate = new Date(value[0] as string);
        const endDate = new Date(value[1] as string);
        return date >= startDate && date <= endDate;
      }
      return true;

    // -- Date operators --
    case 'after':
      return new Date(cellValue as string) > new Date(value as string);
    case 'before':
      return new Date(cellValue as string) < new Date(value as string);
    case 'onOrAfter':
      return new Date(cellValue as string) >= new Date(value as string);
    case 'onOrBefore':
      return new Date(cellValue as string) <= new Date(value as string);

    // -- Array / multi-select operators --
    case 'isAnyOf':
      if (Array.isArray(value)) {
        if (value.length === 0) return true;
        if (searchableStrings) {
          return value.some((v) => includesAny(strings, String(v)));
        }
        if (Array.isArray(cellValue)) {
          return value.some((filterVal) =>
            cellValue.some((cellVal) =>
              String(cellVal)
                .toLowerCase()
                .includes(String(filterVal).toLowerCase())
            )
          );
        }
        return value.some((v) =>
          String(cellValue).toLowerCase().includes(String(v).toLowerCase())
        );
      }
      return includesAny(strings, String(value));

    case 'isNoneOf':
      if (Array.isArray(value)) {
        if (value.length === 0) return true;
        if (searchableStrings) {
          return !value.some((v) => includesAny(strings, String(v)));
        }
        if (Array.isArray(cellValue)) {
          return !value.some((filterVal) =>
            cellValue.some((cellVal) =>
              String(cellVal)
                .toLowerCase()
                .includes(String(filterVal).toLowerCase())
            )
          );
        }
        return !value.some((v) =>
          String(cellValue).toLowerCase().includes(String(v).toLowerCase())
        );
      }
      return !includesAny(strings, String(value));

    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Single-condition matching
// ---------------------------------------------------------------------------

/**
 * Evaluate one filter condition against a cell value.
 * Handles legacy string filters, FilterState objects, and empty/not-empty.
 */
function matchesSingleFilter(
  cellValue: unknown,
  singleFilter: unknown,
  searchableStrings?: string[] | null
): boolean {
  // Legacy plain-string filter
  if (typeof singleFilter === 'string') {
    if (searchableStrings) return includesAny(searchableStrings, singleFilter);
    return String(cellValue).toLowerCase().includes(singleFilter.toLowerCase());
  }

  // Object-based filter with operator
  if (isFilterState(singleFilter)) {
    const { operator, value } = singleFilter;

    // isEmpty / isNotEmpty don't need a value
    if (operator === 'isEmpty') {
      if (searchableStrings)
        return searchableStrings.every((s) => !s || s.trim() === '');
      return cellValue === null || cellValue === undefined || cellValue === '';
    }
    if (operator === 'isNotEmpty') {
      if (searchableStrings)
        return searchableStrings.some((s) => s && s.trim() !== '');
      return cellValue !== null && cellValue !== undefined && cellValue !== '';
    }

    // No value provided → show all rows
    if (value === '' || value === null || value === undefined) return true;

    return applyOperator(cellValue, operator, value, searchableStrings);
  }

  return true;
}

// ---------------------------------------------------------------------------
// Column filter factory
// ---------------------------------------------------------------------------

/**
 * Resolve the searchable value(s) for a row + column combination.
 *
 * When `getFilterValueFn` is provided (via `meta.getFilterValue`), the
 * returned string(s) are used for ALL string-based operator matching.
 * This lets columns declare multiple searchable fields without writing
 * a custom `filterFn`.
 */
function resolveFilterValue(
  row: { getValue: (columnId: string) => unknown; original?: unknown },
  columnId: string,
  getFilterValueFn?: ((original: unknown) => string | string[]) | null
): { cellValue: unknown; searchableStrings: string[] | null } {
  if (getFilterValueFn && row.original !== undefined) {
    const result = getFilterValueFn(row.original);
    if (Array.isArray(result)) {
      const strings = result.filter(Boolean).map(String);
      return { cellValue: strings[0] ?? '', searchableStrings: strings };
    }
    return {
      cellValue: result,
      searchableStrings: result ? [String(result)] : null,
    };
  }
  return { cellValue: row.getValue(columnId), searchableStrings: null };
}

/**
 * Create a column filter function.
 *
 * If `meta.getFilterValue` is present, the filter matches against the
 * returned values instead of `row.getValue(columnId)`. This eliminates
 * the need for custom `filterFn` on columns that must match against
 * multiple fields from `row.original`.
 *
 * @example
 * // Column definition — no custom filterFn needed:
 * {
 *   accessorKey: 'exchangeUUID',
 *   meta: {
 *     filterType: 'array',
 *     getFilterValue: (row) => [row.exchangeName, row.exchange].filter(Boolean),
 *   },
 * }
 */
export function createEnhancedColumnFilter(
  meta?: Record<string, unknown> | null
) {
  const getFilterValueFn = meta?.['getFilterValue'] as
    | ((original: unknown) => string | string[])
    | undefined;

  return (
    row: { getValue: (columnId: string) => unknown; original?: unknown },
    columnId: string,
    filterValue: unknown
  ): boolean => {
    if (!filterValue) return true;

    const { cellValue, searchableStrings } = resolveFilterValue(
      row,
      columnId,
      getFilterValueFn
    );

    // Array of filter conditions → AND logic
    if (Array.isArray(filterValue)) {
      return filterValue.every((f) =>
        matchesSingleFilter(cellValue, f, searchableStrings)
      );
    }

    // Legacy string filter
    if (typeof filterValue === 'string') {
      if (searchableStrings) return includesAny(searchableStrings, filterValue);
      return String(cellValue)
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    }

    // Object-based filter
    return matchesSingleFilter(cellValue, filterValue, searchableStrings);
  };
}

/**
 * Default enhanced column filter (no meta.getFilterValue).
 * Used as the registered `filterFns.enhancedColumnFilter` on the table
 * and as fallback for columns that don't define meta at all.
 */
export const enhancedColumnFilter = createEnhancedColumnFilter();

// ---------------------------------------------------------------------------
// Active-filter counter
// ---------------------------------------------------------------------------

/**
 * Count only active filters (filters with non-empty values).
 * Prevents empty filter objects from inflating the count shown in the UI.
 */
export const countActiveFilters = (filters: ColumnFiltersState): number => {
  return filters.filter((filter) => {
    const value = filter.value;

    // Array of conditions
    if (Array.isArray(value)) {
      return value.some((v) => {
        if (typeof v === 'object' && v !== null && 'value' in v) {
          const filterValue = (v as { value: unknown }).value;
          return (
            filterValue !== '' &&
            filterValue !== null &&
            filterValue !== undefined
          );
        }
        return v !== '' && v !== null && v !== undefined;
      });
    }

    // Object filter with operator
    if (typeof value === 'object' && value !== null && 'value' in value) {
      const filterValue = (value as { value: unknown }).value;
      const operator = (value as { operator?: string }).operator;
      if (operator === 'isEmpty' || operator === 'isNotEmpty') return true;
      return (
        filterValue !== '' && filterValue !== null && filterValue !== undefined
      );
    }

    // Legacy string filter
    return value !== '' && value !== null && value !== undefined;
  }).length;
};
