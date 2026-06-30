import { logger } from '../logger.js';

/**
 * Global error handling middleware.
 */
import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types/index.js';
import type { ApiError } from '../types/index.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as any).requestId || 'unknown';

  // Known application errors
  if (err instanceof AppError) {
    const body: ApiError = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const body: ApiError = {
      success: false,
      error: {
        code: ErrorCode.INVALID_INPUT,
        message: 'Input validation failed',
        details: { issues: (err as any).issues },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(400).json(body);
    return;
  }

  // Unknown errors �?log and return generic 500
  logger.error({ err }, '[ERROR] %s', requestId);

  const body: ApiError = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
  res.status(500).json(body);
}
