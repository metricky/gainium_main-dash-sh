import { useAuthStore } from '@/stores/authStore';
import type { LicenseState, UseLicenseHook } from '../types';

// License adapter implementation. Reads `user.licenseKey` populated by
// the user resolver (see schema's `userDataLicenseKey { key, isPremium }`).
//
// Users go to gainium.io, generate a license key, paste it into
// Settings (or the first-install register form). The backend validates
// the key and sets `isPremium: true` on the user document; here we
// just surface that flag.
export const useShLicense: UseLicenseHook = (): LicenseState => {
  const user = useAuthStore((s) => s.user);
  const lk = user?.licenseKey;
  // `licenseKey` is typed as `string | { key, isPremium }` because the
  // cloud schema returns a bare String. Sh always sees the object form,
  // but narrow defensively in case a cloud-shaped payload reaches this
  // hook (e.g. shared cache).
  const obj = typeof lk === 'object' && lk !== null ? lk : null;
  return {
    isPremium: !!obj?.isPremium,
    hasKey: !!obj?.key,
    ...(obj?.key ? { key: obj.key } : {}),
  };
};
