import { logger } from '../logger.js';

/**
 * Generate stream route �?POST /api/v1/generate/stream
 *
 * Generates a full report by streaming chapter content via SSE.
 * Receives the list of sub-tasks (with search results) and generates each chapter.
 */
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validator.js';
import { generateReportStream } from '../services/reportGenerator.js';
import { searchMultiQuery } from '../services/searchService.js';
import type { SubTask, Citation } from '../types/index.js';

const router = Router();

const generateSchema = z.object({
  topic: z.string().min(1).max(500),
  subTasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      query: z.string(),
      searchTerms: z.array(z.string()),
    }),
  ).min(1).max(6),
});

router.post(
  '/',
  validate(generateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topic, subTasks } = req.body as {
        topic: string;
        subTasks: SubTask[];
      };

      logger.info(`[GenerateRoute] Starting report generation for: "${topic}"`);

      // Phase 1: Search all sub-task queries in parallel
      const allQueries = subTasks.flatMap((st) => [st.query, ...st.searchTerms]);
      const uniqueQueries = [...new Set(allQueries)];
      const searchResultsMap = await searchMultiQuery(uniqueQueries);

      logger.info(
        `[GenerateRoute] Search complete �?${
          [...searchResultsMap.values()].flat().length
        } total results`,
      );

      // Phase 2: Generate report chapters with streaming
      await generateReportStream(res, subTasks, searchResultsMap);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
