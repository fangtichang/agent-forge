/**
 * Simple API Key authentication middleware.
 *
 * MVP: validates X-API-Key header against a configured key.
 * Future: JWT-based with user tiers.
 */
import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types/index.js';

/** Configured valid API keys (SHA-256 hashed). In production, load from DB. */
const VALID_API_KEYS = new Set<string>(
  (process.env.VALID_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean),
);

export function auth(req: Request, _res: Response, next: NextFunction): void {
  // Skip auth if no keys are configured (dev mode)
  if (VALID_API_KEYS.size === 0) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      'API key is required. Provide it via X-API-Key header.',
      401,
    );
  }

  // In production, this would hash and compare against DB
  if (!VALID_API_KEYS.has(apiKey)) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      'Invalid API key.',
      401,
    );
  }

  next();
}
