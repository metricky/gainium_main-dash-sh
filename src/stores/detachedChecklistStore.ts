import { pouchdbSync } from '@/lib/zustand-pouchdb-middleware';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DetachedChecklistState {
  id?: string; // Add ID for PouchDB sync
  isDetached: boolean;
  position: { x: number; y: number };
  setIsDetached: (isDetached: boolean) => void;
  setPosition: (position: { x: number; y: number }) => void;
}

export const useDetachedChecklistStore = create<DetachedChecklistState>()(
  pouchdbSync(
    persist(
      (set) => ({
        id: 'detached-checklist', // Fixed ID for this singleton store
        isDetached: false,
        position: { x: 20, y: 200 },
        setIsDetached: (isDetached: boolean) => {
          set({ isDetached });
        },
        setPosition: (position: { x: number; y: number }) => {
          set({ position });
        },
      }),
      {
        name: 'detached-checklist-store',
        partialize: (state) => ({
          id: state.id,
          isDetached: state.isDetached,
          position: state.position,
        }),
      }
    ),
    {
      category: 'checklists',
      selector: (state) => (state.isDetached ? [state] : []),
      debounceMs: 1000,
    }
  )
);
