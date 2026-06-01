import { Search } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface DialogSearchInputProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    'endAdornment' | 'startAdornment'
  > {
  /** Override the trailing icon. Defaults to Search. */
  icon?: React.ReactNode;
}

/**
 * Search input intended for use inside dialogs / modals. Dark `bg-card`
 * surface, no border, search icon on the right. Standard sizing and focus
 * ring across GlobalSearch, ShortcutManager, IndicatorSelector, etc.
 */
export const DialogSearchInput = React.forwardRef<
  HTMLInputElement,
  DialogSearchInputProps
>(({ className, icon, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      type="search"
      endAdornment={
        <span className="pr-3 text-muted-foreground">
          {icon ?? <Search className="h-4 w-4" />}
        </span>
      }
      className={cn(
        'h-11 rounded-lg text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0',
        className
      )}
      {...props}
    />
  );
});

DialogSearchInput.displayName = 'DialogSearchInput';
