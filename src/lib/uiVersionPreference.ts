export type UiVersion = 'v1' | 'v2';

export const UI_VERSION_COOKIE_KEY = 'preferredUiVersion';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const isGainiumHost = (hostname: string) => hostname.endsWith('gainium.io');

const buildCookieValue = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return '';
  }

  const attrs = [
    `${key}=${encodeURIComponent(value)}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'SameSite=Lax',
  ];

  if (window.location.protocol === 'https:') {
    attrs.push('Secure');
  }

  if (isGainiumHost(window.location.hostname)) {
    attrs.push('Domain=.gainium.io');
  }

  return attrs.join('; ');
};

export const setPreferredUiVersion = (version: UiVersion) => {
  if (typeof document === 'undefined') {
    return;
  }

  const cookie = buildCookieValue(UI_VERSION_COOKIE_KEY, version);
  if (!cookie) {
    return;
  }

  document.cookie = cookie;
};

export const redirectToV1App = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.href = 'https://old.gainium.io';
};
