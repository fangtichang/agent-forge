import { REPORT_CONFIG } from '@/constants';

/**
 * Creates an async generator that yields SSE events from a fetch stream.
 *
 * Uses fetch + ReadableStream instead of EventSource for:
 * - POST request support
 * - Custom headers
 * - Better error handling and reconnection
 *
 * @param url - The SSE endpoint URL
 * @param options - Fetch options (method, headers, body)
 * @returns AsyncGenerator that yields parsed SSE data events
 */
export async function* createSSEGenerator<T>(
  url: string,
  options?: RequestInit,
): AsyncGenerator<T> {
  let attempt = 0;

  while (attempt <= REPORT_CONFIG.MAX_SSE_RECONNECT) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: 'text/event-stream',
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('SSE response has no readable body');
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
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6).trim();

              if (data === '[DONE]') {
                return;
              }

              try {
                const parsed = JSON.parse(data) as T;
                yield parsed;
              } catch {
                // Skip malformed JSON lines
                console.warn('Failed to parse SSE data:', data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // If we got here normally, break the retry loop
      break;
    } catch (err) {
      attempt++;
      if (attempt > REPORT_CONFIG.MAX_SSE_RECONNECT) {
        throw new Error(
          `SSE connection failed after ${REPORT_CONFIG.MAX_SSE_RECONNECT} attempts: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        );
      }

      // Exponential backoff before retry
      const delay =
        REPORT_CONFIG.SSE_RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(
        `SSE connection attempt ${attempt}/${REPORT_CONFIG.MAX_SSE_RECONNECT} failed, retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
