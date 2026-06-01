import { logger } from '@/lib/loggerInstance';
import { cn } from '@/lib/utils';
import { useShortcutStore } from '@/stores/shortcutStore';
import React from 'react';

interface ShortcutChipProps {
  id: string; // shortcut id in store
  className?: string;
  muted?: boolean; // optional style variant for chip
  variant?: 'chip' | 'text'; // render as badge chip or plain text
}

const isMacLike = () => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

const formatShortcutParts = (shortcutKey: {
  key: string;
  modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; cmd?: boolean };
}): string[] => {
  const isMac = isMacLike();
  const parts: string[] = [];

  if (shortcutKey.modifiers.ctrl) parts.push(isMac ? '^' : 'Ctrl');
  if (shortcutKey.modifiers.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcutKey.modifiers.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcutKey.modifiers.cmd) parts.push(isMac ? '⌘' : 'Win');

  // Map arrow key names to glyphs for nicer display
  const arrowMap: Record<string, string> = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
  };

  const keyPart = arrowMap[shortcutKey.key] || shortcutKey.key.toUpperCase();
  // Add the key
  parts.push(keyPart);

  return parts;
};

export const ShortcutChip: React.FC<ShortcutChipProps> = ({
  id,
  className,
  muted,
  variant = 'chip',
}) => {
  // Subscribe to specific fields to ensure re-render on change
  const exists = useShortcutStore((s) => !!s.shortcuts[id]);
  const deleted = useShortcutStore((s) => !!s.shortcuts[id]?.deleted);
  // NOTE: intentionally not using the store-enabled value here; 'muted' prop is used
  const currentKey = useShortcutStore((s) => s.shortcuts[id]?.currentKey);
  const label = useShortcutStore((s) => s.shortcuts[id]?.label);

  // Do not show chips for deleted or when no key is set
  if (!exists || deleted || !currentKey) return null;

  // Defensive: sometimes persisted data can be malformed (e.g. an internal id was stored
  // accidentally as the `key`); detect obvious internal ids and avoid rendering them.
  const keyVal = currentKey?.key;
  if (
    typeof keyVal === 'string' &&
    /(^nav-|^manager-|nav-dashboard-)/.test(keyVal)
  ) {
    logger.warn('[ShortcutChip] Ignoring invalid currentKey for shortcut', {
      shortcutId: id,
      currentKey: keyVal,
    });
    return null;
  }

  const parts = formatShortcutParts(currentKey);

  if (variant === 'text') {
    return (
      <span
        className={cn('hidden md:inline font-mono', className)}
        title={label}
      >
        {parts.join('+')}
      </span>
    );
  }

  return (
    <span
      className={cn('hidden md:inline-flex items-center gap-0.5', className)}
      title={label}
    >
      {parts.map((part, index) => (
        <span
          key={`${part}-${index}`}
          className={cn(
            'inline-flex items-center justify-center min-w-[1.5rem] h-[1.375rem] px-1.5 text-xs leading-none font-medium font-mono rounded-sm',
            muted
              ? 'bg-muted/60 text-muted-foreground border border-border'
              : 'bg-muted text-muted-foreground border border-border shadow-sm'
          )}
        >
          {part}
        </span>
      ))}
    </span>
  );
};

export default ShortcutChip;
