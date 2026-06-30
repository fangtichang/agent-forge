import type {
  IReportAPI,
  DecomposeEvent,
  SearchProgressEvent,
  GenerateChunkEvent,
  FollowUpRequest,
} from '@/types';
import { API_BASE_URL } from '@/constants';

/**
 * RealAPIService communicates with the backend API for actual LLM-driven
 * report generation.
 *
 * In MVP mode, the backend may not be available. All methods will attempt
 * to call the real API and throw on failure, allowing the upper layer
 * (AdapterFactory / useReport hook) to fallback to MockAPIService.
 */
export class RealAPIService implements IReportAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Send the topic to the backend for decomposition into sub-tasks.
   */
  async decompose(topic: string): Promise<DecomposeEvent> {
    const response = await this.fetchWithError(
      `${this.baseUrl}/decompose`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      },
    );

    if (!response.ok) {
      throw new Error(`Decompose failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Stream search progress events from the backend via SSE.
   * In MVP, throws to trigger fallback.
   */
  async *searchStream(): AsyncGenerator<SearchProgressEvent> {
    const response = await this.fetchSse(`${this.baseUrl}/search/stream`);

    if (!response.ok || !response.body) {
      throw new Error('Search stream not available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data) as SearchProgressEvent;
              yield parsed;
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Stream chapter generation chunks from the backend.
   * In MVP, throws to trigger fallback.
   */
  async *generateStream(chapterId: string): AsyncGenerator<GenerateChunkEvent> {
    const response = await this.fetchSse(
      `${this.baseUrl}/generate/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      },
    );

    if (!response.ok || !response.body) {
      throw new Error('Generate stream not available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data) as GenerateChunkEvent;
              yield parsed;
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Stream follow-up answer from the backend.
   * In MVP, throws to trigger fallback.
   */
  async *followUpStream(req: FollowUpRequest): AsyncGenerator<GenerateChunkEvent> {
    const response = await this.fetchSse(
      `${this.baseUrl}/follow-up/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      },
    );

    if (!response.ok || !response.body) {
      throw new Error('Follow-up stream not available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data) as GenerateChunkEvent;
              yield parsed;
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /** Fetch wrapper with error handling and timeout. */
  private async fetchWithError(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } catch (err) {
      throw new Error(
        `API request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Fetch for SSE streams with appropriate headers. */
  private async fetchSse(
    url: string,
    options?: RequestInit,
  ): Promise<Response> {
    return fetch(url, {
      ...options,
      headers: {
        Accept: 'text/event-stream',
        ...(options?.headers || {}),
      },
    });
  }
}
