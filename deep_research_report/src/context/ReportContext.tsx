import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import type {
  Report,
  SubTask,
  Chapter,
  FollowUp,
  Citation,
  ReportStatus,
  ChapterStatus,
} from '@/types';

/** Full application state for the report generation workflow. */
export interface ReportState {
  /** The active report being generated or viewed. */
  report: Report | null;
  /** Current high-level phase for UI display. */
  phase: 'input' | 'decomposing' | 'searching' | 'generating' | 'done';
  /** Whether an error has occurred. */
  error: string | null;
  /** Active follow-up questions keyed by a composite ID. */
  followUps: FollowUp[];
  /** Whether a follow-up stream is currently active. */
  followUpActive: boolean;
}

const initialState: ReportState = {
  report: null,
  phase: 'input',
  error: null,
  followUps: [],
  followUpActive: false,
};

/** Discriminated union of all possible state transitions. */
export type ReportAction =
  | { type: 'START'; topic: string; reportId: string }
  | { type: 'ADD_SUBTASKS'; subTasks: SubTask[] }
  | { type: 'UPDATE_SUBTASK'; subTaskId: string; status: SubTask['status'] }
  | {
      type: 'APPEND_CHUNK';
      chapterId: string;
      chunk: string;
      citations?: Citation[];
    }
  | { type: 'CHAPTER_COMPLETE'; chapterId: string }
  | { type: 'REPORT_COMPLETE'; reportId: string }
  | {
      type: 'FOLLOW_UP_START';
      followUpId: string;
      chapterId: string;
      paragraphIndex: number;
      question: string;
      parentId?: string;
    }
  | {
      type: 'FOLLOW_UP_CHUNK';
      followUpId: string;
      chunk: string;
      citations?: Citation[];
    }
  | { type: 'FOLLOW_UP_COMPLETE'; followUpId: string }
  | { type: 'CLOSE_FOLLOW_UP'; followUpId: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'LOAD_REPORT'; report: Report }
  | { type: 'RESET' };

/**
 * Pure reducer for report state transitions.
 */
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

      let chapters: Chapter[];
      if (existingChapter) {
        chapters = state.report.chapters.map((ch) => {
          if (ch.id !== action.chapterId) return ch;
          const existingCitations = ch.citations;
          const newCitations = action.citations || [];
          // Merge citations, avoiding duplicates by ID
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
            status: 'generating' as ChapterStatus,
          };
        });
      } else {
        const newChapter: Chapter = {
          id: action.chapterId,
          title: `章节 ${action.chapterId}`,
          content: action.chunk,
          citations: action.citations || [],
          status: 'generating',
        };
        chapters = [...state.report.chapters, newChapter];
      }

      // Check if all sub-tasks have corresponding chapters being generated
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
        ch.id === action.chapterId ? { ...ch, status: 'completed' as ChapterStatus } : ch,
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
      // Reject if parentId is non-null (depth > 2)
      if (action.parentId) {
        return state; // silently reject nested follow-ups beyond depth 2
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
          ? { ...state.report, status: 'error' as ReportStatus }
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

/** Context type exposing state and dispatch. */
interface ReportContextType {
  state: ReportState;
  dispatch: Dispatch<ReportAction>;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

/**
 * ReportProvider wraps the application and provides report state via context.
 */
export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reportReducer, initialState);

  return (
    <ReportContext.Provider value={{ state, dispatch }}>
      {children}
    </ReportContext.Provider>
  );
}

/**
 * Hook to access report state and dispatch from any component.
 */
export function useReportContext(): ReportContextType {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReportContext must be used within a ReportProvider');
  }
  return context;
}
