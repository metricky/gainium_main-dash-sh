// License provider contract. `useLicense()` reads from a hook
// registered by the host app at boot.
export interface LicenseState {
  /** True when the user has access to premium features. */
  isPremium: boolean;
  /** True when the user has supplied a license key. */
  hasKey: boolean;
  /** Redacted or full key string. */
  key?: string;
}

/**
 * A React hook that returns the current license state. Each implementation
 * registers during app bootstrap via `registerLicenseProvider`.
 */
export type UseLicenseHook = () => LicenseState;
