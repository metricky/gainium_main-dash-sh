import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotesState {
  notes: Record<string, Note>; // widgetId -> Note

  // Actions
  getNote: (widgetId: string) => Note | undefined;
  setNote: (widgetId: string, note: Partial<Note>) => void;
  updateNoteContent: (widgetId: string, content: string) => void;
  updateNoteTitle: (widgetId: string, title: string) => void;
  deleteNote: (widgetId: string) => void;
  clearAllNotes: () => void;
}

export const useNotesStore = create<NotesState>()(
  devtools(
    persist(
      (set, get) => ({
        notes: {},

        getNote: (widgetId: string) => {
          return get().notes[widgetId];
        },

        setNote: (widgetId: string, noteData: Partial<Note>) => {
          const existingNote = get().notes[widgetId];
          const now = new Date();

          const updatedNote: Note = {
            id: widgetId,
            title: noteData.title || existingNote?.title || 'Untitled Note',
            content: noteData.content || existingNote?.content || '',
            createdAt: existingNote?.createdAt || now,
            updatedAt: now,
            ...noteData,
          };

          set((state) => ({
            notes: {
              ...state.notes,
              [widgetId]: updatedNote,
            },
          }));
        },

        updateNoteContent: (widgetId: string, content: string) => {
          const existingNote = get().notes[widgetId];
          if (!existingNote) return;

          set((state) => ({
            notes: {
              ...state.notes,
              [widgetId]: {
                ...existingNote,
                content,
                updatedAt: new Date(),
              },
            },
          }));
        },

        updateNoteTitle: (widgetId: string, title: string) => {
          const existingNote = get().notes[widgetId];
          if (!existingNote) return;

          set((state) => ({
            notes: {
              ...state.notes,
              [widgetId]: {
                ...existingNote,
                title,
                updatedAt: new Date(),
              },
            },
          }));
        },

        deleteNote: (widgetId: string) => {
          set((state) => {
            const { [widgetId]: _deleted, ...rest } = state.notes;
            return { notes: rest };
          });
        },

        clearAllNotes: () => {
          set({ notes: {} });
        },
      }),
      {
        name: 'notes-store',
        version: 1,
      }
    ),
    {
      name: 'notes-store',
    }
  )
);
