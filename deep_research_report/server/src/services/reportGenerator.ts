import { logger } from '../logger.js';

/**
 * Report Generator Service �?streams chapter content via SSE.
 */
import { generateChapterStream } from './llmClient.js';
import { AppError, ErrorCode } from '../types/index.js';
import type { SubTask, Citation, SSEEvent } from '../types/index.js';
import type { Response } from 'express';

/** Context for chapter generation. */
interface ChapterContext {
  chapterTitle: string;
  chapterOutline: string;
  searchResults: Citation[];
}

/** Generate a report by streaming chapter content via SSE. */
export async function generateReportStream(
  res: Response,
  subTasks: SubTask[],
  searchResultsMap: Map<string, Citation[]>,
): Promise<void> {
  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  const reportId = `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let citationId = 0;

  // Helper: write SSE event
  const sendEvent = (event: SSEEvent): void => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    // Generate each chapter
    for (let i = 0; i < subTasks.length; i++) {
      const task = subTasks[i];
      const chapterId = `ch${i + 1}`;
      const citations = searchResultsMap.get(task.query) || [];
      const assignedCitations = citations.map((c) => ({
        ...c,
        id: ++citationId,
      }));

      // Build search context for the chapter
      const searchContext = assignedCitations.length > 0
        ? assignedCitations
            .map(
              (c) =>
                `[citation:${c.id}] ${c.title}\nURL: ${c.url}\n摘要: ${c.snippet}`,
            )
            .join('\n\n')
        : `关于"${task.title}"的公开信息。`;

      // Stream chapter content
      let chapterContent = '';
      const stream = generateChapterStream(
        task.title,
        task.query,
        searchContext,
      );

      for await (const { chunk, citations: chunkCitations } of stream) {
        chapterContent += chunk;

        sendEvent({
          type: 'generate_chunk',
          data: {
            chapterId,
            chunk,
            citations: chunkCitations,
          },
        });
      }

      // Chapter complete
      sendEvent({
        type: 'chapter_complete',
        data: { chapterId },
      });
    }

    // Report complete
    sendEvent({
      type: 'report_complete',
      data: { reportId },
    });
  } catch (err) {
    logger.error({ err }, '[ReportGenerator] Generation failed:');
    sendEvent({
      type: 'error',
      data: {
        code: ErrorCode.LLM_ERROR,
        message: `Report generation failed: ${(err as Error).message}`,
      },
    });
  } finally {
    // SSE closing signal (frontend compat)
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
