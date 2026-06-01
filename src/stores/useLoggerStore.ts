import { LogLevel } from '@/lib/loggerInstance';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LoggerFilters {
  searchQuery: string;
  selectedCategories: string[];
  selectedLevels: string[];
  showDuplicatesOnly: boolean;
  groupRepeated: boolean;
}

interface LoggerStore {
  // UI State
  isOpen: boolean;

  // Logger State
  isEnabled: boolean;

  // Filters
  filters: LoggerFilters;

  // Actions
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleEnabled: () => void;
  setSearchQuery: (query: string) => void;
  toggleCategory: (category: string) => void;
  toggleLevel: (level: string) => void;
  toggleShowDuplicatesOnly: () => void;
  toggleGroupRepeated: () => void;
  resetFilters: () => void;
  setFilters: (filters: Partial<LoggerFilters>) => void;
}
const defaultFilters: LoggerFilters = {
  searchQuery: '',
  selectedCategories: [], // Start with empty, will be populated from logs
  selectedLevels: Object.keys(LogLevel),
  showDuplicatesOnly: false,
  groupRepeated: true, // Group repeated messages by default
};

export const useLoggerStore = create<LoggerStore>()(
  persist(
    (set) => ({
      isOpen: false,
      isEnabled: true, // Logger enabled by default
      filters: defaultFilters,

      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),

      toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),

      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),

      toggleCategory: (category) =>
        set((state) => {
          const selected = state.filters.selectedCategories;
          const newSelected = selected.includes(category)
            ? selected.filter((c) => c !== category)
            : [...selected, category];
          return {
            filters: { ...state.filters, selectedCategories: newSelected },
          };
        }),

      toggleLevel: (level) =>
        set((state) => {
          const selected = state.filters.selectedLevels;
          const newSelected = selected.includes(level)
            ? selected.filter((l) => l !== level)
            : [...selected, level];
          return {
            filters: { ...state.filters, selectedLevels: newSelected },
          };
        }),

      toggleShowDuplicatesOnly: () =>
        set((state) => ({
          filters: {
            ...state.filters,
            showDuplicatesOnly: !state.filters.showDuplicatesOnly,
          },
        })),

      toggleGroupRepeated: () =>
        set((state) => ({
          filters: {
            ...state.filters,
            groupRepeated: !state.filters.groupRepeated,
          },
        })),

      resetFilters: () => set({ filters: defaultFilters }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
    }),
    {
      name: 'logger-drawer-storage',
      partialize: (state) => ({
        filters: state.filters,
        isEnabled: state.isEnabled, // Persist enabled state
      }),
    }
  )
);
