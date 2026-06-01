import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-primary/20 ring-offset-background focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      fullwidth: {
        true: 'flex-1',
      },
      variant: {
        default:
          'bg-primary text-primary-foreground border border-primary/80 hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] active:shadow-none active:scale-[0.98]',
        destructive:
          'bg-destructive text-card-foreground border border-destructive/80 hover:bg-destructive/90 shadow-[0_1px_3px_rgba(0,0,0,0.1)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 active:scale-[0.98]',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground border border-secondary/80 hover:bg-secondary/80 active:scale-[0.98]',
        ghost:
          'border-0 bg-foreground/8 dark:bg-foreground/10 hover:bg-foreground/12 dark:hover:bg-foreground/14 text-foreground active:bg-foreground/16 dark:active:bg-foreground/18',
        subtle:
          'border-0 bg-muted/40 dark:bg-muted/20 hover:bg-muted/70 dark:hover:bg-muted/40 text-foreground active:bg-muted/90',
        link: 'border-0 text-primary underline-offset-4 hover:underline',
        gradient:
          'text-white border-0 hover:opacity-90 shadow-[0_1px_3px_rgba(0,0,0,0.1)] [background:var(--color-gradient)] active:scale-[0.98]',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-lg px-6 has-[>svg]:px-4',
        xl: 'h-12 rounded-lg px-10 has-[>svg]:px-8',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
