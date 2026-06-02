import { useLicense } from '@/lib/license';
import type { EntitlementsState, UseEntitlementsHook } from '../types';

/**
 * Self-hosted entitlements adapter. Sh users have no `subscription`
 * object on the user document — their paid access is gated by the
 * license key validated against gainium.io. Reuse the existing
 * `useLicense()` provider so we don't read `user.licenseKey` from two
 * places.
 *
 * Cloud users register a different hook (see
 * `main-dash-redesign/src/lib/entitlements/impl/cloud.ts`) that reads
 * `userProfile.subscription.subscriptionPlanName` against `paidPlans`.
 */
export const useShEntitlements: UseEntitlementsHook =
  (): EntitlementsState => {
    const { isPremium } = useLicense();
    return { isPaid: isPremium };
  };
