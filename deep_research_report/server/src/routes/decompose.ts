/**
 * Decompose route — POST /api/v1/decompose
 */
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { planTasks } from '../services/taskPlanner.js';
import type { ApiResponse, DecomposeResponse } from '../types/index.js';

const router = Router();

const decomposeSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500, 'Topic is too long'),
});

router.post(
  '/',
  validate(decomposeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topic } = req.body as { topic: string };
      const subTasks = await planTasks(topic);

      const body: ApiResponse<DecomposeResponse> = {
        success: true,
        data: { subTasks },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        },
      };

      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
