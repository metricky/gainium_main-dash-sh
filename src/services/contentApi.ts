/**
 * Gainium Content API service.
 *
 * Thin fetch-based client for https://content.gainium.io.
 * Used by the in-app Help Center and blog features.
 */

import logger from '@/lib/loggerInstance';
import type {
  BlogPostBySlugResponse,
  BlogPostsFullListResponse,
  BlogPostsListResponse,
  HelpDocBySlugResponse,
  HelpDocsFullListResponse,
  HelpDocsListResponse,
  SearchFullResultsResponse,
  SearchResultsResponse,
} from '@/types/helpCenter';

const BASE_URL = 'https://content.gainium.io';
const LOG_PREFIX = '[HelpCenter]';

// ─── Generic fetcher ────────────────────────────────────────────────────────

async function fetchContent<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  logger.debug(`${LOG_PREFIX} Fetching ${url}`);

  const res = await fetch(url);

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    logger.error(`${LOG_PREFIX} API error ${res.status} for ${url}`, {
      status: res.status,
      body: errorText,
    });
    throw new Error(`Content API error: ${res.status} – ${errorText}`);
  }

  const data = (await res.json()) as T;
  return data;
}

// ─── Query-string helpers ───────────────────────────────────────────────────

function paginationParams(page?: number, limit?: number): string {
  const parts: string[] = [];
  if (page) parts.push(`page=${page}`);
  if (limit) parts.push(`limit=${limit}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

function searchParams(query: string, page?: number, limit?: number): string {
  const parts = [`q=${encodeURIComponent(query)}`];
  if (page) parts.push(`page=${page}`);
  if (limit) parts.push(`limit=${limit}`);
  return `?${parts.join('&')}`;
}

// ─── Help Documentation ────────────────────────────────────────────────────

/** Get all help docs metadata (paginated, max 100/page) */
export function getHelpDocs(page?: number, limit?: number) {
  return fetchContent<HelpDocsListResponse>(
    `/help${paginationParams(page, limit)}`
  );
}

/** Get all help docs with content (paginated, max 20/page) */
export function getHelpDocsFull(page?: number, limit?: number) {
  return fetchContent<HelpDocsFullListResponse>(
    `/help/full${paginationParams(page, limit)}`
  );
}

/** Get help docs by category (metadata only) */
export function getHelpDocsByCategory(
  categoryId: string,
  page?: number,
  limit?: number
) {
  return fetchContent<HelpDocsListResponse>(
    `/help/category/${encodeURIComponent(categoryId)}${paginationParams(page, limit)}`
  );
}

/** Get help docs by category with content */
export function getHelpDocsByCategoryFull(
  categoryId: string,
  page?: number,
  limit?: number
) {
  return fetchContent<HelpDocsFullListResponse>(
    `/help/category/${encodeURIComponent(categoryId)}/full${paginationParams(page, limit)}`
  );
}

/** Get help docs by tag (metadata only) */
export function getHelpDocsByTag(tagId: string, page?: number, limit?: number) {
  return fetchContent<HelpDocsListResponse>(
    `/help/tag/${encodeURIComponent(tagId)}${paginationParams(page, limit)}`
  );
}

/** Get help docs by tag with content */
export function getHelpDocsByTagFull(
  tagId: string,
  page?: number,
  limit?: number
) {
  return fetchContent<HelpDocsFullListResponse>(
    `/help/tag/${encodeURIComponent(tagId)}/full${paginationParams(page, limit)}`
  );
}

/** Get full help doc by slug (always includes content) */
export function getHelpDoc(slug: string) {
  return fetchContent<HelpDocBySlugResponse>(
    `/help/${encodeURIComponent(slug)}`
  );
}

// ─── Blog Posts ─────────────────────────────────────────────────────────────

/** Get all blog posts metadata (paginated) */
export function getBlogPosts(page?: number, limit?: number) {
  return fetchContent<BlogPostsListResponse>(
    `/blog${paginationParams(page, limit)}`
  );
}

/** Get all blog posts with content (paginated) */
export function getBlogPostsFull(page?: number, limit?: number) {
  return fetchContent<BlogPostsFullListResponse>(
    `/blog/full${paginationParams(page, limit)}`
  );
}

/** Get blog posts by category (metadata only) */
export function getBlogPostsByCategory(
  categoryId: string,
  page?: number,
  limit?: number
) {
  return fetchContent<BlogPostsListResponse>(
    `/blog/category/${encodeURIComponent(categoryId)}${paginationParams(page, limit)}`
  );
}

/** Get blog posts by tag (metadata only) */
export function getBlogPostsByTag(
  tagId: string,
  page?: number,
  limit?: number
) {
  return fetchContent<BlogPostsListResponse>(
    `/blog/tag/${encodeURIComponent(tagId)}${paginationParams(page, limit)}`
  );
}

/** Get full blog post by slug */
export function getBlogPost(slug: string) {
  return fetchContent<BlogPostBySlugResponse>(
    `/blog/${encodeURIComponent(slug)}`
  );
}

// ─── Search ─────────────────────────────────────────────────────────────────

/** Search across all content (metadata with match excerpt) */
export function searchContent(query: string, page?: number, limit?: number) {
  return fetchContent<SearchResultsResponse>(
    `/search${searchParams(query, page, limit)}`
  );
}

/** Search with full document content */
export function searchContentFull(
  query: string,
  page?: number,
  limit?: number
) {
  return fetchContent<SearchFullResultsResponse>(
    `/search/full${searchParams(query, page, limit)}`
  );
}
