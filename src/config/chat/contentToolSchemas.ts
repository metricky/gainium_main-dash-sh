/**
 * Gainium Content API tool schemas for the AI chat agent.
 *
 * These schemas define the tools that the backend AI agent uses to fetch
 * content from the Gainium Content API (https://content.gainium.io).
 *
 * - In **agent** mode: available alongside all other tools.
 * - In **help** mode: these are the ONLY tools available.
 */

// ─── Content API base URL ───────────────────────────────────────────────────
export const GAINIUM_CONTENT_API_BASE = 'https://content.gainium.io';

// ─── Tool schemas (OpenAI function-calling format) ──────────────────────────

/**
 * Search across all Gainium content (help docs + blog posts).
 * Searches in title, tldr, description and content.
 * Returns matched place, relevance, section (help or blog), and doc metadata.
 */
export const searchGainiumContentSchema = {
  name: 'searchGainiumContent',
  description:
    'Search the Gainium knowledge base and blog for articles, guides, and tutorials. ' +
    'Searches across titles, descriptions, TLDRs, and full content. ' +
    'Returns matching documents with relevance scores and excerpts.',
  parameters: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description:
          'The search query. Use specific keywords related to the topic (e.g. "DCA bot setup", "grid bot parameters", "take profit trailing").',
      },
      full: {
        type: 'boolean',
        description:
          'When true, return full document content along with metadata. When false (default), return only metadata with match excerpts. Use false first to find relevant docs, then fetch full content for specific docs.',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (default: 1).',
      },
      limit: {
        type: 'number',
        description:
          'Number of results per page (default: 20 for full, 100 for metadata-only).',
      },
    },
    required: ['query'],
  },
};

/**
 * Get a specific Gainium help document by its slug.
 * Always returns full content.
 */
export const getGainiumHelpDocSchema = {
  name: 'getGainiumHelpDoc',
  description:
    'Retrieve a specific Gainium help document by its slug. Returns the full document including content. ' +
    'Use this after searching to get complete details of a specific help article.',
  parameters: {
    type: 'object' as const,
    properties: {
      slug: {
        type: 'string',
        description:
          'The document slug (URL identifier), e.g. "getting-started", "dca-bot-settings".',
      },
    },
    required: ['slug'],
  },
};

/**
 * Get a specific Gainium blog post by its slug.
 * Always returns full content.
 */
export const getGainiumBlogPostSchema = {
  name: 'getGainiumBlogPost',
  description:
    'Retrieve a specific Gainium blog post by its slug. Returns the full post including content. ' +
    'Use this after searching to get complete details of a specific blog post.',
  parameters: {
    type: 'object' as const,
    properties: {
      slug: {
        type: 'string',
        description:
          'The blog post slug (URL identifier), e.g. "best-dca-strategies-2025".',
      },
    },
    required: ['slug'],
  },
};

/**
 * Browse help docs by category or tag, or list all.
 */
export const browseGainiumHelpSchema = {
  name: 'browseGainiumHelp',
  description:
    'Browse Gainium help documentation by category or tag, or list all help docs. ' +
    'Use this to discover available topics when the user asks a broad question.',
  parameters: {
    type: 'object' as const,
    properties: {
      category: {
        type: 'string',
        description:
          'Filter by category ID. Omit to list all help docs.',
      },
      tag: {
        type: 'string',
        description:
          'Filter by tag ID. Omit to list all help docs.',
      },
      full: {
        type: 'boolean',
        description:
          'When true, include full document content. When false (default), return metadata only.',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (default: 1).',
      },
      limit: {
        type: 'number',
        description:
          'Number of results per page (default: 20 for full, 100 for metadata-only).',
      },
    },
    required: [],
  },
};

// ─── All content tool schemas for export ────────────────────────────────────

export const CONTENT_TOOL_SCHEMAS = [
  searchGainiumContentSchema,
  getGainiumHelpDocSchema,
  getGainiumBlogPostSchema,
  browseGainiumHelpSchema,
];

// ─── Content API endpoint helpers (for backend implementation) ──────────────

/**
 * Helper to build the correct content API URL based on tool call parameters.
 * This is reference code for the backend implementation.
 */
export function buildContentApiUrl(
  toolName: string,
  params: Record<string, unknown>
): string {
  const base = GAINIUM_CONTENT_API_BASE;

  switch (toolName) {
    case 'searchGainiumContent': {
      const full = params['full'] ? '/full' : '';
      const query = encodeURIComponent(String(params['query'] || ''));
      const page = params['page'] || 1;
      const limit = params['limit'] || (params['full'] ? 20 : 100);
      return `${base}/search${full}?q=${query}&page=${page}&limit=${limit}`;
    }

    case 'getGainiumHelpDoc': {
      return `${base}/help/${params['slug']}`;
    }

    case 'getGainiumBlogPost': {
      return `${base}/blog/${params['slug']}`;
    }

    case 'browseGainiumHelp': {
      const full = params['full'] ? '/full' : '';
      const page = params['page'] || 1;
      const limit = params['limit'] || (params['full'] ? 20 : 100);

      if (params['category']) {
        return `${base}/help/category/${params['category']}${full}?page=${page}&limit=${limit}`;
      }
      if (params['tag']) {
        return `${base}/help/tag/${params['tag']}${full}?page=${page}&limit=${limit}`;
      }
      return `${base}/help${full}?page=${page}&limit=${limit}`;
    }

    default:
      return base;
  }
}
