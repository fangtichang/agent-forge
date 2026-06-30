/**
 * Zod validation middleware factory.
 */
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError, ErrorCode } from '../types/index.js';

/**
 * Create middleware that validates request body against a Zod schema.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      throw new AppError(
        ErrorCode.INVALID_INPUT,
        'Request validation failed',
        400,
        { issues: details },
      );
    }

    // Replace body with validated & transformed data
    req.body = result.data;
    next();
  };
}
