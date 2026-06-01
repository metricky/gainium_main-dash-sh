/**
 * @deprecated NavigationSidebarV2 is deprecated. The V1 sidebar
 * (`NavigationSidebar`) is now the only supported sidebar — V2 is kept
 * here only so existing imports compile while we untangle references.
 * Persisted `useNavigationV2` is force-migrated to `false` on rehydrate
 * (see `uiStore.merge`). Do not add new usages.
 */
export { NavigationSidebarV2 } from './NavigationSidebarV2';
export type { NavigationGroup, SecondaryPanel } from './types';
