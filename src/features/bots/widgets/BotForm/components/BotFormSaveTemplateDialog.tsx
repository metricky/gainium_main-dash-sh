import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBotTemplatesStore } from '@/stores/botTemplatesStore';
import { areShortcutKeysEqual, useShortcutStore } from '@/stores/shortcutStore';
import { BotTypesEnum } from '@/types';
import type { BotFormData } from '@/types/bots/form';
import { parseShortcutString } from '@/utils/shortcuts';
import React, { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botType: BotTypesEnum;
  currentFormData: Partial<BotFormData>;
}

/**
 * Controlled "Save as template" dialog. Captures a name, optional
 * description, and optional hotkey, then persists a new template via the
 * templates store. Hotkey-conflict detection mirrors the original
 * BotFormTemplatesMenu flow.
 *
 * This is the cloud/sh save-template entry point now that the footer no
 * longer renders a dedicated bookmark dropdown — the action lives in the
 * save-row overflow menu and opens this dialog. Loading/editing existing
 * templates still happens via the preset picker and registered hotkeys.
 */
export const BotFormSaveTemplateDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  botType,
  currentFormData,
}) => {
  const saveTemplate = useBotTemplatesStore((s) => s.saveTemplate);
  const updateTemplate = useBotTemplatesStore((s) => s.updateTemplate);

  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateHotkey, setTemplateHotkey] = useState('');

  // Reset the fields each time the dialog opens.
  useEffect(() => {
    if (open) {
      setTemplateName('');
      setTemplateDescription('');
      setTemplateHotkey('');
    }
  }, [open]);

  const handleSave = () => {
    if (!templateName.trim()) return;

    // Conflict detection: ensure the hotkey doesn't collide with an existing
    // template or global shortcut before persisting.
    if (templateHotkey) {
      const parsed = parseShortcutString(templateHotkey);
      if (parsed) {
        const templates = useBotTemplatesStore
          .getState()
          .getAllTemplates(botType);
        const templateConflict = templates.find((tt) => {
          if (!tt.shortcut) return false;
          const p2 = parseShortcutString(tt.shortcut);
          return p2 ? areShortcutKeysEqual(p2, parsed) : false;
        });
        if (templateConflict) {
          if (
            !confirm(
              `Hotkey ${templateHotkey} is already assigned to template "${templateConflict.name}". Replace it?`
            )
          ) {
            return;
          }
          updateTemplate(templateConflict.id, { shortcut: undefined });
          useShortcutStore
            .getState()
            .deleteShortcut(`bot-template-${templateConflict.id}`);
        }

        const scs = useShortcutStore.getState().shortcuts;
        for (const [id, sc] of Object.entries(scs)) {
          if (id.startsWith('bot-template-')) continue; // handled above
          if (!sc.currentKey) continue;
          if (areShortcutKeysEqual(sc.currentKey, parsed)) {
            if (
              !confirm(
                `Hotkey ${templateHotkey} conflicts with shortcut "${sc.label}". Override it?`
              )
            ) {
              return;
            }
            useShortcutStore.getState().deleteShortcut(id);
          }
        }
      }
    }

    const created = saveTemplate(
      templateName,
      botType,
      currentFormData as BotFormData,
      {
        description: templateDescription || undefined,
        isFavorite: false,
      }
    );

    // Assign the shortcut to the freshly-saved template in a second step.
    if (templateHotkey && created) {
      updateTemplate(created.id, { shortcut: templateHotkey });
    }

    onOpenChange(false);
  };

  const handleHotkey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pressedKeys: string[] = [];
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if ((isMac && e.metaKey) || (!isMac && e.ctrlKey))
      pressedKeys.push(isMac ? 'Cmd' : 'Ctrl');
    if (e.altKey) pressedKeys.push('Alt');
    if (e.shiftKey) pressedKeys.push('Shift');
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key))
      pressedKeys.push(e.key.toUpperCase());
    if (pressedKeys.length) setTemplateHotkey(pressedKeys.join('+'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Save Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-lg py-4">
          <div className="space-y-xs">
            <Label className="text-sm font-medium">Template Name</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
              autoFocus
            />
          </div>
          <div className="space-y-xs">
            <Label className="text-sm font-medium">
              Description (optional)
            </Label>
            <Input
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Enter template description"
            />
          </div>
          <div className="space-y-xs">
            <Label className="text-sm font-medium">Hotkey (optional)</Label>
            <Input
              value={templateHotkey || 'Click here and press a key'}
              onKeyDown={handleHotkey}
              readOnly
              className="cursor-pointer"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!templateName.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BotFormSaveTemplateDialog;
