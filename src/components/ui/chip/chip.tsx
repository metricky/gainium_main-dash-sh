import { cn } from '@/lib/utils';
import React from 'react';

interface ChipProps extends React.ComponentProps<'span'> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'primary'
    | 'secondary'
    | 'destructive'
    | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  chipStyle?: 'solid' | 'outline' | 'ghost' | 'soft';
}

const chipVariants = {
  default: {
    solid:
      'bg-muted text-foreground border-transparent shadow-[0_1px_2px_0_rgb(0_0_0/0.1)]',
    outline: 'bg-transparent text-muted-foreground border-muted',
    ghost:
      'bg-transparent text-muted-foreground border-transparent hover:bg-muted/50',
    soft: 'bg-muted/50 text-foreground border-transparent',
  },
  success: {
    solid:
      'bg-success text-white border-transparent shadow-[0_1px_2px_0_rgb(34_197_94/0.3)]',
    outline: 'bg-transparent text-success border-success',
    ghost: 'bg-transparent text-success border-transparent hover:bg-success/10',
    soft: 'bg-success/10 text-success border-transparent',
  },
  warning: {
    solid:
      'bg-warning text-background border-transparent shadow-[0_1px_2px_0_rgb(245_158_11/0.3)]',
    outline: 'bg-transparent text-warning border-warning',
    ghost: 'bg-transparent text-warning border-transparent hover:bg-warning/10',
    soft: 'bg-warning/10 text-warning border-transparent',
  },
  error: {
    solid:
      'bg-loss text-background border-transparent shadow-[0_1px_2px_0_rgb(239_68_68/0.3)]',
    outline: 'bg-transparent text-loss border-loss',
    ghost: 'bg-transparent text-loss border-transparent hover:bg-loss/10',
    soft: 'bg-loss/10 text-loss border-transparent',
  },
  info: {
    solid:
      'bg-info text-background border-transparent shadow-[0_1px_2px_0_rgb(59_130_246/0.3)]',
    outline: 'bg-transparent text-info border-info',
    ghost: 'bg-transparent text-info border-transparent hover:bg-info/10',
    soft: 'bg-info/10 text-info border-transparent',
  },
  primary: {
    solid:
      'bg-primary text-background border-transparent shadow-[0_1px_2px_0_rgb(255_130_122/0.3)]',
    outline: 'bg-transparent text-primary border-primary',
    ghost: 'bg-transparent text-primary border-transparent hover:bg-primary/10',
    soft: 'bg-primary/10 text-primary border-transparent',
  },
  secondary: {
    solid:
      'bg-secondary text-secondary-foreground border-transparent shadow-[0_1px_2px_0_rgb(114_115_145/0.3)]',
    outline: 'bg-transparent text-secondary-foreground border-secondary',
    ghost:
      'bg-transparent text-secondary-foreground border-transparent hover:bg-secondary/50',
    soft: 'bg-secondary/50 text-secondary-foreground border-transparent',
  },
  destructive: {
    solid:
      'bg-destructive text-background border-transparent shadow-[0_1px_2px_0_rgb(239_68_68/0.3)]',
    outline: 'bg-transparent text-destructive border-destructive',
    ghost:
      'bg-transparent text-destructive border-transparent hover:bg-destructive/10',
    soft: 'bg-destructive/10 text-destructive border-transparent',
  },
  outline: {
    solid: 'bg-transparent text-background border-border',
    outline: 'bg-transparent text-foreground border-border',
    ghost:
      'bg-transparent text-foreground border-transparent hover:bg-muted/50',
    soft: 'bg-muted/30 text-foreground border-transparent',
  },
};

const chipSizes = {
  xs: 'px-1.5 py-0.5 text-xs gap-1',
  sm: 'px-2 py-1 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
  xl: 'px-4 py-2 text-lg gap-2',
};

export const Chip: React.FC<ChipProps> = ({
  variant = 'default',
  size = 'sm',
  chipStyle = 'solid',
  className,
  children,
  ...props
}) => {
  return (
    <span
      data-slot="chip"
      className={cn(
        'inline-flex items-center rounded-full font-medium border transition-colors',
        chipVariants[variant][chipStyle],
        chipSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
