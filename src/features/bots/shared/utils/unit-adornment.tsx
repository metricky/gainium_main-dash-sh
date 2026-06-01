import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type UnitAdornmentOptions = {
  tone?: 'muted' | 'default';
  size?: 'xs' | 'sm';
  className?: string;
};

const SIZE_MAP: Record<NonNullable<UnitAdornmentOptions['size']>, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
};

export const unitAdornment = (
  unit: string,
  { tone = 'muted', size = 'xs', className }: UnitAdornmentOptions = {}
): ReactNode => (
  <span
    className={cn(
      'mr-2 inline-flex items-center font-medium leading-none',
      SIZE_MAP[size],
      tone === 'muted' ? 'text-muted-foreground' : 'text-foreground',
      className
    )}
  >
    {unit}
  </span>
);
