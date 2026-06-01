import { Pencil } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface InlineNoteCellProps {
  /** Unique identifier for the row (used as the first argument to onSave) */
  id: string;
  /** Current note value */
  note: string;
  /** Called when the user commits an edit */
  onSave: (id: string, next: string, prev: string) => void;
  /** Optional max display width (Tailwind class, e.g. "max-w-48"). Defaults to max-w-52 */
  maxWidth?: string;
}

/**
 * Generic inline-editable note cell for TanStack Table.
 *
 * Click the cell to enter edit mode; commit with Enter or blur; cancel with Escape.
 */
const InlineNoteCell: React.FC<InlineNoteCellProps> = ({
  id,
  note,
  onSave,
  maxWidth = 'max-w-52',
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);

  // Keep draft in sync when the prop changes (e.g. after query invalidation)
  useEffect(() => {
    if (!editing) setDraft(note);
  }, [note, editing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(note);
    setEditing(true);
  };

  const handleCommit = () => {
    setEditing(false);
    onSave(id, draft, note);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setDraft(note);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        className="w-full min-w-[120px] max-w-60 rounded border border-border bg-background px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        placeholder="Add note…"
      />
    );
  }

  return (
    <button
      type="button"
      className={`group flex items-center gap-1 text-left text-sm bg-transparent border-none p-0 cursor-pointer ${maxWidth}`}
      onClick={handleStartEdit}
      title="Click to edit note"
    >
      {note ? (
        <span className="truncate">{note}</span>
      ) : (
        <span className="text-muted-foreground italic">Add note…</span>
      )}
      <Pencil className="w-3 h-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export default InlineNoteCell;
