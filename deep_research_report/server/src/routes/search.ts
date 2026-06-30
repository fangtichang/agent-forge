/**
 * Search stream route — GET /api/v1/search/stream
 *
 * Receives sub-task queries, performs searches, and streams progress via SSE.
 * MVP: queries passed as query params (comma-separated). Future: POST with body.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { searchQuery } from '../services/searchService.js';
import type { SSEEvent } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const queriesParam = req.query.q as string;
  const subTaskId = req.query.subTaskId as string || 'unknown';

  if (!queriesParam) {
    // Return all search terms from all sub-tasks
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const sendEvent = (event: SSEEvent): void => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const queries = queriesParam.split(',').map((q) => q.trim()).filter(Boolean);
    let totalSources = 0;
    let completedCount = 0;

    for (const query of queries) {
      const { results } = await searchQuery(query);
      totalSources += results.length;
      completedCount++;

      sendEvent({
        type: 'search_progress',
        data: {
          subTaskId,
          sourcesFound: totalSources,
        },
      });

      // Small delay between searches to give frontend time to render
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Search complete for this sub-task
    sendEvent({
      type: 'search_complete',
      data: { totalSources },
    });
  } catch (err) {
    sendEvent({
      type: 'error',
      data: {
        code: 'SEARCH_FAILED',
        message: `Search failed: ${(err as Error).message}`,
      },
    });
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export default router;
