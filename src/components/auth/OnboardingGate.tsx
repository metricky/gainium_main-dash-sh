import React from 'react';

interface OnboardingGateProps {
  children: React.ReactNode;
}

/**
 * OnboardingGate (pass-through)
 *
 * Historically this redirected `shouldOnBoard === true` users to a
 * standalone `/onboarding` page. Onboarding is now handled inline by
 * the cloud-only `MaxDetachedPanel` (slot `max.detachedPanel`,
 * registered in `src/main.tsx`), which detects `shouldOnBoard` on
 * mount and opens the walkthrough on the current route.
 *
 * Kept as a thin wrapper so all the existing `<OnboardingGate>` call
 * sites in `App.tsx` (both core and cloud) keep type-checking and the
 * core build doesn't have to fan out a route-removal change.
 */
export const OnboardingGate: React.FC<OnboardingGateProps> = ({ children }) => {
  return <>{children}</>;
};

export default OnboardingGate;
