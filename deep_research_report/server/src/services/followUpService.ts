/**
 * Follow-Up Service â€?streams follow-up Q&A responses via SSE.
 */
import { generateFollowUpStream } from './llmClient.js';
import { AppError, ErrorCode } from '../types/index.js';
import type { FollowUpRequest, SSEEvent } from '../types/index.js';
import type { Response } from 'express';

/** Stream a follow-up answer via SSE. */
export async function generateFollowUpStreamResponse(
  res: Response,
  request: FollowUpRequest,
): Promise<void> {
  // Validation
  if (!request.question || request.question.trim().length === 0) {
    throw new AppError(ErrorCode.INVALID_INPUT, 'Question cannot be empty', 400);
  }

  if (request.question.length > 1000) {
    throw new AppError(ErrorCode.INVALID_INPUT, 'Question is too long (max 1000 chars)', 400);
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
    const stream = generateFollowUpStream(
      request.question,
      request.reportContext,
      request.parentId
        ? undefined
        : undefined, // parent QA context would be looked up in production
    );

    for await (const { chunk } of stream) {
      sendEvent({
        type: 'generate_chunk',
        data: {
          chapterId: request.chapterId,
          chunk,
        },
      });
    }

    // Complete
    sendEvent({
      type: 'chapter_complete',
      data: { chapterId: request.chapterId },
    });
  } catch (err) {
    sendEvent({
      type: 'error',
      data: {
        code: ErrorCode.LLM_ERROR,
        message: `Follow-up generation failed: ${(err as Error).message}`,
      },
    });
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
