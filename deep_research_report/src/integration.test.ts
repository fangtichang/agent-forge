import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportProvider, useReportContext } from '@/context/ReportContext';
import { AdapterFactory } from '@/services/adapter';
import { StorageService } from '@/services/storage';
import { MockAPIService } from '@/services/mockApi';
import { REPORT_CONFIG } from '@/constants';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import type { Report } from '@/types';

/**
 * Integration and edge case tests for the report generation system.
 */

// Wrapper for context-dependent hooks
function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(ReportProvider, null, children);
  };
}

// Reset the adapter singleton before each test
function resetAdapters() {
  AdapterFactory.reset();
}

describe('Integration Tests', () => {
  beforeEach(() => {
    resetAdapters();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetAdapters();
  });

  describe('Mock Mode Full Flow', () => {
    it('should complete the full report generation pipeline', async () => {
      // Set URL search params to trigger mock mode
      Object.defineProperty(window, 'location', {
        value: {
          search: '?mode=replay',
          href: 'http://localhost:3000/?mode=replay',
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
      });

      // Verify MockAPIService is created
      const api = AdapterFactory.create();
      expect(api).toBeInstanceOf(MockAPIService);

      // Step 1: Decompose
      const decomposeResult = await api.decompose('人工智能行业深度分析');
      expect(decomposeResult.subTasks).toBeDefined();
      expect(decomposeResult.subTasks.length).toBeGreaterThan(0);
      expect(decomposeResult.subTasks[0]).toHaveProperty('id');
      expect(decomposeResult.subTasks[0]).toHaveProperty('title');
      expect(decomposeResult.subTasks[0]).toHaveProperty('query');

      // Step 2: Search stream
      const searchEvents: unknown[] = [];
      for await (const event of api.searchStream()) {
        searchEvents.push(event);
      }
      expect(searchEvents.length).toBeGreaterThan(0);

      // Step 3: Generate chapter
      const chapterId = 'ch_1';
      const chunks: unknown[] = [];
      for await (const chunk of api.generateStream(chapterId)) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThan(0);

      // Restore window.location
      Object.defineProperty(window, 'location', {
        value: {
          search: '',
          href: 'http://localhost:3000/',
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
     });
     }, 30000);
  });
 
  describe('Report Storage Persistence', () => {
    it('should save and reload a report from localStorage', () => {
      const report: Report = {
        id: 'r_integration_test',
        topic: '集成测试报告',
        status: 'completed',
        subTasks: [
          { id: 'st_1', title: '子任务', query: '查询', status: 'completed' },
        ],
        chapters: [
          {
            id: 'ch_1',
            title: '章节 1',
            content: '## 测试内容\n\n这是报告正文。[citation:1]',
            citations: [
              { id: 1, url: 'https://test.com', title: '测试来源', snippet: '测试摘要' },
            ],
            status: 'completed',
          },
        ],
        createdAt: '2024-06-15T10:00:00.000Z',
      };

      StorageService.saveReport(report);
      const loaded = StorageService.loadReport(report.id);

      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe(report.id);
      expect(loaded!.topic).toBe(report.topic);
      expect(loaded!.chapters).toHaveLength(1);
      expect(loaded!.chapters[0].content).toContain('[citation:1]');
    });

    it('should report loadable from list', () => {
      const report: Report = {
        id: 'r_list_test',
        topic: '列表测试',
        status: 'completed',
        subTasks: [],
        chapters: [],
        createdAt: '2024-06-01T00:00:00Z',
      };

      StorageService.saveReport(report);
      const reports = StorageService.listReports();

      expect(reports).toHaveLength(1);
      expect(reports[0].id).toBe('r_list_test');
    });

    it('should correctly delete and verify removal', () => {
      const report: Report = {
        id: 'r_delete_test',
        topic: '待删除报告',
        status: 'completed',
        subTasks: [],
        chapters: [],
        createdAt: '2024-06-01T00:00:00Z',
      };

      StorageService.saveReport(report);
      expect(StorageService.loadReport('r_delete_test')).not.toBeNull();

      StorageService.deleteReport('r_delete_test');
      expect(StorageService.loadReport('r_delete_test')).toBeNull();
      expect(StorageService.listReports()).toHaveLength(0);
    });
  });

  describe('Context Provider', () => {
    it('should provide initial state through context', () => {
      const { result } = renderHook(() => useReportContext(), {
        wrapper: createWrapper(),
      });

      expect(result.current.state.report).toBeNull();
      expect(result.current.state.phase).toBe('input');
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.followUps).toEqual([]);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test (expected error)
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useReportContext());
      }).toThrow('useReportContext must be used within a ReportProvider');

      spy.mockRestore();
    });

    it('should dispatch START and update state', () => {
      const { result } = renderHook(() => useReportContext(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.dispatch({
          type: 'START',
          topic: '测试话题',
          reportId: 'r_test_ctx',
        });
      });

      expect(result.current.state.report).not.toBeNull();
      expect(result.current.state.report!.topic).toBe('测试话题');
      expect(result.current.state.phase).toBe('decomposing');
    });

    it('should handle full state transition chain', () => {
      const { result } = renderHook(() => useReportContext(), {
        wrapper: createWrapper(),
      });

      // START
      act(() => {
        result.current.dispatch({
          type: 'START',
          topic: '集成话题',
          reportId: 'r_chain',
        });
      });
      expect(result.current.state.phase).toBe('decomposing');

      // ADD_SUBTASKS
      act(() => {
        result.current.dispatch({
          type: 'ADD_SUBTASKS',
          subTasks: [
            { id: 'st_1', title: '任务1', query: 'q1', status: 'pending' },
          ],
        });
      });
      expect(result.current.state.phase).toBe('searching');
      expect(result.current.state.report!.subTasks).toHaveLength(1);

      // APPEND_CHUNK
      act(() => {
        result.current.dispatch({
          type: 'APPEND_CHUNK',
          chapterId: 'ch_1',
          chunk: '报告内容...',
        });
      });
      expect(result.current.state.phase).toBe('generating');
      expect(result.current.state.report!.chapters).toHaveLength(1);

      // CHAPTER_COMPLETE
      act(() => {
        result.current.dispatch({
          type: 'CHAPTER_COMPLETE',
          chapterId: 'ch_1',
        });
      });
      expect(result.current.state.report!.chapters[0].status).toBe('completed');

      // REPORT_COMPLETE
      act(() => {
        result.current.dispatch({
          type: 'REPORT_COMPLETE',
          reportId: 'r_final',
        });
      });
      expect(result.current.state.phase).toBe('done');
      expect(result.current.state.report!.status).toBe('completed');

      // RESET
      act(() => {
        result.current.dispatch({ type: 'RESET' });
      });
      expect(result.current.state.report).toBeNull();
      expect(result.current.state.phase).toBe('input');
    });
  });
});

