import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import React from 'react';

interface PremiumUpgradeProps {
  /** Short label of the gated feature, e.g. "Hedge bots" or "Global
   *  variables". Used in the heading. */
  feature: string;
  /** Optional one-line context shown under the heading. */
  description?: string;
  /** Where the CTA points. Defaults to the hosted license page;
   *  override per-feature if a deep-link makes more sense. */
  ctaHref?: string;
  /** Button copy. Defaults to "Activate license". */
  ctaLabel?: string;
}

const DEFAULT_HREF = 'https://app.gainium.io/subscription';

/**
 * Premium-feature upgrade card. Rendered as the fallback when
 * `useLicense().isPremium === false`. Builds without a valid license
 * key see it everywhere a premium gate is wired.
 *
 * Visual is intentionally lightweight — a centered card with a lock
 * icon, headline, and CTA. Pages can compose this inside whatever
 * page chrome they already render (MainLayout, drawer, etc.).
 */
export const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({
  feature,
  description,
  ctaHref = DEFAULT_HREF,
  ctaLabel = 'Activate license',
}) => {
  return (
    <div className="flex items-center justify-center min-h-[40vh] p-md">
      <Card className="max-w-md w-full p-lg text-center">
        <div className="flex flex-col items-center gap-md">
          <div className="rounded-full bg-muted p-md">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-xs">
            <h2 className="text-lg font-semibold">
              {feature} requires a premium license
            </h2>
            <p className="text-sm text-muted-foreground">
              {description ??
                'Activate your Gainium license to unlock this feature.'}
            </p>
          </div>
          <Button asChild className="fx-glow">
            <a href={ctaHref} target="_blank" rel="noreferrer">
              {ctaLabel}
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PremiumUpgrade;
