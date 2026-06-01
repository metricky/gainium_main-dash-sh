/**
 * Types for the Gainium Content API (https://content.gainium.io)
 * Used by the in-app Help Center feature.
 */

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface ContentPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Help Document ──────────────────────────────────────────────────────────

/** Metadata returned in list/browse endpoints (no content) */
export interface HelpDocMetadata {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  tldr: string;
  updatedAt: string;
  publishedAt: string;
}

/** Full metadata returned when fetching a single doc by slug */
export interface HelpDocFullMetadata extends HelpDocMetadata {
  id: number;
  name: string;
  createdAt: string;
  locale: string;
  difficulty?: string;
  ingested?: boolean;
  ingestedAt?: string;
}

/** Document with content (from /full endpoints or by-slug) */
export interface HelpDocWithContent {
  metadata: HelpDocMetadata | HelpDocFullMetadata;
  content: string;
}

/** Single doc response (GET /help/:slug) */
export interface HelpDocBySlugResponse {
  metadata: HelpDocFullMetadata;
  content: string;
}

/** Paginated list of metadata-only docs */
export interface HelpDocsListResponse {
  data: HelpDocMetadata[];
  pagination: ContentPagination;
}

/** Paginated list of docs with content */
export interface HelpDocsFullListResponse {
  data: HelpDocWithContent[];
  pagination: ContentPagination;
}

// ─── Blog Post ──────────────────────────────────────────────────────────────

/** Blog post metadata */
export interface BlogPostMetadata {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  tldr: string;
  updatedAt: string;
  publishedAt: string;
}

export interface BlogPostFullMetadata extends BlogPostMetadata {
  id: number;
  name: string;
  createdAt: string;
  locale: string;
}

export interface BlogPostWithContent {
  metadata: BlogPostMetadata | BlogPostFullMetadata;
  content: string;
}

export interface BlogPostBySlugResponse {
  metadata: BlogPostFullMetadata;
  content: string;
}

export interface BlogPostsListResponse {
  data: BlogPostMetadata[];
  pagination: ContentPagination;
}

export interface BlogPostsFullListResponse {
  data: BlogPostWithContent[];
  pagination: ContentPagination;
}

// ─── Search ─────────────────────────────────────────────────────────────────

export interface SearchResultItem {
  source: 'help' | 'blog';
  slug: string;
  title: string;
  description: string;
  match: string;
  relevance: number;
}

export interface SearchResultsResponse {
  query: string;
  data: SearchResultItem[];
  pagination: ContentPagination;
}

export interface SearchFullResultItem {
  source: 'help' | 'blog';
  slug: string;
  title: string;
  description: string;
  match: string;
  relevance: number;
  content: string;
}

export interface SearchFullResultsResponse {
  query: string;
  data: SearchFullResultItem[];
  pagination: ContentPagination;
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export interface ContentMetadataResponse {
  lastCommit: string;
  [key: string]: unknown;
}
