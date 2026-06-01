import { useVisualSettingsStore } from '@/stores/visualSettingsStore';

export const initThemeManager = () => {
  const { theme } = useVisualSettingsStore.getState();

  const apply = (theme: 'light' | 'dark') => {
    // Remove old dark class approach
    document.documentElement.classList.remove('dark');

    // Use data-theme attribute for Tailwind v4
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // initial run - Force dark theme if that's what's selected
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  apply(resolved);

  // Also force apply on document ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply(resolved));
  }

  // subscribe to store changes
  useVisualSettingsStore.subscribe((state) => {
    const newTheme = state.theme;
    const t =
      newTheme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : newTheme;
    apply(t);
  });

  // watch OS preference when in system mode
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    const cur = useVisualSettingsStore.getState().theme;
    if (cur === 'system') apply(mql.matches ? 'dark' : 'light');
  };
  mql.addEventListener('change', onChange);
};
