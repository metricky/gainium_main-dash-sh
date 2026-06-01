export const parseShortcutString = (shortcut?: string) => {
  if (!shortcut) return null;
  const tokens = shortcut.split('+').map((t) => t.trim());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modifiers: any = {};
  let key = '';
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (
      lower === 'cmd' ||
      lower === 'meta' ||
      lower === 'win' ||
      lower === '⌘'
    ) {
      modifiers.cmd = true;
    } else if (lower === 'ctrl' || lower === '^') {
      modifiers.ctrl = true;
    } else if (lower === 'alt' || lower === 'option') {
      modifiers.alt = true;
    } else if (lower === 'shift') {
      modifiers.shift = true;
    } else if (t.length > 0) {
      key = t;
    }
  }
  if (!key) return null;
  return { key, modifiers } as {
    key: string;
    modifiers: {
      cmd?: boolean;
      ctrl?: boolean;
      shift?: boolean;
      alt?: boolean;
    };
  };
};

export default parseShortcutString;
