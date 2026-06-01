import React from 'react';
import { Crown, Sprout, Star, Trophy, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlanBadgeSize = 'sm' | 'md' | 'lg';

interface PlanBadgeProps {
  /** Plan name (case-insensitive). Falls back to "FREE" when missing. */
  plan?: string | null;
  size?: PlanBadgeSize;
  className?: string;
}

interface PlanStyle {
  /** Leading tier-group icon. `null` for plans that render label-only (Free). */
  icon: LucideIcon | null;
  /** Number of trailing stars indicating rank within the group. */
  stars: number;
  /** Chip background/text/ring classes. */
  chip: string;
}

// Three tier groups, each color-coded; rank within the group is shown
// as N stars. Free stands apart with no icon and a neutral chip.
const SPROUT_CHIP =
  'bg-success/15 text-success ring-1 ring-inset ring-success/30';
const TROPHY_CHIP =
  'bg-orange-500/15 text-orange-500 ring-1 ring-inset ring-orange-500/30';
const CROWN_CHIP =
  'bg-yellow-400/15 text-yellow-400 ring-1 ring-inset ring-yellow-400/40';
const FREE_CHIP =
  'bg-muted text-muted-foreground ring-1 ring-inset ring-border';

const PLAN_STYLES: Record<string, PlanStyle> = {
  free: { icon: null, stars: 0, chip: FREE_CHIP },
  mini: { icon: Sprout, stars: 1, chip: SPROUT_CHIP },
  edge: { icon: Sprout, stars: 2, chip: SPROUT_CHIP },
  prime: { icon: Sprout, stars: 3, chip: SPROUT_CHIP },
  elite: { icon: Trophy, stars: 1, chip: TROPHY_CHIP },
  master: { icon: Trophy, stars: 2, chip: TROPHY_CHIP },
  legend: { icon: Trophy, stars: 3, chip: TROPHY_CHIP },
  vip1: { icon: Crown, stars: 1, chip: CROWN_CHIP },
  vip2: { icon: Crown, stars: 2, chip: CROWN_CHIP },
  vip3: { icon: Crown, stars: 3, chip: CROWN_CHIP },
  vip4: { icon: Crown, stars: 4, chip: CROWN_CHIP },
};

const DEFAULT_STYLE: PlanStyle = PLAN_STYLES['free'];

const SIZE_CLASSES: Record<PlanBadgeSize, string> = {
  sm: 'h-5 px-2 text-[10px] gap-1 rounded-full',
  md: 'h-6 px-2.5 text-xs gap-1.5 rounded-full',
  lg: 'h-7 px-3 text-sm gap-1.5 rounded-full',
};

const ICON_CLASSES: Record<PlanBadgeSize, string> = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
};

const STAR_CLASSES: Record<PlanBadgeSize, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export const PlanBadge: React.FC<PlanBadgeProps> = ({
  plan,
  size = 'sm',
  className,
}) => {
  const key = (plan?.trim() || 'free').toLowerCase();
  const style = PLAN_STYLES[key] ?? DEFAULT_STYLE;
  const Icon = style.icon;
  const label = key.toUpperCase();

  return (
    <span
      data-slot="plan-badge"
      className={cn(
        'inline-flex items-center font-semibold tracking-wide whitespace-nowrap',
        SIZE_CLASSES[size],
        style.chip,
        className
      )}
    >
      {Icon && <Icon className={ICON_CLASSES[size]} />}
      {label}
      {style.stars > 0 && (
        <span className="inline-flex items-center gap-px ml-0.5">
          {Array.from({ length: style.stars }).map((_, i) => (
            <Star
              key={i}
              className={STAR_CLASSES[size]}
              fill="currentColor"
              strokeWidth={0}
            />
          ))}
        </span>
      )}
    </span>
  );
};
