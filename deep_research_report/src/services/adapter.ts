import type { IReportAPI } from '@/types';
import { MODE_PARAM, MODE_REPLAY, MODE_LIVE, API_BASE_URL } from '@/constants';
import { RealAPIService } from './realApi';
import { MockAPIService } from './mockApi';

/**
 * AdapterFactory selects the appropriate API implementation based on
 * the current mode (URL parameter or automatic detection).
 *
 * Mode selection priority:
 * 1. URL param ?mode=live    â†?Force RealAPIService (skip health check)
 * 2. URL param ?mode=replay  â†?Force MockAPIService
 * 3. Default (auto-detect)   â†?Try health check; Mock if backend unreachable
 *
 * Health check result is cached for the session to avoid repeated pings.
 */
export class AdapterFactory {
  private static instance: IReportAPI | null = null;
  private static _mode: 'live' | 'mock' = 'mock';
  private static _detected: boolean = false;

  /** Current active mode â€?'live' (real backend) or 'mock' (offline replay). */
  static get mode(): 'live' | 'mock' {
    return AdapterFactory._mode;
  }

  /** Whether auto-detection has run. */
  static get detected(): boolean {
    return AdapterFactory._detected;
  }

  /**
   * Create or retrieve the singleton API service instance.
   *
   * On first call, detects mode: URL param override or auto-detect.
   * Subsequent calls return the same instance.
   */
  static create(): IReportAPI {
    if (AdapterFactory.instance) {
      return AdapterFactory.instance;
    }

    const params = new URLSearchParams(window.location.search);
    const mode = params.get(MODE_PARAM);

    if (mode === MODE_REPLAY) {
      AdapterFactory.instance = new MockAPIService();
      AdapterFactory._mode = 'mock';
      AdapterFactory._detected = true;
    } else if (mode === MODE_LIVE) {
      AdapterFactory.instance = new RealAPIService();
      AdapterFactory._mode = 'live';
      AdapterFactory._detected = true;
    } else {
      // Auto-detect: create Mock first, then swap to Real if backend is alive
      AdapterFactory.instance = new MockAPIService();
      AdapterFactory._mode = 'mock';
      // Kick off async health check; swap to Real if backend responds
      AdapterFactory.detectBackend();
    }

    return AdapterFactory.instance;
  }

  /**
   * Ping the backend health endpoint to determine availability.
   *
   * Runs asynchronously after first render. If the backend responds within
   * the timeout window, swaps the singleton to RealAPIService.
   */
  private static async detectBackend(): Promise<void> {
    if (AdapterFactory._detected) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      // Verify the response is actually JSON from a real backend,
      // not HTML from nginx's SPA fallback (try_files $uri /index.html).
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (response.ok && isJson) {
        // Backend is alive â€?swap to RealAPIService
        AdapterFactory.instance = new RealAPIService();
        AdapterFactory._mode = 'live';
        console.debug('[AdapterFactory] Backend detected â€?switching to Live API mode');
      } else {
        // Got HTML fallback or non-200 â€?no real backend
        console.debug('[AdapterFactory] Backend not available (got non-JSON response) â€?using Mock replay mode');
      }
    } catch {
      // Backend unreachable â€?stay on Mock
      console.debug('[AdapterFactory] Backend not available â€?using Mock replay mode');
    } finally {
      AdapterFactory._detected = true;
    }
  }

  /** Reset the singleton instance (useful for testing). */
  static reset(): void {
    AdapterFactory.instance = null;
    AdapterFactory._mode = 'mock';
    AdapterFactory._detected = false;
  }
}

/**
 * Subscribe to mode detection completion.
 *
 * Returns a Promise that resolves when auto-detection finishes,
 * along with the final detected mode.
 */
export function waitForModeDetection(): Promise<'live' | 'mock'> {
  return new Promise((resolve) => {
    if (AdapterFactory.detected) {
      resolve(AdapterFactory.mode);
      return;
    }

    const check = setInterval(() => {
      if (AdapterFactory.detected) {
        clearInterval(check);
        resolve(AdapterFactory.mode);
      }
    }, 100);

    // Safety timeout: force resolve after 5s
    setTimeout(() => {
      clearInterval(check);
      resolve(AdapterFactory.mode);
    }, 5000);
  });
}
