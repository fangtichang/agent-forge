/**
 * Application-wide constants.
 */

/** Sample topics for quick selection on the home page. */
export const SAMPLE_TOPICS: string[] = [
  '人工智能行业深度分析',
  '新能源汽车产业链研究',
  '半导体芯片产业竞争格局',
];

/** Steps shown in the progress stepper. */
export const PROGRESS_STEPS: string[] = [
  '拆解话题',
  '多路检索',
  '生成报告',
  '完成',
];

/** Base path for the real API (MVP: placeholder, not connected). */
export const API_BASE_URL: string = '/api/v1';

/** Default report generation configuration. */
export const REPORT_CONFIG = {
  /** Maximum consecutive SSE reconnect attempts. */
  MAX_SSE_RECONNECT: 3,
  /** Base delay between SSE reconnect attempts in milliseconds. */
  SSE_RECONNECT_BASE_DELAY_MS: 1000,
  /** Maximum depth allowed for follow-up question chains. */
  MAX_FOLLOW_UP_DEPTH: 2,
  /** Report ID generation: random string length. */
  REPORT_ID_RANDOM_LENGTH: 6,
  /** localStorage key prefix for saved reports. */
  STORAGE_KEY_PREFIX: 'report_',
  /** Mock decompose delay in milliseconds. */
  MOCK_DECOMPOSE_DELAY_MS: 500,
  /** Default replay speed multiplier. */
  DEFAULT_REPLAY_SPEED: 1,
  /** Default token delay range in milliseconds for mock streaming. */
  MOCK_TOKEN_DELAY_MIN: 30,
  MOCK_TOKEN_DELAY_MAX: 80,
} as const;

/** URL query parameter name for switching to replay/mock mode. */
export const MODE_PARAM: string = 'mode';
export const MODE_REPLAY: string = 'replay';
