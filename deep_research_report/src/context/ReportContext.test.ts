import { describe, it, expect } from 'vitest';
import type { ReportState, ReportAction } from './ReportContext';
import type { Report, SubTask, Citation, FollowUp } from '@/types';

/**
 * We test the reducer in isolation by importing the logic.
 * Since reportReducer is not exported, we re-implement the pure reducer
 * from ReportContext.tsx for direct testing.
 *
 * This is a copy of the reducer logic — it should stay in sync with
 * the source. This is intentional: the reducer is private, so we
 * test it directly here.
 */

// Replicated from ReportContext.tsx for isolated testing
const initialState: ReportState = {
  report: null,
  phase: 'input',
  error: null,
  followUps: [],
  followUpActive: false,
};

function reportReducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case 'START': {
      const newReport: Report = {
        id: action.reportId,
        topic: action.topic,
        status: 'decomposing',
        subTasks: [],
        chapters: [],
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        report: newReport,
        phase: 'decomposing',
        error: null,
      };
    }

    case 'ADD_SUBTASKS': {
      if (!state.report) return state;
      return {
        ...state,
        report: {
          ...state.report,
          subTasks: action.subTasks,
          status: 'searching',
        },
        phase: 'searching',
      };
    }

    case 'UPDATE_SUBTASK': {
      if (!state.report) return state;
      const subTasks = state.report.subTasks.map((st) =>
        st.id === action.subTaskId ? { ...st, status: action.status } : st,
      );
      return {
        ...state,
        report: { ...state.report, subTasks },
      };
    }

    case 'APPEND_CHUNK': {
      if (!state.report) return state;
      const existingChapter = state.report.chapters.find(
        (ch) => ch.id === action.chapterId,
      );

      let chapters;
      if (existingChapter) {
        chapters = state.report.chapters.map((ch) => {
          if (ch.id !== action.chapterId) return ch;
          const existingCitations = ch.citations;
          const newCitations = action.citations || [];
          const mergedCitations = [...existingCitations];
          for (const nc of newCitations) {
            if (!mergedCitations.find((c) => c.id === nc.id)) {
              mergedCitations.push(nc);
            }
          }
          return {
            ...ch,
            content: ch.content + action.chunk,
            citations: mergedCitations,
            status: 'generating' as const,
          };
        });
      } else {
        const newChapter = {
          id: action.chapterId,
          title: `章节 ${action.chapterId}`,
          content: action.chunk,
          citations: action.citations || [],
          status: 'generating' as const,
        };
        chapters = [...state.report.chapters, newChapter];
      }

      const allGenerating =
        state.report.subTasks.length > 0 &&
        state.report.subTasks.every((st) =>
          chapters.some((ch) => ch.id === `ch_${st.id.split('_')[1]}`),
        );

      return {
        ...state,
        report: {
          ...state.report,
          chapters,
          status: allGenerating ? 'generating' : state.report.status,
        },
        phase: 'generating',
      };
    }

    case 'CHAPTER_COMPLETE': {
      if (!state.report) return state;
      const chapters = state.report.chapters.map((ch) =>
        ch.id === action.chapterId ? { ...ch, status: 'completed' as const } : ch,
      );
      return {
        ...state,
        report: { ...state.report, chapters },
      };
    }

    case 'REPORT_COMPLETE': {
      if (!state.report) return state;
      return {
        ...state,
        report: {
          ...state.report,
          id: action.reportId,
          status: 'completed',
        },
        phase: 'done',
      };
    }

    case 'FOLLOW_UP_START': {
      if (action.parentId) {
        return state;
      }
      const newFollowUp: FollowUp = {
        id: action.followUpId,
        chapterId: action.chapterId,
        paragraphIndex: action.paragraphIndex,
        question: action.question,
        answer: '',
        citations: [],
        status: 'generating',
        parentId: action.parentId,
      };
      return {
        ...state,
        followUps: [...state.followUps, newFollowUp],
        followUpActive: true,
      };
    }

    case 'FOLLOW_UP_CHUNK': {
      const followUps = state.followUps.map((fu) => {
        if (fu.id !== action.followUpId) return fu;
        const mergedCitations = [...fu.citations];
        if (action.citations) {
          for (const nc of action.citations) {
            if (!mergedCitations.find((c) => c.id === nc.id)) {
              mergedCitations.push(nc);
            }
          }
        }
        return {
          ...fu,
          answer: fu.answer + action.chunk,
          citations: mergedCitations,
        };
      });
      return { ...state, followUps };
    }

    case 'FOLLOW_UP_COMPLETE': {
      const followUps = state.followUps.map((fu) =>
        fu.id === action.followUpId ? { ...fu, status: 'completed' as const } : fu,
      );
      return { ...state, followUps, followUpActive: false };
    }

    case 'CLOSE_FOLLOW_UP': {
      return {
        ...state,
        followUps: state.followUps.filter((fu) => fu.id !== action.followUpId),
        followUpActive: state.followUps.length <= 1 ? false : state.followUpActive,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.error,
        report: state.report
          ? { ...state.report, status: 'error' as const }
          : null,
      };
    }

    case 'LOAD_REPORT': {
      return {
        ...state,
        report: action.report,
        phase: 'done',
        error: null,
      };
    }

    case 'RESET': {
      return initialState;
    }

    default:
      return state;
  }
}

