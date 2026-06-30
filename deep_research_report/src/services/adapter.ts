import type { IReportAPI } from '@/types';
import { MODE_PARAM, MODE_REPLAY } from '@/constants';
import { RealAPIService } from './realApi';
import { MockAPIService } from './mockApi';

/**
 * AdapterFactory selects the appropriate API implementation based on
 * the current mode (URL parameter or fallback logic).
 *
 * Mode selection priority:
 * 1. URL param ?mode=replay → MockAPIService
 * 2. Default → RealAPIService (which may fail and fallback to Mock)
 */
export class AdapterFactory {
  private static instance: IReportAPI | null = null;

  /**
   * Create or retrieve the singleton API service instance.
   *
   * Detects mode from URL search params. In replay mode, always returns MockAPIService.
   * In normal mode, returns RealAPIService (which internally handles fallback).
   */
  static create(): IReportAPI {
    if (AdapterFactory.instance) {
      return AdapterFactory.instance;
    }

    const params = new URLSearchParams(window.location.search);
    const mode = params.get(MODE_PARAM);

    if (mode === MODE_REPLAY) {
      AdapterFactory.instance = new MockAPIService();
    } else {
      AdapterFactory.instance = new RealAPIService();
    }

    return AdapterFactory.instance;
  }

  /** Reset the singleton instance (useful for testing). */
  static reset(): void {
    AdapterFactory.instance = null;
  }
}
