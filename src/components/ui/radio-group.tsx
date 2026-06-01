import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';
import * as React from 'react';

const RadioGroupContext = React.createContext<
  | {
      value: string | undefined;
      onValueChange: ((value: string) => void) | undefined;
    }
  | undefined
>(undefined);

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onValueChange?: (value: string) => void;
  }
>(({ className, value, onValueChange, children, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div
        className={cn('grid gap-2', className)}
        role="radiogroup"
        ref={ref}
        {...props}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
});
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
  }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext);

  if (!context) {
    throw new Error('RadioGroupItem must be used within a RadioGroup');
  }

  const checked = context.value === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      value={value}
      className={cn(
        'aspect-square h-3.5 w-3.5 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 !min-h-0 !h-3.5 !w-3.5',
        className
      )}
      onClick={() => context.onValueChange?.(value)}
      ref={ref}
      {...props}
    >
      <span
        className={cn(
          'flex items-center justify-center',
          checked ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden
      >
        <Circle className="h-2 w-2 fill-current text-current" />
      </span>
    </button>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
