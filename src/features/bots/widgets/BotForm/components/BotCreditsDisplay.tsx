import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Coins, Loader2, Plus } from 'lucide-react';
import React from 'react';

export interface CreditBreakdown {
  base: number;
  pairs: number;
  indicators: number;
  deals: number;
}

export interface BotCreditsDisplayProps {
  credits: CreditBreakdown;
  className?: string;
  compact?: boolean;
  /**
   * Deprecated: previously controlled the breakdown popover.
   * The popover has been removed; this is now display-only.
   */
  openOnHover?: boolean;
  /**
   * Deprecated: previously controlled the breakdown popover.
   * The popover has been removed; this is now display-only.
   */
  open?: boolean;
  /**
   * Deprecated: previously controlled the breakdown popover.
   * The popover has been removed; this is now display-only.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Render as a small end-adornment (icon + number) with no label.
   */
  adornment?: boolean;
  onCreate?: () => void;
  createDisabled?: boolean;
  createPending?: boolean;
  createLabel?: string;
  primaryRef?: React.Ref<HTMLButtonElement>;
  /**
   * Render the adornment in a compact, inside-primary-button layout.
   * When true we reduce vertical padding and allow absolute positioning
   * so the adornment can leave a precise 2px offset from the button edges.
   */
  insidePrimary?: boolean;
}

/**
 * Displays the total credits a bot will use.
 * Note: the breakdown popover has been removed (display-only).
 */
export const BotCreditsDisplay: React.FC<BotCreditsDisplayProps> = ({
  credits,
  className,
  compact = false,
  // Deprecated props retained for backwards compatibility
  openOnHover: _openOnHover = false,
  open: _openProp,
  onOpenChange: _onOpenChange,
  adornment = false,
  onCreate,
  createDisabled = false,
  createPending = false,
  createLabel = 'Create',
  primaryRef,
  insidePrimary = false,
}) => {
  const totalCredits = Math.floor(
    credits.base + credits.pairs + credits.indicators + credits.deals
  );

  // If the footer is in compact mode we should not render anything.
  // This ensures the credit display is completely hidden and doesn't
  // affect layout when reduced to compact (icon-only) UI.
  if (compact) return null;

  if (adornment) {
    // The adornment is intentionally non-interactive so it can be safely
    // nested inside the main create <button> without invalid nested HTML.
    return (
      <div
        className={cn(
          insidePrimary
            ? 'inline-flex items-center gap-1 px-3 py-0 bg-transparent border-0 text-white z-10'
            : 'inline-flex items-center gap-1 px-2 py-1 bg-muted/50 border border-border/50 rounded-md text-foreground',
          className
        )}
        title={totalCredits + ' credits'}
        aria-label={`${totalCredits} credits`}
      >
        <Coins
          className={cn(
            'w-4 h-4',
            insidePrimary ? 'text-white' : 'text-warning'
          )}
        />
        <span className="font-medium">{totalCredits}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        compact
          ? 'size-9 inline-flex items-center justify-center bg-muted/50 border border-border/50 rounded-lg text-foreground p-0'
          : 'inline-flex items-center gap-xs px-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm font-medium text-foreground',
        className
      )}
      title={totalCredits + ' credits'}
      aria-label={`${totalCredits} credits`}
    >
      {/* Create action placed on the left inside the credits box */}
      {onCreate && (
        <div className="mr-2 shrink-0">
          <Button
            size="sm"
            variant="gradient"
            onClick={(e) => {
              e.stopPropagation();
              if (!createDisabled) onCreate();
            }}
            disabled={createDisabled}
            ref={primaryRef}
            aria-label={createLabel}
            title={createLabel}
          >
            {createPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : compact ? (
              <Plus className="w-4 h-4" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                <span>{createLabel}</span>
              </>
            )}
          </Button>
        </div>
      )}
      <Coins className="w-4 h-4 text-warning" />
      {!compact && <span>{totalCredits} credits</span>}
    </div>
  );
};

export default BotCreditsDisplay;
