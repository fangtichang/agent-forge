import { logger } from '../logger.js';

/**
 * Follow-up stream route �?POST /api/v1/follow-up/stream
 */
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { generateFollowUpStreamResponse } from '../services/followUpService.js';
import type { FollowUpRequest } from '../types/index.js';

const router = Router();

const followUpSchema = z.object({
  chapterId: z.string().min(1),
  paragraphIndex: z.number().int().min(0),
  question: z.string().min(1).max(1000),
  parentId: z.string().optional(),
  reportContext: z.string().min(1).max(10000),
});

router.post(
  '/',
  validate(followUpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request: FollowUpRequest = req.body;

      logger.info(
        `[FollowUpRoute] Processing follow-up for chapter ${request.chapterId}`,
      );

      await generateFollowUpStreamResponse(res, request);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
