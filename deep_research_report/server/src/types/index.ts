/**
 * Server-wide type definitions.
 */

/** API 统一成功响应 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/** API 统一错误响应 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/** 健康检查响应 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  services: {
    postgres: 'up' | 'down';
    redis: 'up' | 'down';
    llm: 'up' | 'down';
    search: 'up' | 'down';
  };
}

/** 子任务定义 */
export interface SubTask {
  id: string;
  title: string;
  query: string;
  searchTerms: string[];
}

/** 话题拆解请求/响应 */
export interface DecomposeRequest {
  topic: string;
}

export interface DecomposeResponse {
  subTasks: SubTask[];
}

/** Search 进度事件 */
export interface SearchProgressEvent {
  type: 'search_progress';
  data: {
    subTaskId: string;
    sourcesFound: number;
  };
}

/** Search 完成事件 */
export interface SearchCompleteEvent {
  type: 'search_complete';
  data: {
    totalSources: number;
  };
}

/** 生成 chunk 事件 */
export interface GenerateChunkEvent {
  type: 'generate_chunk';
  data: {
    chapterId: string;
    chunk: string;
    citations?: Citation[];
  };
}

/** 章节完成事件 */
export interface ChapterCompleteEvent {
  type: 'chapter_complete';
  data: {
    chapterId: string;
  };
}

/** 报告完成事件 */
export interface ReportCompleteEvent {
  type: 'report_complete';
  data: {
    reportId: string;
  };
}

/** SSE 错误事件 */
export interface ErrorEvent {
  type: 'error';
  data: {
    code: string;
    message: string;
  };
}

/** 引用 */
export interface Citation {
  id: number;
  url: string;
  title: string;
  snippet: string;
}

/** 追问请求 */
export interface FollowUpRequest {
  chapterId: string;
  paragraphIndex: number;
  question: string;
  parentId?: string;
  reportContext: string;
}

/** 报告生成请求 */
export interface GenerateRequest {
  reportId: string;
  chapterId: string;
  chapterTitle: string;
  chapterOutline: string;
  searchContext: string;
}

/** SSE 事件联合类型 */
export type SSEEvent =
  | SearchProgressEvent
  | SearchCompleteEvent
  | GenerateChunkEvent
  | ChapterCompleteEvent
  | ReportCompleteEvent
  | ErrorEvent;

/** 错误码枚举 */
export const ErrorCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  LLM_TIMEOUT: 'LLM_TIMEOUT',
  LLM_ERROR: 'LLM_ERROR',
  SEARCH_FAILED: 'SEARCH_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/** 带错误码的应用异常 */
export class AppError extends Error {
  constructor(
    public code: ErrorCodeType,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
