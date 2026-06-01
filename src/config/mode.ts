// Build mode. Single flag that splits sh (default, public, lightweight)
// from cloud (full feature set). Set at build time via the `VITE_MODE`
// env var; cloud's own build script passes `VITE_MODE=cloud`.
//
// Shared code uses `IS_CLOUD` at the few runtime gates where the
// "is something registered for this slot?" check isn't a natural fit —
// e.g. installing the screener fetch stub, skipping a getQuotaUsage
// call, gating an optional GraphQL query. Component / page rendering
// should go through the slot adapter (`lib/extensions`) instead.

export type Mode = 'cloud' | 'sh';

const raw = (import.meta.env['VITE_MODE'] ?? 'sh') as string;

export const MODE: Mode = raw === 'cloud' ? 'cloud' : 'sh';
export const IS_CLOUD = MODE === 'cloud';
export const IS_SH = MODE === 'sh';
