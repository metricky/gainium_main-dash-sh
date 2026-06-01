import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { buttonVariants } from './button-variants';

type ButtonProps = React.ComponentPropsWithoutRef<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, fullwidth, asChild = false, type, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const combinedClassName = cn(
      buttonVariants({ variant, size, fullwidth, className })
    );

    if (asChild) {
      return (
        <Comp
          ref={ref}
          data-slot="button"
          data-size={size ?? 'default'}
          className={combinedClassName}
          type="button"
          {...props}
        />
      );
    }

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-size={size ?? 'default'}
        className={combinedClassName}
        type={type ?? 'button'}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
