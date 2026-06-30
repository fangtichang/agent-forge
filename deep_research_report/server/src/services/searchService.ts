import { logger } from '../logger.js';

/**
 * Search Service �?wraps Tavily API with Redis caching.
 */
import { config } from '../config.js';
import { AppError, ErrorCode } from '../types/index.js';
import type { Citation } from '../types/index.js';
import { cacheService } from './cacheService.js';

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  query: string;
}

/** Search a single query via Tavily with caching. */
export async function searchQuery(
  query: string,
): Promise<{ results: Citation[]; rawResults: TavilyResult[] }> {
  // Check Redis cache first
  const cacheKey = `search:${hashQuery(query)}`;
  const cached = await cacheService.get<TavilyResult[]>(cacheKey);

  if (cached) {
    logger.info(`[SearchService] Cache hit for: ${query}`);
    return {
      results: cached.map((r, i) => mapToCitation(r, i)),
      rawResults: cached,
    };
  }

  // Cache miss �?call Tavily
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.search.timeout);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.search.tavilyApiKey,
        query,
        max_results: config.search.maxResults,
        search_depth: 'advanced',
        include_answer: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Tavily returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as TavilyResponse;
    const results = data.results || [];

    // Cache results for 24 hours
    await cacheService.set(cacheKey, results, config.redis.searchCacheTtl);

    return {
      results: results.map((r, i) => mapToCitation(r, i)),
      rawResults: results,
    };
  } catch (err) {
    logger.error({ err }, `[SearchService] Failed for query "${query}":`);

    // Don't throw - return empty results so report generation can continue
    return { results: [], rawResults: [] };
  }
}

/** Search multiple queries in parallel. */
export async function searchMultiQuery(
  queries: string[],
): Promise<Map<string, Citation[]>> {
  const results = new Map<string, Citation[]>();

  const promises = queries.map(async (query) => {
    const { results: citations } = await searchQuery(query);
    results.set(query, citations);
  });

  await Promise.allSettled(promises);
  return results;
}

/** Health check for search service. */
export async function checkSearchHealth(): Promise<boolean> {
  try {
    const { results } = await searchQuery('test health check');
    return true; // Any response means the API is reachable
  } catch {
    return false;
  }
}

/** Map Tavily result to Citation type (shared with frontend). */
function mapToCitation(r: TavilyResult, index: number): Citation {
  return {
    id: index + 1,
    url: r.url,
    title: r.title || 'Untitled',
    snippet: r.content?.slice(0, 200) || '',
  };
}

/** Generate a deterministic hash for query caching. */
function hashQuery(query: string): string {
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
