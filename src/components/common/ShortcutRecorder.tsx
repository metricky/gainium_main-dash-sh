import ShortcutChip from '@/components/common/ShortcutChip';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import {
  areShortcutKeysEqual,
  formatShortcut,
  useShortcutStore,
  type ShortcutConfig,
  type ShortcutKey,
} from '@/stores/shortcutStore';
import { RotateCcw, Settings } from 'lucide-react';
import React from 'react';

interface ShortcutRecorderProps {
  id: string; // shortcut id
  label?: string;
  onReset?: () => void; // optional reset callback
  disabled?: boolean;
  // Optional path (used by add-new to register navigation shortcuts)
  path?: string;
  // When false, recorder should not auto-register or update store — used for 'add new' flow
  autoRegister?: boolean;
  // Callback when recorder captures a key while autoRegister is false
  onRecorded?: (key: ShortcutKey) => void;
  // If provided, show this as the preview key (used for add-new)
  previewKey?: ShortcutKey | null;
  // Show the reset button; for add row we often hide it
  showReset?: boolean;
}

/**
 * Small in-place recorder that mirrors the behavior used by the Shortcut Manager list.
 * Shows the current key, an edit button to start recording, and a reset button.
 */
export const ShortcutRecorder: React.FC<ShortcutRecorderProps> = ({
  id,
  label,
  onReset,
  disabled,
  path,
  autoRegister = true,
  onRecorded,
  previewKey = null,
  showReset = true,
}) => {
  const currentKey = useShortcutStore((s) => s.shortcuts[id]?.currentKey);
  const defaultKey = useShortcutStore((s) => s.shortcuts[id]?.defaultKey);
  const enabled = useShortcutStore((s) => !!s.shortcuts[id]?.enabled);
  const registerShortcut = useShortcutStore((s) => s.registerShortcut);
  const startRecording = useShortcutStore((s) => s.startRecording);
  const stopRecording = useShortcutStore((s) => s.stopRecording);
  const updateShortcut = useShortcutStore((s) => s.updateShortcut);
  const toggleShortcut = useShortcutStore((s) => s.toggleShortcut);
  const resetShortcut = useShortcutStore((s) => s.resetShortcut);
  const isRecording = useShortcutStore((s) => s.isRecording);

  React.useEffect(() => {
    if (isRecording !== id) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();

      // Ignore modifier-only presses
      if (['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) return;
      // Cancel with Escape
      if (event.key === 'Escape') {
        stopRecording();
        return;
      }
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const newKey: ShortcutKey = {
        key: event.key.toLowerCase(),
        modifiers: {
          cmd: isMac ? event.metaKey : event.ctrlKey,
          ctrl: isMac ? event.ctrlKey && !event.metaKey : event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey,
        },
      };

      // Prevent duplicates across all shortcuts (only consider enabled, non-deleted)
      try {
        const store = useShortcutStore.getState();
        const all = store.getAllShortcuts();
        const conflict = all.some(
          (s) =>
            s.id !== id &&
            !s.deleted &&
            s.enabled &&
            s.currentKey &&
            areShortcutKeysEqual(s.currentKey, newKey)
        );
        if (conflict) {
          toast.error(
            'This shortcut is already in use. Please choose another.'
          );
          return;
        }
      } catch {
        // ignore
      }

      // If shortcut does not yet exist (e.g., dashboard dynamic), register a placeholder now
      // If autoRegister is false, do not mutate the store; notify parent via `onRecorded`.
      try {
        const st = useShortcutStore.getState();
        if (!st.shortcuts[id]) {
          const payload: Partial<ShortcutConfig> = {
            id,
            label: label || 'Custom',
            description: label || 'Custom action',
            defaultKey: newKey,
            currentKey: newKey,
            enabled: false,
            deleted: false,
            category: id.startsWith('nav-dashboard-')
              ? 'dashboards'
              : id.startsWith('nav-custom-')
                ? 'custom'
                : 'navigation',
            action: () => {},
          };
          if (typeof path === 'string' && path.length > 0)
            payload['path'] = path;
          if (autoRegister) {
            registerShortcut(payload as ShortcutConfig);
          } else {
            // Notify parent that a key is ready to be used for the new shortcut
            onRecorded?.(newKey);
          }
        }
      } catch {
        // no-op
      }

      // Only update the store if autoRegister is enabled
      if (autoRegister) updateShortcut(id, newKey);
      // Ensure it's enabled once user records a key
      try {
        const st = useShortcutStore.getState();
        const cfg = st.shortcuts[id];
        if (cfg && !cfg.enabled) toggleShortcut(id);
      } catch {
        // no-op
      }
      stopRecording();
      toast.success('Shortcut updated');
    };

    window.addEventListener('keydown', handleKeyDown, {
      passive: false,
      capture: true,
    });
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    id,
    isRecording,
    stopRecording,
    updateShortcut,
    toggleShortcut,
    registerShortcut,
    label,
    path,
    autoRegister,
    onRecorded,
  ]);

  // Show recorder even if shortcut doesn't yet exist; recording will create it

  const handleEdit = () => startRecording(id);
  const handleReset = () => {
    if (onReset) {
      onReset();
      return;
    }
    // For dashboard-specific shortcuts we treat reset as clearing the key (disable)
    if (id.startsWith('nav-dashboard-')) {
      try {
        const st = useShortcutStore.getState();
        if (st.shortcuts[id]?.enabled) st.toggleShortcut(id);
      } catch {
        // ignore
      }
      toast.success('Shortcut cleared');
    } else {
      resetShortcut(id);
    }
  };

  return (
    <div className="flex items-center gap-xs">
      {previewKey || (enabled && currentKey) ? (
        // Prefer the store-based ShortcutChip when a real shortcut exists
        enabled && currentKey ? (
          <ShortcutChip id={id} muted={!enabled} />
        ) : previewKey ? (
          <div
            className="text-xs font-mono bg-secondary text-secondary-foreground px-2 py-0.5 rounded"
            title={label}
          >
            {formatShortcut(previewKey as ShortcutKey)}
          </div>
        ) : null
      ) : (
        <div className="text-xs text-muted-foreground">No shortcut</div>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        title={isRecording === id ? 'Recording… press keys' : 'Edit shortcut'}
        onClick={handleEdit}
        disabled={disabled || isRecording === id}
      >
        <Settings className="h-3 w-3" />
      </Button>
      {showReset && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title="Reset to default"
          onClick={handleReset}
          disabled={disabled || !defaultKey}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default ShortcutRecorder;
