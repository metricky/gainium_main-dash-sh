import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Period } from '@/types';

// Simple UUID v4 generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface BacktestPeriodState {
  periods: Period[];
  lastSelectedPeriodId: string | null;
  addPeriod: (period: Omit<Period, '_id' | 'uuid'>) => Period;
  updatePeriod: (
    uuid: string,
    updates: Partial<Omit<Period, '_id' | 'uuid'>>
  ) => void;
  deletePeriod: (uuid: string) => void;
  getPeriod: (uuid: string) => Period | undefined;
  setLastSelectedPeriodId: (id: string) => void;
}

export const useBacktestPeriodStore = create<BacktestPeriodState>()(
  persist(
    (set, get) => ({
      periods: [],
      lastSelectedPeriodId: null,

      addPeriod: (period) => {
        const uuid = generateUUID();
        const newPeriod: Period = {
          ...period,
          _id: uuid,
          uuid,
        };
        set((state) => ({
          periods: [...state.periods, newPeriod],
        }));
        return newPeriod;
      },

      updatePeriod: (uuid, updates) => {
        set((state) => ({
          periods: state.periods.map((p) =>
            p.uuid === uuid ? { ...p, ...updates } : p
          ),
        }));
      },

      deletePeriod: (uuid) => {
        set((state) => ({
          periods: state.periods.filter((p) => p.uuid !== uuid),
          lastSelectedPeriodId:
            state.lastSelectedPeriodId === uuid
              ? null
              : state.lastSelectedPeriodId,
        }));
      },

      getPeriod: (uuid) => {
        return get().periods.find((p) => p.uuid === uuid);
      },

      setLastSelectedPeriodId: (id) => {
        set({ lastSelectedPeriodId: id });
      },
    }),
    {
      name: 'backtest-periods-storage',
    }
  )
);
