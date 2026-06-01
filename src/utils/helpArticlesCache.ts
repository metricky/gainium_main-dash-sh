/**
 * Utility to load pre-fetched help articles from the static JSON bundle.
 *
 * The file is generated at build time by `scripts/fetch-help-articles.ts`
 * and lives at `/help-articles.json` (served from `public/`).
 *
 * At runtime this is fetched once and cached in memory.
 */

import logger from '@/lib/loggerInstance';
import type { HelpDocMetadata } from '@/types/helpCenter';

const LOG_PREFIX = '[HelpCenter]';

interface CachedHelpArticles {
  fetchedAt: string;
  articles: HelpDocMetadata[];
}

let cachedPromise: Promise<HelpDocMetadata[]> | null = null;

/**
 * Load all pre-fetched help articles from the static JSON file.
 * Returns an empty array if the file doesn't exist (e.g. dev mode without prebuild).
 * The result is cached – subsequent calls return the same promise.
 */
export function loadCachedHelpArticles(): Promise<HelpDocMetadata[]> {
  if (cachedPromise) return cachedPromise;

  cachedPromise = fetch('/help-articles.json')
    .then(async (res) => {
      if (!res.ok) {
        logger.debug(
          `${LOG_PREFIX} No cached help articles found (status ${res.status})`
        );
        return [];
      }
      const payload = (await res.json()) as CachedHelpArticles;
      logger.info(
        `${LOG_PREFIX} Loaded ${payload.articles.length} cached help articles (fetched at ${payload.fetchedAt})`
      );
      return payload.articles;
    })
    .catch((err) => {
      logger.debug(`${LOG_PREFIX} Failed to load cached help articles`, {
        error: String(err),
      });
      return [] as HelpDocMetadata[];
    });

  return cachedPromise;
}

/** Clear the cache so the next call re-fetches */
export function clearCachedHelpArticles(): void {
  cachedPromise = null;
}
