import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface TagEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: string;
  color?: string;
  onSave: (newTag: string, color?: string) => void;
  onDelete?: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#64748b', // slate
];

export function TagEditDialog({
  open,
  onOpenChange,
  tag,
  color,
  onSave,
  onDelete,
}: TagEditDialogProps) {
  const [newTagName, setNewTagName] = useState(tag);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(color);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    if (newTagName.trim()) {
      onSave(newTagName.trim(), selectedColor);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the tag name and color. Changes will apply to all trades
              using this tag.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-md py-4">
            <div className="grid gap-xs">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>
            <div className="grid gap-xs">
              <Label>Color (optional)</Label>
              <div className="grid grid-cols-9 gap-xs">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                      selectedColor === presetColor
                        ? 'border-foreground ring-2 ring-foreground ring-offset-2'
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => setSelectedColor(presetColor)}
                    title={presetColor}
                  />
                ))}
              </div>
              {selectedColor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColor(undefined)}
                  className="mt-2"
                >
                  Clear Color
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-xs">
            <div className="w-full sm:w-auto">
              {onDelete && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Tag
                </Button>
              )}
            </div>
            <div className="flex w-full sm:w-auto gap-xs justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!newTagName.trim()}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete tag?"
        description="Delete this tag everywhere? This removes it from all trades."
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          onDelete?.();
          onOpenChange(false);
        }}
      />
    </>
  );
}
