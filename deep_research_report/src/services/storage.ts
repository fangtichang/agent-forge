import type { Report } from '@/types';
import { REPORT_CONFIG } from '@/constants';

/**
 * StorageService wraps localStorage for report persistence.
 *
 * Key format: report_{reportId}
 * Provides CRUD operations for saved reports.
 */
export class StorageService {
  /**
   * Generate a unique report ID.
   * Format: r_{timestamp}_{random6}
   */
  static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 2 + REPORT_CONFIG.REPORT_ID_RANDOM_LENGTH);
    return `r_${timestamp}_${random}`;
  }

  /**
   * Save a report to localStorage.
   * @param report - The report to persist
   */
  static saveReport(report: Report): void {
    const key = `${REPORT_CONFIG.STORAGE_KEY_PREFIX}${report.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(report));
    } catch (err) {
      console.error('Failed to save report to localStorage:', err);
    }
  }

  /**
   * Load a report from localStorage by ID.
   * @param id - Report ID
   * @returns The report or null if not found
   */
  static loadReport(id: string): Report | null {
    const key = `${REPORT_CONFIG.STORAGE_KEY_PREFIX}${id}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as Report;
    } catch (err) {
      console.error('Failed to load report from localStorage:', err);
      return null;
    }
  }

  /**
   * List all saved reports, sorted by creation date descending.
   */
  static listReports(): Report[] {
    const reports: Report[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(REPORT_CONFIG.STORAGE_KEY_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              reports.push(JSON.parse(raw) as Report);
            } catch {
              // Skip corrupted entries
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to list reports from localStorage:', err);
    }
    return reports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Delete a report from localStorage by ID.
   * @param id - Report ID
   */
  static deleteReport(id: string): void {
    const key = `${REPORT_CONFIG.STORAGE_KEY_PREFIX}${id}`;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('Failed to delete report from localStorage:', err);
    }
  }
}
