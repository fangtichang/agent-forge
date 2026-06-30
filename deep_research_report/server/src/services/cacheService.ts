import { logger } from '../logger.js';

/**
 * Cache Service �?Redis abstraction for search and LLM response caching.
 *
 * Graceful degradation: if Redis is unavailable, all cache operations become no-ops
 * and the system continues with direct DB/external API calls.
 */
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { config } from '../config.js';

class CacheService {
  private client: RedisClientType | null = null;
  private connected = false;

  async connect(): Promise<void> {
    try {
      this.client = createClient({ url: config.redis.url });

      this.client.on('error', (err) => {
        logger.warn('[CacheService] Redis error (degraded mode):', err.message);
        this.connected = false;
      });

      this.client.on('connect', () => {
        logger.info('[CacheService] Redis connected');
        this.connected = true;
      });

      await this.client.connect();
    } catch (err) {
      logger.warn('[CacheService] Redis unavailable �?running without cache');
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) return null;

    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch {
      // Silently fail �?cache is best-effort
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      await this.client.del(key);
    } catch {
      // Silently fail
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Connection already closed
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const cacheService = new CacheService();
