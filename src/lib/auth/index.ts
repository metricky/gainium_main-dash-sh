import React, { type ReactNode } from 'react';
import type { AuthCapabilities, AuthEnvProvider } from './types';

// Default capabilities: nothing platform-specific. Both flags off
// means a Login page rendered against the default will only show the
// shared email/password form. Host apps override at boot to enable
// `google` (OAuth login) and/or `registration` (sign-up form).
const DEFAULT_CAPABILITIES: AuthCapabilities = {
  google: false,
  registration: false,
};

const PassThroughProvider: AuthEnvProvider = ({ children }) =>
  React.createElement(React.Fragment, null, children);

let envProvider: AuthEnvProvider = PassThroughProvider;
let capabilities: AuthCapabilities = DEFAULT_CAPABILITIES;

/**
 * Register the platform-specific auth integration. Must run before
 * the first render — same contract as `registerAnalyticsProvider`
 * and `registerLicenseProvider`.
 */
export function registerAuthProvider(opts: {
  envProvider: AuthEnvProvider;
  capabilities: AuthCapabilities;
}): void {
  envProvider = opts.envProvider;
  capabilities = opts.capabilities;
}

/** React wrapper that the shared `<AuthProvider>` mounts. Renders the
 *  registered env provider, or a fragment when nothing is registered. */
export const AuthEnvWrapper: AuthEnvProvider = ({ children }) =>
  envProvider({ children });

/** Read the active build's auth capabilities. Components that render
 *  platform-conditional UI (Google button, register form) use this. */
export function useAuthCapabilities(): AuthCapabilities {
  return capabilities;
}

export type { AuthCapabilities, AuthEnvProvider };

// Re-export `ReactNode` so impl files don't need to pull `react` for
// the type alone.
export type { ReactNode };
