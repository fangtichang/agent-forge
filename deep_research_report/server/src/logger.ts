/**
 * Structured logger using Pino.
 *
 * Provides unified logging across the server with request ID tracing.
 * In development, logs are human-readable via pino-pretty.
 * In production, logs are JSON for ingestion by log aggregators.
 */
import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.isDev ? 'debug' : 'info',
  ...(config.isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        formatters: {
          level(label) {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

/**
 * Create a child logger scoped to a specific module/component.
 * Usage: const log = scopedLogger('TaskPlanner');
 */
export function scopedLogger(name: string): pino.Logger {
  return logger.child({ module: name });
}
