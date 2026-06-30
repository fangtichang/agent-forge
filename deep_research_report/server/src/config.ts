/**
 * Application configuration — loaded from environment variables.
 */
import 'dotenv/config';

export const config = {
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    version: '1.0.0',
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://agent:password@localhost:5432/agent_forge',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    searchCacheTtl: 24 * 60 * 60,        // 24 hours
    llmCacheTtl: 60 * 60,                 // 1 hour
    sessionTtl: 30 * 60,                  // 30 minutes
  },

  llm: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    timeout: parseInt(process.env.LLM_TIMEOUT_MS || '60000', 10),
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '2', 10),
    maxConcurrency: parseInt(process.env.LLM_MAX_CONCURRENCY || '3', 10),
  },

  search: {
    tavilyApiKey: process.env.TAVILY_API_KEY || '',
    timeout: parseInt(process.env.SEARCH_TIMEOUT_MS || '15000', 10),
    maxResults: parseInt(process.env.SEARCH_MAX_RESULTS || '5', 10),
  },

  security: {
    apiKeySalt: process.env.API_KEY_SALT || 'change-me-in-production',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;

/** Validate required production configuration. */
export function validateConfig(): string[] {
  const errors: string[] = [];

  if (config.isProd) {
    if (!config.llm.apiKey) errors.push('OPENAI_API_KEY is required in production');
    if (!config.search.tavilyApiKey) errors.push('TAVILY_API_KEY is required in production');
    if (config.security.apiKeySalt === 'change-me-in-production') {
      errors.push('API_KEY_SALT must be changed in production');
    }
    if (config.security.corsOrigin === '*') {
      errors.push('CORS_ORIGIN should not be wildcard in production');
    }
  }

  return errors;
}
