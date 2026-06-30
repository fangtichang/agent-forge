import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from './storage';
import { REPORT_CONFIG } from '@/constants';
import type { Report } from '@/types';

function createMockReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'r_test123',
    topic: '测试报告',
    status: 'completed',
    subTasks: [],
    chapters: [],
    createdAt: new Date('2024-06-15T10:00:00Z').toISOString(),
    ...overrides,
  };
}

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateId()', () => {
    it('should generate a unique ID with r_ prefix', () => {
      const id = StorageService.generateId();
      expect(id).toMatch(/^r_[a-z0-9]+_[a-z0-9]+$/);
    });

    it('should generate different IDs on each call', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(StorageService.generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('saveReport() and loadReport()', () => {
    it('should save and load a report correctly', () => {
      const report = createMockReport();
      StorageService.saveReport(report);

      const loaded = StorageService.loadReport(report.id);
      expect(loaded).toEqual(report);
    });

    it('should return null for non-existent report', () => {
      const loaded = StorageService.loadReport('non_existent');
      expect(loaded).toBeNull();
    });

    it('should overwrite existing report with same ID', () => {
      const report1 = createMockReport({ topic: '原始' });
      StorageService.saveReport(report1);

      const report2 = createMockReport({ topic: '更新后' });
      StorageService.saveReport(report2);

      const loaded = StorageService.loadReport(report1.id);
      expect(loaded?.topic).toBe('更新后');
    });

    it('should save report with all fields intact', () => {
      const report = createMockReport({
        subTasks: [
          { id: 'st_1', title: '子任务1', query: 'query1', status: 'completed' },
        ],
        chapters: [
          {
            id: 'ch_1',
            title: '章节1',
            content: '## 内容\n\n段落文本[citation:1]',
            citations: [
              { id: 1, url: 'https://example.com', title: '来源', snippet: '摘要' },
            ],
            status: 'completed',
          },
        ],
      });

      StorageService.saveReport(report);
      const loaded = StorageService.loadReport(report.id);

      expect(loaded).not.toBeNull();
      expect(loaded!.subTasks).toHaveLength(1);
      expect(loaded!.chapters).toHaveLength(1);
      expect(loaded!.chapters[0].content).toContain('[citation:1]');
      expect(loaded!.chapters[0].citations).toHaveLength(1);
    });
  });

  describe('listReports()', () => {
    it('should return empty array when no reports saved', () => {
      const reports = StorageService.listReports();
      expect(reports).toEqual([]);
    });

    it('should list all saved reports', () => {
      const report1 = createMockReport({ id: 'r_1', topic: '报告1' });
      const report2 = createMockReport({ id: 'r_2', topic: '报告2' });

      StorageService.saveReport(report1);
      StorageService.saveReport(report2);

      const reports = StorageService.listReports();
      expect(reports).toHaveLength(2);
      expect(reports.map((r) => r.topic)).toContain('报告1');
      expect(reports.map((r) => r.topic)).toContain('报告2');
    });

    it('should sort reports by createdAt descending', () => {
      const older = createMockReport({
        id: 'r_1',
        topic: '旧的',
        createdAt: '2024-01-01T00:00:00Z',
      });
      const newer = createMockReport({
        id: 'r_2',
        topic: '新的',
        createdAt: '2024-06-15T00:00:00Z',
      });

      StorageService.saveReport(older);
      StorageService.saveReport(newer);

      const reports = StorageService.listReports();
      expect(reports[0].topic).toBe('新的');
      expect(reports[1].topic).toBe('旧的');
    });

    it('should skip corrupted JSON entries gracefully', () => {
      // Manually insert malformed JSON
      localStorage.setItem(`${REPORT_CONFIG.STORAGE_KEY_PREFIX}bad`, '{invalid json!!!');

      const report = createMockReport({ id: 'r_good', topic: '正常报告' });
      StorageService.saveReport(report);

      const reports = StorageService.listReports();
      // Should only contain the valid report, skipping the corrupted one
      expect(reports).toHaveLength(1);
      expect(reports[0].topic).toBe('正常报告');
    });

    it('should not include non-report keys', () => {
      localStorage.setItem('some_other_key', 'value');
      const report = createMockReport({ id: 'r_test', topic: '唯一报告' });
      StorageService.saveReport(report);

      const reports = StorageService.listReports();
      expect(reports).toHaveLength(1);
      expect(reports[0].topic).toBe('唯一报告');
    });
  });

  describe('deleteReport()', () => {
    it('should delete a saved report', () => {
      const report = createMockReport();
      StorageService.saveReport(report);
      expect(StorageService.loadReport(report.id)).not.toBeNull();

      StorageService.deleteReport(report.id);
      expect(StorageService.loadReport(report.id)).toBeNull();
    });

    it('should not throw when deleting non-existent report', () => {
      expect(() => StorageService.deleteReport('non_existent')).not.toThrow();
    });

    it('should only delete the specified report', () => {
      const report1 = createMockReport({ id: 'r_1', topic: '报告1' });
      const report2 = createMockReport({ id: 'r_2', topic: '报告2' });

      StorageService.saveReport(report1);
      StorageService.saveReport(report2);
      StorageService.deleteReport('r_1');

      expect(StorageService.loadReport('r_1')).toBeNull();
      expect(StorageService.loadReport('r_2')).not.toBeNull();
    });
  });

  describe('malformed data recovery', () => {
    it('should return null when loading malformed JSON', () => {
      const key = `${REPORT_CONFIG.STORAGE_KEY_PREFIX}malformed`;
      localStorage.setItem(key, 'not valid json {{{');

      const loaded = StorageService.loadReport('malformed');
      expect(loaded).toBeNull();
    });

    it('should handle empty localStorage gracefully', () => {
      localStorage.clear();
      const reports = StorageService.listReports();
      expect(reports).toEqual([]);
    });

    it('should continue listing after encountering corrupted entry', () => {
      const key1 = `${REPORT_CONFIG.STORAGE_KEY_PREFIX}bad1`;
      const key2 = `${REPORT_CONFIG.STORAGE_KEY_PREFIX}bad2`;

      localStorage.setItem(key1, '{{corrupted');
      localStorage.setItem(key2, '}}also bad');

      const report = createMockReport({ id: 'r_good', topic: '唯一有效' });
      StorageService.saveReport(report);

      const reports = StorageService.listReports();
      expect(reports).toHaveLength(1);
      expect(reports[0].id).toBe('r_good');
    });
  });
});
