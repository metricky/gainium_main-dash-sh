/**
 * Share-link URL builder + pluggable decorator.
 *
 * Core (sh) builds plain share URLs of the form:
 *   `${origin}${path}?backtestShare=<id>`
 * Cloud overlay registers a `shareUrlDecorator` at boot that appends
 * extra query params (affiliate id, aid source) before the link is
 * copied. This keeps cloud-specific concerns out of `core/` while
 * letting both builds use one helper.
 *
 * Register from host app (e.g. `src/main.tsx`):
 *
 *   import { registerShareUrlDecorator } from '@/lib/shareLinks';
 *   registerShareUrlDecorator((url, ctx) => {
 *     const u = new URL(url);
 *     if (affiliateId) u.searchParams.set('a', affiliateId);
 *     u.searchParams.set('aid', `share-${ctx.kind}`);
 *     return u.toString();
 *   });
 */

export type ShareLinkKind = 'backtest' | 'bot';

export interface ShareLinkContext {
  kind: ShareLinkKind;
  /** Optional sub-type, e.g. 'dca' / 'combo' / 'grid'. */
  subKind?: string;
  /** The raw share id returned by the share mutation. */
  shareId: string;
}

export type ShareUrlDecorator = (
  url: string,
  context: ShareLinkContext
) => string;

let decorator: ShareUrlDecorator | null = null;

export function registerShareUrlDecorator(fn: ShareUrlDecorator | null): void {
  decorator = fn;
}

/**
 * Build the canonical share URL for a backtest and pass it through the
 * registered decorator. Always returns an absolute URL with `?backtestShare=`.
 */
export function buildBacktestShareUrl(args: {
  path: string;
  shareId: string;
  subKind?: string;
  origin?: string;
}): string {
  const origin =
    args.origin ??
    (typeof window !== 'undefined' ? window.location.origin : '');
  // Strip any existing query/hash from the path argument — callers
  // should pass a clean route path.
  const cleanPath = args.path.split('?')[0]?.split('#')[0] ?? args.path;
  const base = `${origin}${cleanPath}?backtestShare=${encodeURIComponent(args.shareId)}`;
  if (decorator) {
    try {
      return decorator(base, {
        kind: 'backtest',
        subKind: args.subKind,
        shareId: args.shareId,
      });
    } catch {
      return base;
    }
  }
  return base;
}

/**
 * Build the canonical share URL for a bot (read-only view) and pass
 * it through the registered decorator. `path` should already include
 * the bot id, e.g. `/bot/view/abc123`.
 */
export function buildBotShareUrl(args: {
  path: string;
  shareId: string;
  subKind?: string;
  origin?: string;
}): string {
  const origin =
    args.origin ??
    (typeof window !== 'undefined' ? window.location.origin : '');
  const cleanPath = args.path.split('?')[0]?.split('#')[0] ?? args.path;
  const base = `${origin}${cleanPath}?share=${encodeURIComponent(args.shareId)}`;
  if (decorator) {
    try {
      return decorator(base, {
        kind: 'bot',
        subKind: args.subKind,
        shareId: args.shareId,
      });
    } catch {
      return base;
    }
  }
  return base;
}
