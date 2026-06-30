import { logger } from '../logger.js';

/**
 * Database connection layer �?PostgreSQL pool with graceful degradation.
 *
 * Provides a shared connection pool and a typed query helper.
 * Connection failures are logged but do NOT crash the server �?the system
 * runs in degraded mode without persistence.
 */
import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

/** Shared connection pool. Exported for direct access when needed. */
export const pool = new Pool({
  connectionString: config.database.url,
  max: config.database.maxConnections,
  idleTimeoutMillis: config.database.idleTimeoutMs,
});

pool.on('error', (err: Error) => {
  logger.warn({ err: err.message }, '[DB] Pool error (degraded mode):');
});

/**
 * Execute a parameterized SQL query and return typed rows.
 *
 * On failure, logs a warning and returns an empty array �?the persistence
 * layer is best-effort; the application must never crash on DB errors.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  try {
    const result = await pool.query(sql, params);
    return result.rows as T[];
  } catch (err) {
    logger.warn({ err: (err as Error).message }, '[DB] Query failed:');
    return [];
  }
}

/**
 * Test the database connection.
 * Called automatically in dev mode after pool creation.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch {
    return false;
  }
}

// Auto-test connection in dev mode
if (config.isDev) {
  testConnection().then((ok) => {
    if (ok) {
      logger.info('[DB] PostgreSQL connected');
    } else {
      logger.warn('[DB] PostgreSQL unavailable — running without persistence');
    }
  });
}
