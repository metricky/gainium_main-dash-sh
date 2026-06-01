import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit space-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90 shadow-[0_1px_2px_0_rgb(255_130_122/0.3)]',
        secondary:
          'border-transparent bg-[var(--color-secondary)] text-secondary-foreground [a&]:hover:bg-secondary/90 shadow-[0_1px_2px_0_rgb(114_115_145/0.3)]',
        success:
          'border-transparent bg-success text-white [a&]:hover:bg-success/90 shadow-[0_1px_2px_0_rgb(34_197_94/0.3)]',
        warning:
          'border-transparent bg-warning text-background [a&]:hover:bg-warning/90 shadow-[0_1px_2px_0_rgb(245_158_11/0.3)]',
        error:
          'border-transparent bg-loss text-background [a&]:hover:bg-loss/90 shadow-[0_1px_2px_0_rgb(239_68_68/0.3)]',
        info: 'border-transparent bg-info text-background [a&]:hover:bg-info/90 shadow-[0_1px_2px_0_rgb(59_130_246/0.3)]',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-[0_1px_2px_0_rgb(239_68_68/0.3)]',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground shadow-sm',
        pro: 'border-transparent bg-yellow-500 text-yellow-900 [a&]:hover:bg-yellow-500/90 shadow-[0_1px_2px_0_rgb(234_179_8/0.3)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
