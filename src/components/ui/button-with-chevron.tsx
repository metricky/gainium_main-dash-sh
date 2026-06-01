import { ChevronRightIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Button with a subtle chevron indicator for dropdowns.
 * Used for TradingView-style compact dropdown triggers.
 */
export interface ButtonWithChevronProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the button is in an active/selected state */
  isActive?: boolean;
  /** Direction of the chevron */
  chevronDirection?: 'right' | 'down';
}

const ButtonWithChevron = React.forwardRef<
  HTMLButtonElement,
  ButtonWithChevronProps
>(
  (
    {
      children,
      isActive,
      title,
      className,
      chevronDirection = 'right',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      title={title}
      className={cn(
        'inline-flex items-center justify-center h-8 px-1.5 rounded-md',
        'text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive && 'bg-accent text-accent-foreground border border-border/60',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon
        className={cn(
          'h-2.5 w-2.5 ml-0.5 opacity-50',
          chevronDirection === 'down' && 'rotate-90'
        )}
      />
    </button>
  )
);
ButtonWithChevron.displayName = 'ButtonWithChevron';

export { ButtonWithChevron };
