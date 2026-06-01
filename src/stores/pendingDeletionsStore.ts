import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createIndexedDBStorage } from '@/lib/zustand-indexeddb-storage';
import logger from '@/lib/loggerInstance';

export interface PendingDeletion {
  id: string; // Original document ID (e.g., "btcusdt_1770724776913")
  category: string; // Document category (e.g., "journal")
  docId: string; // PouchDB document ID (e.g., "journal_btcusdt_1770724776913")
  rev?: string; // Last known revision
  deletedAt: string; // Deletion timestamp
  _deleted: true; // Deletion flag for backend
}

interface PendingDeletionsState {
  deletions: PendingDeletion[];

  // Actions
  addDeletion: (deletion: Omit<PendingDeletion, '_deleted'>) => void;
  addDeletions: (deletions: Omit<PendingDeletion, '_deleted'>[]) => void;
  getDeletionsByCategory: (category: string) => PendingDeletion[];
  getAllDeletions: () => PendingDeletion[];
  clearDeletions: (category?: string) => void;
  clearAllDeletions: () => void;
  removeDeletion: (docId: string) => void;
}

export const usePendingDeletionsStore = create<PendingDeletionsState>()(
  persist(
    (set, get) => ({
      deletions: [],

      addDeletion: (deletion) => {
        const newDeletion: PendingDeletion = {
          ...deletion,
          _deleted: true,
        };

        set((state) => {
          // Avoid duplicates by checking docId
          const exists = state.deletions.some(
            (d) => d.docId === deletion.docId
          );
          if (exists) {
            logger.debug(
              '[PendingDeletions] Deletion already exists, updating',
              {
                docId: deletion.docId,
                category: deletion.category,
              }
            );
            return {
              deletions: state.deletions.map((d) =>
                d.docId === deletion.docId ? newDeletion : d
              ),
            };
          }

          logger.info('[PendingDeletions] ➕ Added deletion', {
            trace: 'PUSHING_DELETION_TRACE',
            docId: deletion.docId,
            category: deletion.category,
            id: deletion.id,
            total: state.deletions.length + 1,
          });

          return {
            deletions: [...state.deletions, newDeletion],
          };
        });
      },

      addDeletions: (deletions) => {
        if (deletions.length === 0) return;

        set((state) => {
          const newDeletions = deletions.map((d) => ({
            ...d,
            _deleted: true as const,
          }));
          const existingDocIds = new Set(state.deletions.map((d) => d.docId));
          const uniqueNewDeletions = newDeletions.filter(
            (d) => !existingDocIds.has(d.docId)
          );

          logger.info('[PendingDeletions] ➕ Added bulk deletions', {
            trace: 'PUSHING_DELETION_TRACE',
            total: deletions.length,
            new: uniqueNewDeletions.length,
            categories: [...new Set(uniqueNewDeletions.map((d) => d.category))],
            newTotal: state.deletions.length + uniqueNewDeletions.length,
          });

          return {
            deletions: [...state.deletions, ...uniqueNewDeletions],
          };
        });
      },

      getDeletionsByCategory: (category) => {
        return get().deletions.filter((d) => d.category === category);
      },

      getAllDeletions: () => {
        return get().deletions;
      },

      clearDeletions: (category) => {
        if (category) {
          set((state) => {
            const remaining = state.deletions.filter(
              (d) => d.category !== category
            );
            const cleared = state.deletions.length - remaining.length;

            logger.info('[PendingDeletions] 🗑️ Cleared category deletions', {
              trace: 'PUSHING_DELETION_TRACE',
              category,
              cleared,
              remaining: remaining.length,
            });

            return { deletions: remaining };
          });
        } else {
          set({ deletions: [] });
          logger.info('[PendingDeletions] 🗑️ Cleared all deletions');
        }
      },

      clearAllDeletions: () => {
        const count = get().deletions.length;
        set({ deletions: [] });
        logger.info('[PendingDeletions] 🗑️ Cleared all deletions', {
          trace: 'PUSHING_DELETION_TRACE',
          count,
        });
      },

      removeDeletion: (docId) => {
        set((state) => {
          const deletion = state.deletions.find((d) => d.docId === docId);
          if (deletion) {
            logger.debug('[PendingDeletions] ➖ Removed deletion', {
              docId,
              category: deletion.category,
              id: deletion.id,
            });
          }

          return {
            deletions: state.deletions.filter((d) => d.docId !== docId),
          };
        });
      },
    }),
    {
      name: 'pending-deletions-storage',
      storage: createIndexedDBStorage('pending-deletions-storage'),
      partialize: (state) => ({
        deletions: state.deletions,
      }),
    }
  )
);
