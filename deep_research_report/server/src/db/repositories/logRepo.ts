import { logger } from '../../logger.js';

/**
 * Log Repository �?records API calls (LLM/Search) for monitoring and billing.
 *
 * All functions are best-effort: failures are logged via console.warn only.
 * Logging must never interrupt the request flow.
 */
import { query } from '../connection.js';
import type { ApiCallLogRow } from '../types.js';

export interface ApiCallLogInput {
  reportId?: string;
  service: string;
  provider?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  costUsd?: number;
  status?: string;
  errorMessage?: string;
}

/**
 * Record an API call to the api_call_logs table.
 *
 * @param data - Call metadata. All fields except `service` are optional.
 */
export async function logApiCall(data: ApiCallLogInput): Promise<void> {
  try {
    await query<ApiCallLogRow>(
      `INSERT INTO api_call_logs
         (report_id, service, provider, model, tokens_in, tokens_out,
          latency_ms, cost_usd, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.reportId || null,
        data.service,
        data.provider || null,
        data.model || null,
        data.tokensIn || 0,
        data.tokensOut || 0,
        data.latencyMs || null,
        data.costUsd || 0,
        data.status || 'success',
        data.errorMessage || null,
      ],
    );
  } catch (err) {
    logger.warn({ err: (err as Error).message }, '[LogRepo] Failed to record API call:');
  }
}
