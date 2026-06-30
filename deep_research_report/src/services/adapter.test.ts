/**
 * AdapterFactory unit tests.
 *
 * Tests mode selection, async backend detection, and mode detection promises.
 * Uses global mocks for window.location and fetch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdapterFactory, waitForModeDetection } from '@/services/adapter';
import { MockAPIService } from '@/services/mockApi';
import { RealAPIService } from '@/services/realApi';

// Helper: set URL search params
function setUrlSearch(search: string): void {
  Object.defineProperty(window, 'location', {
    value: {
      search,
      href: `http://localhost:3000/${search}`,
      pathname: '/',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
}

describe('AdapterFactory', () => {
  beforeEach(() => {
    AdapterFactory.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    AdapterFactory.reset();
  });

  describe('mode selection via URL params', () => {
    it('should return MockAPIService when ?mode=replay', () => {
      setUrlSearch('?mode=replay');
      const api = AdapterFactory.create();
      expect(api).toBeInstanceOf(MockAPIService);
      expect(AdapterFactory.mode).toBe('mock');
    });

    it('should return RealAPIService when ?mode=live', () => {
      setUrlSearch('?mode=live');
      const api = AdapterFactory.create();
      expect(api).toBeInstanceOf(RealAPIService);
      expect(AdapterFactory.mode).toBe('live');
    });
  });

  describe('auto-detect mode', () => {
    it('should return MockAPIService when detectBackend fails', async () => {
      // Mock fetch to reject (backend unreachable)
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

      setUrlSearch('');
      const api = AdapterFactory.create();

      // Initially returns Mock while detection runs
      expect(api).toBeInstanceOf(MockAPIService);
      expect(AdapterFactory.mode).toBe('mock');
      expect(AdapterFactory.detected).toBe(false);

      // Wait for detection to complete
      const mode = await waitForModeDetection();
      expect(AdapterFactory.detected).toBe(true);
      expect(AdapterFactory.mode).toBe('mock');
      expect(mode).toBe('mock');
    });

    it('should swap to RealAPIService when backend responds with JSON', async () => {
      // Mock fetch to return a healthy JSON response
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          headers: new Map([['content-type', 'application/json; charset=utf-8']]),
        }),
      ));

      setUrlSearch('');
      const api = AdapterFactory.create();

      // Initially returns Mock while detection runs
      expect(api).toBeInstanceOf(MockAPIService);

      // Wait for detection to complete and swap to Real
      const mode = await waitForModeDetection();
      expect(AdapterFactory.mode).toBe('live');
      expect(mode).toBe('live');

      // Subsequent create() returns the swapped Real instance
      const api2 = AdapterFactory.create();
      expect(api2).toBeInstanceOf(RealAPIService);
    });

    it('should stay on Mock when response is non-JSON (nginx fallback)', async () => {
      // Mock fetch to return HTML (nginx SPA fallback)
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          headers: new Map([['content-type', 'text/html; charset=utf-8']]),
        }),
      ));

      setUrlSearch('');
      const api = AdapterFactory.create();
      expect(api).toBeInstanceOf(MockAPIService);

      const mode = await waitForModeDetection();
      expect(AdapterFactory.mode).toBe('mock');
      expect(mode).toBe('mock');
    });

    it('should stay on Mock when backend returns 503', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
          headers: new Map([['content-type', 'application/json']]),
        }),
      ));

      setUrlSearch('');
      const api = AdapterFactory.create();
      expect(api).toBeInstanceOf(MockAPIService);

      const mode = await waitForModeDetection();
      expect(AdapterFactory.mode).toBe('mock');
      expect(mode).toBe('mock');
    });
  });

  describe('waitForModeDetection', () => {
    it('should resolve immediately if detection already completed', async () => {
      setUrlSearch('?mode=replay');
      AdapterFactory.create(); // Sets detected = true synchronously

      const mode = await waitForModeDetection();
      expect(mode).toBe('mock');
    });

    it('should resolve when detection completes asynchronously', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          headers: new Map([['content-type', 'application/json; charset=utf-8']]),
        }),
      ));

      setUrlSearch('');
      AdapterFactory.create(); // Starts async detection

      const mode = await waitForModeDetection();
      expect(mode).toBe('live');
    });

    it('should resolve with safety timeout if detection hangs', async () => {
      // Mock fetch to never resolve
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

      setUrlSearch('');
      AdapterFactory.create();

      const mode = await waitForModeDetection();
      expect(AdapterFactory.mode).toBe('mock'); // Default after timeout
      expect(mode).toBe('mock');
    }, 7000); // Give enough time for safety timeout (5s) + buffer
  });

  describe('create() singleton', () => {
    it('should return the same instance after first call', () => {
      setUrlSearch('?mode=replay');
      const api1 = AdapterFactory.create();
      const api2 = AdapterFactory.create();
      expect(api1).toBe(api2); // Same reference
    });

    it('should reset and create fresh instance', () => {
      setUrlSearch('?mode=replay');
      const api1 = AdapterFactory.create();
      AdapterFactory.reset();

      expect(AdapterFactory.detected).toBe(false);
      expect(AdapterFactory.mode).toBe('mock');

      const api2 = AdapterFactory.create();
      expect(api2).not.toBe(api1); // Different reference
    });
  });
});
