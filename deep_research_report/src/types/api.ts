/**
 * API event types for SSE streaming communication.
 */

import type { Citation, SubTask } from '@/types/report';

/** Event emitted when topic decomposition is complete. */
export interface DecomposeEvent {
  subTasks: SubTask[];
}

/** Event emitted during the search phase for progress updates. */
export interface SearchProgressEvent {
  subTaskId: string;
  sourcesFound: number;
}

/** Event emitted during chapter generation with a text chunk. */
export interface GenerateChunkEvent {
  chapterId: string;
  chunk: string;
  citations?: Citation[];
}

/** Event emitted when a chapter generation is complete. */
export interface ChapterCompleteEvent {
  chapterId: string;
}

/** Event emitted when the entire report is complete. */
export interface ReportCompleteEvent {
  reportId: string;
}

/** Event emitted on error. */
export interface ErrorEvent {
  message: string;
  code: string;
}

/**
 * Union type for all SSE events that can be received during generation.
 */
export type SSEEvent =
  | DecomposeEvent
  | SearchProgressEvent
  | GenerateChunkEvent
  | ChapterCompleteEvent
  | ReportCompleteEvent
  | ErrorEvent;

/** Request payload for a follow-up question. */
export interface FollowUpRequest {
  chapterId: string;
  paragraphIndex: number;
  question: string;
  parentId?: string;
  reportContext: string;
}

/**
 * Core API interface for report generation.
 * Both RealAPIService and MockAPIService must implement this.
 */
export interface IReportAPI {
  /** Decompose a topic into sub-tasks. */
  decompose(topic: string): Promise<DecomposeEvent>;

  /** Stream search progress events. */
  searchStream(): AsyncGenerator<SearchProgressEvent>;

  /** Stream chapter generation chunks. */
  generateStream(chapterId: string): AsyncGenerator<GenerateChunkEvent>;

  /** Stream follow-up answer chunks. */
  followUpStream(req: FollowUpRequest): AsyncGenerator<GenerateChunkEvent>;
}

/** Pre-recorded replay scenario for mock/demo mode. */
export interface ReplayScenario {
  meta: {
    topic: string;
    totalDuration: number;
  };
  decompose: {
    delay: number;
    data: SubTask[];
  };
  searchEvents: {
    delay: number;
    data: SearchProgressEvent;
  }[];
  chapterStreams: Record<
    string,
    { delay: number; chunk: string; citations?: Citation[] }[]
  >;
  followUpAnswers: Record<
    string,
    { delay: number; chunk: string; citations?: Citation[] }[]
  >;
}
