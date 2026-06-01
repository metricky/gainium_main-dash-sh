import { useCallback, useRef, useState } from 'react';

import type { PanelMenuConfig } from '../PanelContainer';

const buildMenuSignature = (config: PanelMenuConfig | undefined) => {
  if (!config) {
    return 'menu:none';
  }

  const parts: string[] = [];
  parts.push(`trigger:${config.triggerAriaLabel ?? ''}`);
  parts.push(`content:${config.contentClassName ?? ''}`);
  parts.push(`count:${config.items.length}`);

  config.items.forEach((item, index) => {
    const id = item.id ?? `idx-${index}`;

    if (item.type === 'separator') {
      parts.push(`sep:${id}`);
      return;
    }

    if (item.type === 'checkbox') {
      const disabled = item.disabled ? '1' : '0';
      const checked = item.checked ? '1' : '0';
      const label = typeof item.label === 'string' ? item.label : '';
      parts.push(`check:${id}:${checked}:${disabled}:${label}`);
      return;
    }

    const disabled = item.disabled ? '1' : '0';
    const label = typeof item.label === 'string' ? item.label : '';
    const shortcut = item.shortcut ?? '';
    const typeKey = item.type ?? 'item';
    parts.push(`item:${typeKey}:${id}:${disabled}:${label}:${shortcut}`);
  });

  return parts.join('|');
};

export const usePanelMenuBridge = () => {
  const [menuConfig, setMenuConfig] = useState<PanelMenuConfig | undefined>();
  const lastSignatureRef = useRef(buildMenuSignature(undefined));

  const handleChange = useCallback((next: PanelMenuConfig | null) => {
    const normalized = next ?? undefined;
    const signature = buildMenuSignature(normalized);

    setMenuConfig((current) => {
      if (signature === lastSignatureRef.current) {
        return current;
      }

      lastSignatureRef.current = signature;
      return normalized;
    });
  }, []);

  return [menuConfig, handleChange] as const;
};