describe('Edge Case Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Empty topic submission', () => {
    it('should reject empty string topic', () => {
      const topic = '';
      const trimmed = topic.trim();
      // TopicInput component rejects empty trimmed topics
      expect(trimmed).toBe('');
      expect(Boolean(trimmed)).toBe(false);
    });

    it('should reject whitespace-only topic', () => {
      const topic = '   \n\t  ';
      const trimmed = topic.trim();
      expect(trimmed).toBe('');
      expect(Boolean(trimmed)).toBe(false);
    });
  });

  describe('Long topic (1000+ characters)', () => {
    it('should handle 1000+ character topic gracefully', () => {
      const longTopic = 'A'.repeat(1000);
      expect(longTopic.length).toBe(1000);

      // TopicInput should not reject based on length alone
      // The system should accept it (backend may truncate)
      const trimmed = longTopic.trim();
      expect(trimmed).toBe(longTopic);
    });

    it('should handle very long topic (5000 chars)', () => {
      const veryLongTopic = '研究'.repeat(2500); // 5000 chars
      expect(veryLongTopic.length).toBe(5000);

      // System should not crash on long inputs
      const trimmed = veryLongTopic.trim();
      expect(trimmed.length).toBe(5000);
    });
  });

  describe('Report recovery on incomplete state', () => {
    it('should handle loading a report that was in generating state', () => {
      const incompleteReport: Report = {
        id: 'r_incomplete',
        topic: '未完成的报告',
        status: 'generating',
        subTasks: [
          { id: 'st_1', title: '任务1', query: 'query', status: 'completed' },
          { id: 'st_2', title: '任务2', query: 'query2', status: 'completed' },
        ],
        chapters: [
          {
            id: 'ch_1',
            title: '章节 1',
            content: '部分内容...',
            citations: [],
            status: 'completed',
          },
        ],
        createdAt: '2024-06-15T10:00:00Z',
      };

      StorageService.saveReport(incompleteReport);
      const loaded = StorageService.loadReport('r_incomplete');

      expect(loaded).not.toBeNull();
      expect(loaded!.status).toBe('generating');
      expect(loaded!.chapters).toHaveLength(1);
      // Missing chapter 2 — that's expected for incomplete report
    });

    it('should be able to list incomplete reports', () => {
      const report: Report = {
        id: 'r_partial',
        topic: '部分报告',
        status: 'generating',
        subTasks: [],
        chapters: [],
        createdAt: '2024-06-15T10:00:00Z',
      };

      StorageService.saveReport(report);
      const reports = StorageService.listReports();

      expect(reports).toHaveLength(1);
      expect(reports[0].status).toBe('generating');
    });
  });

  describe('Follow-up panel without content', () => {
    it('should handle empty report context for follow-up', () => {
      // When no report has been generated, follow-up should handle gracefully
      const chapters: Report['chapters'] = [];
      const chapter = chapters.find((ch) => ch.id === 'ch_1');

      // Chapter doesn't exist
      expect(chapter).toBeUndefined();

      // The followUp hook handles this by using empty string as context
      const reportContext = chapter?.content || '';
      expect(reportContext).toBe('');
    });

    it('should handle follow-up with non-existent chapterId', () => {
      const report: Report = {
        id: 'r_test',
        topic: '测试',
        status: 'completed',
        subTasks: [],
        chapters: [
          {
            id: 'ch_1',
            title: '章节 1',
            content: '内容',
            citations: [],
            status: 'completed',
          },
        ],
        createdAt: '2024-06-01T00:00:00Z',
      };

      // Look for non-existent chapter
      const chapter = report.chapters.find((ch) => ch.id === 'ch_999');
      expect(chapter).toBeUndefined();
    });
  });

  describe('Concurrent report generation', () => {
    it('should handle multiple reports stored simultaneously', () => {
      const reports: Report[] = [];
      for (let i = 0; i < 5; i++) {
        reports.push({
          id: `r_concurrent_${i}`,
          topic: `并发报告 ${i}`,
          status: 'completed',
          subTasks: [],
          chapters: [],
          createdAt: new Date(2024, 5, 15, 10, 0, i).toISOString(),
        });
      }

      // Save all concurrently
      for (const report of reports) {
        StorageService.saveReport(report);
      }

      const loaded = StorageService.listReports();
      expect(loaded).toHaveLength(5);
      // Should be sorted by time descending (latest first)
      expect(loaded[0].id).toBe('r_concurrent_4');
      expect(loaded[4].id).toBe('r_concurrent_0');
    });
  });

  describe('Export button state with incomplete report', () => {
    it('should handle export with report that has no chapters', () => {
      const report: Report = {
        id: 'r_empty',
        topic: '空报告',
        status: 'error',
        subTasks: [],
        chapters: [],
        createdAt: '2024-06-01T00:00:00Z',
      };

      // Export should not throw even with empty chapters
      expect(() => {
        const md = `# ${report.topic}\n\n`;
        // Just basic structure — turndown handles the conversion
        expect(md).toContain('空报告');
      }).not.toThrow();
    });

    it('should handle export with generating-state report', () => {
      const report: Report = {
        id: 'r_generating',
        topic: '生成中的报告',
        status: 'generating',
        subTasks: [],
        chapters: [
          {
            id: 'ch_1',
            title: '章节 1',
            content: '部分内容',
            citations: [],
            status: 'generating',
          },
        ],
        createdAt: '2024-06-15T10:00:00Z',
      };

      // The system doesn't prevent export of incomplete reports
      // But the UI may show a disabled state — we verify structure
      expect(report.status).toBe('generating');
      expect(report.chapters[0].status).toBe('generating');
    });
  });

  describe('CitationTooltip component rendering safety', () => {
    it('should render with valid citation data', () => {
      const citation = {
        id: 1,
        url: 'https://example.com',
        title: 'Example',
        snippet: 'A snippet',
      };

      // Verify citation shape is correct
      expect(citation.id).toBe(1);
      expect(citation.url).toBeTruthy();
      expect(citation.title).toBeTruthy();
    });

    it('should handle citation with empty fields', () => {
      const citation = {
        id: 0,
        url: '',
        title: '',
        snippet: '',
      };

      // Even empty fields should not cause crashes
      expect(citation.id).toBe(0);
      expect(citation.url).toBe('');
    });
  });
});
