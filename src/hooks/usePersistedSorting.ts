/* eslint-disable @typescript-eslint/no-explicit-any */
// Persistent sorting hook for Enhanced Balance Table
// Manages column sorting state with localStorage persistence

import { useState, useEffect, useCallback } from 'react';
import type { SortingState } from '@tanstack/react-table';

// Sorting persistence configuration
interface SortingPersistenceConfig {
  storageKey: string;
  defaultSorting?: SortingState;
  maxSortColumns?: number;
}

// Sorting persistence hook
export const usePersistedSorting = (config: SortingPersistenceConfig) => {
  const { storageKey, defaultSorting = [], maxSortColumns = 3 } = config;

  // Internal sorting state
  const [sorting, setSortingInternal] = useState<SortingState>(defaultSorting);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sorting from localStorage on mount
  useEffect(() => {
    try {
      const savedSorting = localStorage.getItem(storageKey);
      if (savedSorting) {
        const parsedSorting = JSON.parse(savedSorting) as SortingState;

        // Validate sorting structure
        if (
          Array.isArray(parsedSorting) &&
          parsedSorting.every(isValidSortItem)
        ) {
          setSortingInternal(parsedSorting);
        } else {
          // Invalid format, use default
          setSortingInternal(defaultSorting);
        }
      } else {
        // No saved sorting, use default
        setSortingInternal(defaultSorting);
      }
    } catch (error) {
      console.warn('Failed to load sorting from localStorage:', error);
      setSortingInternal(defaultSorting);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, defaultSorting]);

  // Save sorting to localStorage
  const saveSorting = useCallback(
    (newSorting: SortingState) => {
      try {
        // Limit the number of sort columns
        const limitedSorting = newSorting.slice(0, maxSortColumns);

        localStorage.setItem(storageKey, JSON.stringify(limitedSorting));
      } catch (error) {
        console.warn('Failed to save sorting to localStorage:', error);
      }
    },
    [storageKey, maxSortColumns]
  );

  // Update sorting state and persist
  const setSorting = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      setSortingInternal((prev) => {
        const newSorting =
          typeof updater === 'function' ? updater(prev) : updater;

        // Save to localStorage
        saveSorting(newSorting);

        return newSorting;
      });
    },
    [saveSorting]
  );

  // Clear all sorting
  const clearSorting = useCallback(() => {
    setSorting([]);
  }, [setSorting]);

  // Reset to default sorting
  const resetSorting = useCallback(() => {
    setSorting(defaultSorting);
  }, [setSorting, defaultSorting]);

  // Get sorting summary for display
  const getSortingSummary = useCallback(() => {
    if (sorting.length === 0) {
      return 'No sorting applied';
    }

    const sortDescriptions = sorting.map((sort) => {
      const direction = sort.desc ? 'desc' : 'asc';
      return `${sort.id} (${direction})`;
    });

    return `Sorted by: ${sortDescriptions.join(', ')}`;
  }, [sorting]);

  // Check if a specific column is sorted
  const isColumnSorted = useCallback(
    (columnId: string) => {
      return sorting.some((sort) => sort.id === columnId);
    },
    [sorting]
  );

  // Get sort direction for a specific column
  const getColumnSortDirection = useCallback(
    (columnId: string): 'asc' | 'desc' | false => {
      const sortItem = sorting.find((sort) => sort.id === columnId);
      if (!sortItem) return false;
      return sortItem.desc ? 'desc' : 'asc';
    },
    [sorting]
  );

  // Get sort index for a specific column (for multi-column sorting indicators)
  const getColumnSortIndex = useCallback(
    (columnId: string): number => {
      const index = sorting.findIndex((sort) => sort.id === columnId);
      return index >= 0 ? index + 1 : 0;
    },
    [sorting]
  );

  // Check if sorting has been modified from default
  const isModified = useCallback(() => {
    return JSON.stringify(sorting) !== JSON.stringify(defaultSorting);
  }, [sorting, defaultSorting]);

  return {
    // Core sorting state
    sorting,
    setSorting,
    isLoaded,

    // Sorting management
    clearSorting,
    resetSorting,

    // Sorting information
    getSortingSummary,
    isColumnSorted,
    getColumnSortDirection,
    getColumnSortIndex,
    isModified,

    // Configuration
    maxSortColumns,
    storageKey,
  };
};

// Validate sort item structure
const isValidSortItem = (
  item: unknown
): item is { id: string; desc: boolean } => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'desc' in item &&
    typeof (item as any).id === 'string' &&
    typeof (item as any).desc === 'boolean'
  );
};

// Default sorting configurations for different tables
export const SORTING_CONFIGS = {
  enhancedBalances: {
    storageKey: 'enhanced-balance-table-sorting',
    defaultSorting: [{ id: 'totalUsd', desc: true }] as SortingState,
    maxSortColumns: 3,
  },
  portfolioOverview: {
    storageKey: 'portfolio-overview-sorting',
    defaultSorting: [] as SortingState,
    maxSortColumns: 2,
  },
} as const;

// Export types for external use
export type { SortingState, SortingPersistenceConfig };
