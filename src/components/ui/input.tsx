import { cn } from '@/lib/utils';
import * as React from 'react';

interface InputProps extends React.ComponentProps<'input'> {
  startAdornment?: React.ReactNode;
  startAdornmentOnClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  endAdornment?: React.ReactNode;
  endAdornmentOnClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      startAdornment,
      startAdornmentOnClick,
      endAdornment,
      endAdornmentOnClick,
      ...props
    },
    ref
  ) => {
    const hasStart = Boolean(startAdornment);
    const hasEnd = Boolean(endAdornment);

    if (hasStart || hasEnd) {
      return (
        <div className="relative flex items-center">
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border border-border/50 bg-foreground/[0.04] hover:bg-foreground/[0.06] px-3 py-2 text-base font-semibold text-foreground ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              hasStart && 'pl-10',
              hasEnd && 'pr-12',
              className
            )}
            ref={ref}
            {...props}
          />

          {hasStart && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-1">
              <div
                data-adornment="true"
                className={cn(
                  'pointer-events-auto flex items-center select-none',
                  startAdornmentOnClick ? 'cursor-pointer' : ''
                )}
                onClick={(e) => startAdornmentOnClick?.(e)}
                role={startAdornmentOnClick ? 'button' : undefined}
                aria-hidden={startAdornmentOnClick ? undefined : true}
              >
                {startAdornment}
              </div>
            </div>
          )}

          {hasEnd && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
              <div
                data-adornment="true"
                className={cn(
                  'pointer-events-auto flex items-center select-none',
                  endAdornmentOnClick ? 'cursor-pointer' : ''
                )}
                onClick={(e) => endAdornmentOnClick?.(e)}
                role={endAdornmentOnClick ? 'button' : undefined}
                aria-hidden={endAdornmentOnClick ? undefined : true}
              >
                {endAdornment}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Render with optional start adornment
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-border/50 bg-foreground/[0.04] hover:bg-foreground/[0.06] px-3 py-2 text-base font-semibold text-foreground ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
