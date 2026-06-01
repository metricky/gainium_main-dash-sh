// When the screener REST endpoint isn't available, intercept `fetch`
// calls to `/api/screener` and return an empty result. This keeps the
// widgets that call it (portfolio balances, treemaps, heatmaps, etc.)
// from spinning forever waiting for a 404/timeout.
//
// Installed once at app bootstrap. Only active in sh builds; cloud has
// the real endpoint.
import { IS_CLOUD } from '@/config/mode';

const SCREENER_STUB_RESPONSE = JSON.stringify({
  status: 'OK',
  data: { result: [] },
});

const buildStubResponse = (): Response =>
  new Response(SCREENER_STUB_RESPONSE, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const resolveUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

export function installScreenerStub(): void {
  if (IS_CLOUD) return;
  if (typeof window === 'undefined') return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    if (resolveUrl(input).includes('/api/screener')) {
      return Promise.resolve(buildStubResponse());
    }
    return originalFetch(input, init);
  };
}