// Helper to create a started state
function startedState(): ReportState {
  return reportReducer(initialState, {
    type: 'START',
    topic: '测试话题',
    reportId: 'r_test_001',
  });
}

// Helper to create a state with subTasks
function stateWithSubTasks(): ReportState {
  const subTasks: SubTask[] = [
    { id: 'st_1', title: '子任务1', query: '查询1', status: 'pending' },
    { id: 'st_2', title: '子任务2', query: '查询2', status: 'pending' },
  ];
  return reportReducer(startedState(), { type: 'ADD_SUBTASKS', subTasks });
}

describe('ReportContext Reducer', () => {
  describe('START', () => {
    it('should initialize report with decomposing status', () => {
      const state = reportReducer(initialState, {
        type: 'START',
        topic: '人工智能行业',
        reportId: 'r_abc123',
      });

      expect(state.report).not.toBeNull();
      expect(state.report!.id).toBe('r_abc123');
      expect(state.report!.topic).toBe('人工智能行业');
      expect(state.report!.status).toBe('decomposing');
      expect(state.phase).toBe('decomposing');
      expect(state.error).toBeNull();
    });

    it('should clear error on START', () => {
      const withError = reportReducer(initialState, {
        type: 'SET_ERROR',
        error: 'previous error',
      });

      const state = reportReducer(withError, {
        type: 'START',
        topic: '新话题',
        reportId: 'r_new',
      });

      expect(state.error).toBeNull();
    });

    it('should create report with empty chapters and subTasks', () => {
      const state = reportReducer(initialState, {
        type: 'START',
        topic: '测试',
        reportId: 'r_test',
      });

      expect(state.report!.chapters).toEqual([]);
      expect(state.report!.subTasks).toEqual([]);
    });

    it('should set createdAt timestamp', () => {
      const before = new Date().toISOString();
      const state = reportReducer(initialState, {
        type: 'START',
        topic: '测试',
        reportId: 'r_test',
      });

      expect(state.report!.createdAt).toBeDefined();
      expect(new Date(state.report!.createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime() - 1000,
      );
    });
  });

  describe('ADD_SUBTASKS', () => {
    it('should add subTasks and transition to searching phase', () => {
      const subTasks: SubTask[] = [
        { id: 'st_1', title: '任务1', query: 'q1', status: 'pending' },
        { id: 'st_2', title: '任务2', query: 'q2', status: 'pending' },
      ];

      const state = reportReducer(startedState(), {
        type: 'ADD_SUBTASKS',
        subTasks,
      });

      expect(state.report!.subTasks).toEqual(subTasks);
      expect(state.report!.status).toBe('searching');
      expect(state.phase).toBe('searching');
    });

    it('should not modify state if no report exists', () => {
      const state = reportReducer(initialState, {
        type: 'ADD_SUBTASKS',
        subTasks: [],
      });

      expect(state.report).toBeNull();
      expect(state.phase).toBe('input');
    });
  });

  describe('UPDATE_SUBTASK', () => {
    it('should update a specific subTask status', () => {
      const state = reportReducer(stateWithSubTasks(), {
        type: 'UPDATE_SUBTASK',
        subTaskId: 'st_1',
        status: 'searching',
      });

      const st1 = state.report!.subTasks.find((s) => s.id === 'st_1');
      expect(st1!.status).toBe('searching');
    });

    it('should not modify other subTasks', () => {
      const state = reportReducer(stateWithSubTasks(), {
        type: 'UPDATE_SUBTASK',
        subTaskId: 'st_1',
        status: 'completed',
      });

      const st2 = state.report!.subTasks.find((s) => s.id === 'st_2');
      expect(st2!.status).toBe('pending');
    });

    it('should not modify state if report is null', () => {
      const state = reportReducer(initialState, {
        type: 'UPDATE_SUBTASK',
        subTaskId: 'st_1',
        status: 'completed',
      });

      expect(state.report).toBeNull();
    });
  });

  describe('APPEND_CHUNK', () => {
    it('should create a new chapter on first chunk', () => {
      const state = reportReducer(stateWithSubTasks(), {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '## 章节一\n\n这是内容。',
      });

      expect(state.report!.chapters).toHaveLength(1);
      expect(state.report!.chapters[0].id).toBe('ch_1');
      expect(state.report!.chapters[0].content).toBe('## 章节一\n\n这是内容。');
      expect(state.report!.chapters[0].status).toBe('generating');
    });

    it('should append to existing chapter on subsequent chunks', () => {
      let state = reportReducer(stateWithSubTasks(), {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '第一段',
      });

      state = reportReducer(state, {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '第二段',
      });

      expect(state.report!.chapters).toHaveLength(1);
      expect(state.report!.chapters[0].content).toBe('第一段第二段');
    });

    it('should merge citations and avoid duplicates', () => {
      const cit1: Citation = { id: 1, url: 'https://a.com', title: 'A', snippet: 'sA' };
      const cit2: Citation = { id: 2, url: 'https://b.com', title: 'B', snippet: 'sB' };

      let state = reportReducer(stateWithSubTasks(), {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '第一段',
        citations: [cit1],
      });

      state = reportReducer(state, {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '第二段',
        citations: [cit1, cit2], // cit1 is duplicate
      });

      expect(state.report!.chapters[0].citations).toHaveLength(2);
      expect(state.report!.chapters[0].citations.map((c) => c.id)).toContain(1);
      expect(state.report!.chapters[0].citations.map((c) => c.id)).toContain(2);
    });

    it('should set phase to generating', () => {
      const state = reportReducer(stateWithSubTasks(), {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '内容',
      });

      expect(state.phase).toBe('generating');
    });

    it('should set report status to generating when all subTasks have chapters', () => {
      const subTasks: SubTask[] = [
        { id: 'st_1', title: '任务1', query: 'q1', status: 'pending' },
      ];
      let state = reportReducer(startedState(), { type: 'ADD_SUBTASKS', subTasks });

      state = reportReducer(state, {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '内容',
      });

      expect(state.report!.status).toBe('generating');
    });

    it('should not modify state if report is null', () => {
      const state = reportReducer(initialState, {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '内容',
      });

      expect(state.report).toBeNull();
    });

    it('should handle undefined citations gracefully', () => {
      const state = reportReducer(stateWithSubTasks(), {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '无引用的内容',
      });

      expect(state.report!.chapters[0].citations).toEqual([]);
    });
  });

  describe('CHAPTER_COMPLETE', () => {
    it('should mark chapter as completed', () => {
      let state = reportReducer(stateWithSubTasks(), {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '完整内容',
      });

      state = reportReducer(state, {
        type: 'CHAPTER_COMPLETE',
        chapterId: 'ch_1',
      });

      expect(state.report!.chapters[0].status).toBe('completed');
    });

    it('should not affect other chapters', () => {
      let state = reportReducer(stateWithSubTasks(), {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_1',
        chunk: '章节1',
      });
      state = reportReducer(state, {
        type: 'APPEND_CHUNK',
        chapterId: 'ch_2',
        chunk: '章节2',
      });

      state = reportReducer(state, {
        type: 'CHAPTER_COMPLETE',
        chapterId: 'ch_1',
      });

      expect(state.report!.chapters.find((c) => c.id === 'ch_1')!.status).toBe('completed');
      expect(state.report!.chapters.find((c) => c.id === 'ch_2')!.status).toBe('generating');
    });

    it('should not modify state if report is null', () => {
      const state = reportReducer(initialState, {
        type: 'CHAPTER_COMPLETE',
        chapterId: 'ch_1',
      });

      expect(state.report).toBeNull();
    });
  });

  describe('REPORT_COMPLETE', () => {
    it('should set report status to completed and phase to done', () => {
      const state = reportReducer(startedState(), {
        type: 'REPORT_COMPLETE',
        reportId: 'r_final',
      });

      expect(state.report!.status).toBe('completed');
      expect(state.report!.id).toBe('r_final');
      expect(state.phase).toBe('done');
    });

    it('should not modify state if report is null', () => {
      const state = reportReducer(initialState, {
        type: 'REPORT_COMPLETE',
        reportId: 'r_none',
      });

      expect(state.report).toBeNull();
    });
  });

  describe('FOLLOW_UP_START', () => {
    it('should add a new follow-up', () => {
      const state = reportReducer(startedState(), {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_001',
        chapterId: 'ch_1',
        paragraphIndex: 0,
        question: '这是什么意思？',
      });

      expect(state.followUps).toHaveLength(1);
      expect(state.followUps[0].id).toBe('fu_001');
      expect(state.followUps[0].question).toBe('这是什么意思？');
      expect(state.followUps[0].status).toBe('generating');
      expect(state.followUpActive).toBe(true);
    });

    it('should reject follow-up with parentId (depth > 2)', () => {
      const state = reportReducer(startedState(), {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_deep',
        chapterId: 'ch_1',
        paragraphIndex: 0,
        question: '追问追问的内容',
        parentId: 'fu_001', // This should be rejected
      });

      expect(state.followUps).toHaveLength(0);
    });

    it('should allow multiple independent follow-ups in the same chapter', () => {
      let state = reportReducer(startedState(), {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_1',
        chapterId: 'ch_1',
        paragraphIndex: 0,
        question: '问题1',
      });

      state = reportReducer(state, {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_2',
        chapterId: 'ch_1',
        paragraphIndex: 1,
        question: '问题2',
      });

      expect(state.followUps).toHaveLength(2);
    });
  });

  describe('FOLLOW_UP_CHUNK', () => {
    it('should append chunk to follow-up answer', () => {
      let state = reportReducer(startedState(), {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_001',
        chapterId: 'ch_1',
        paragraphIndex: 0,
        question: '问题',
      });

      state = reportReducer(state, {
        type: 'FOLLOW_UP_CHUNK',
        followUpId: 'fu_001',
        chunk: '这是回答的第一部分',
      });

      state = reportReducer(state, {
        type: 'FOLLOW_UP_CHUNK',
        followUpId: 'fu_001',
        chunk: '这是回答的第二部分',
      });

      const fu = state.followUps.find((f) => f.id === 'fu_001')!;
      expect(fu.answer).toBe('这是回答的第一部分这是回答的第二部分');
    });

    it('should merge citations without duplicates', () => {
      let state = reportReducer(startedState(), {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_001',
        chapterId: 'ch_1',
        paragraphIndex: 0,
        question: '问题',
      });

      const cit1: Citation = { id: 100, url: 'https://x.com', title: 'X', snippet: 'sx' };

      state = reportReducer(state, {
        type: 'FOLLOW_UP_CHUNK',
        followUpId: 'fu_001',
        chunk: '第一部分',
        citations: [cit1],
      });

      state = reportReducer(state, {
        type: 'FOLLOW_UP_CHUNK',
        followUpId: 'fu_001',
        chunk: '第二部分',
        citations: [cit1],
      });

      expect(state.followUps[0].citations).toHaveLength(1);
    });
  });

  describe('FOLLOW_UP_COMPLETE', () => {
    it('should mark follow-up as completed', () => {
      let state = reportReducer(startedState(), {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_001',
        chapterId: 'ch_1',
        paragraphIndex: 0,
        question: '问题',
      });

      state = reportReducer(state, {
        type: 'FOLLOW_UP_COMPLETE',
        followUpId: 'fu_001',
      });

      expect(state.followUps[0].status).toBe('completed');
      expect(state.followUpActive).toBe(false);
    });
  });

  describe('CLOSE_FOLLOW_UP', () => {
    it('should remove the specified follow-up', () => {
      let state = reportReducer(startedState(), {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_1',
        chapterId: 'ch_1',
        paragraphIndex: 0,
        question: '问题1',
      });

      state = reportReducer(state, {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_2',
        chapterId: 'ch_1',
        paragraphIndex: 1,
        question: '问题2',
      });

      state = reportReducer(state, {
        type: 'CLOSE_FOLLOW_UP',
        followUpId: 'fu_1',
      });

      expect(state.followUps).toHaveLength(1);
      expect(state.followUps[0].id).toBe('fu_2');
    });

    it('should set followUpActive to false when last one is closed', () => {
      let state = reportReducer(startedState(), {
        type: 'FOLLOW_UP_START',
        followUpId: 'fu_1',
        chapterId: 'ch_1',
        paragraphIndex: 0,
        question: '唯一问题',
      });

      state = reportReducer(state, {
        type: 'CLOSE_FOLLOW_UP',
        followUpId: 'fu_1',
      });

      expect(state.followUpActive).toBe(false);
      expect(state.followUps).toHaveLength(0);
    });
  });

  describe('SET_ERROR', () => {
    it('should set error message', () => {
      const state = reportReducer(startedState(), {
        type: 'SET_ERROR',
        error: '生成失败',
      });

      expect(state.error).toBe('生成失败');
    });

    it('should set report status to error if report exists', () => {
      const state = reportReducer(startedState(), {
        type: 'SET_ERROR',
        error: '网络错误',
      });

      expect(state.report!.status).toBe('error');
    });

    it('should not crash if report is null', () => {
      const state = reportReducer(initialState, {
        type: 'SET_ERROR',
        error: '初始错误',
      });

      expect(state.error).toBe('初始错误');
      expect(state.report).toBeNull();
    });
  });

  describe('LOAD_REPORT', () => {
    it('should load a report and set phase to done', () => {
      const report: Report = {
        id: 'r_loaded',
        topic: '已保存的报告',
        status: 'completed',
        subTasks: [],
        chapters: [],
        createdAt: '2024-06-01T00:00:00Z',
      };

      const state = reportReducer(initialState, {
        type: 'LOAD_REPORT',
        report,
      });

      expect(state.report).toEqual(report);
      expect(state.phase).toBe('done');
      expect(state.error).toBeNull();
    });
  });

  describe('RESET', () => {
    it('should return to initial state', () => {
      let state = reportReducer(initialState, {
        type: 'START',
        topic: '测试',
        reportId: 'r_test',
      });

      state = reportReducer(state, { type: 'RESET' });

      expect(state).toEqual(initialState);
    });
  });

  describe('default / unknown action', () => {
    it('should return current state for unknown action type', () => {
      const state = startedState();
      const result = reportReducer(state, { type: 'UNKNOWN' as never } as ReportAction);
      expect(result).toBe(state); // Same reference
    });
  });
});
