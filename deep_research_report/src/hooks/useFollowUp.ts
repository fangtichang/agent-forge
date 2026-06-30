import { useCallback } from 'react';
import { useReportContext } from '@/context/ReportContext';
import { AdapterFactory } from '@/services/adapter';
import { REPORT_CONFIG } from '@/constants';
import type { IReportAPI } from '@/types';

/**
 * Custom hook for managing follow-up questions.
 *
 * Handles depth validation (max 2 layers), streaming answers,
 * and dispatch of follow-up state transitions.
 */
export function useFollowUp() {
  const { state, dispatch } = useReportContext();

  /** Get current API instance (always fresh, supports async backend detection swap). */
  function getApi(): IReportAPI {
    return AdapterFactory.create();
  }

  /**
   * Ask a follow-up question about a specific paragraph in a chapter.
   *
   * Validates that the follow-up depth does not exceed MAX_FOLLOW_UP_DEPTH (2).
   * If parentId is non-null, the request is rejected silently.
   *
   * @param chapterId - The chapter containing the paragraph
   * @param paragraphIndex - Index of the paragraph in the chapter
   * @param question - The follow-up question text
   * @param parentId - Parent follow-up ID (rejected if non-null)
   */
  const askFollowUp = useCallback(
    async (
      chapterId: string,
      paragraphIndex: number,
      question: string,
      parentId?: string,
    ) => {
      // Validate depth limit
      if (parentId) {
        console.warn(
          `Follow-up depth limited to ${REPORT_CONFIG.MAX_FOLLOW_UP_DEPTH} layers`,
        );
        return;
      }

      const followUpId = `fu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Check the existing follow-ups for this chapter/paragraph combo
      const existingDepth = state.followUps.filter(
        (fu) =>
          fu.chapterId === chapterId &&
          fu.paragraphIndex === paragraphIndex &&
          !fu.parentId,
      ).length;

      if (existingDepth >= REPORT_CONFIG.MAX_FOLLOW_UP_DEPTH) {
        console.warn(
          `Follow-up depth limited to ${REPORT_CONFIG.MAX_FOLLOW_UP_DEPTH} layers`,
        );
        return;
      }

      dispatch({
        type: 'FOLLOW_UP_START',
        followUpId,
        chapterId,
        paragraphIndex,
        question,
        parentId,
      });

      try {
        // Build report context from the chapter content
        const chapter = state.report?.chapters.find(
          (ch) => ch.id === chapterId,
        );
        const reportContext = chapter?.content || '';

        for await (const chunkEvent of getApi().followUpStream({
          chapterId,
          paragraphIndex,
          question,
          parentId,
          reportContext,
        })) {
          dispatch({
            type: 'FOLLOW_UP_CHUNK',
            followUpId,
            chunk: chunkEvent.chunk,
            citations: chunkEvent.citations,
          });
        }

        dispatch({ type: 'FOLLOW_UP_COMPLETE', followUpId });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '追问生成失败';
        dispatch({ type: 'SET_ERROR', error: message });
      }
    },
    [dispatch, state.followUps, state.report],
  );

  /**
   * Close a follow-up panel.
   */
  const closeFollowUp = useCallback(
    (followUpId: string) => {
      dispatch({ type: 'CLOSE_FOLLOW_UP', followUpId });
    },
    [dispatch],
  );

  return {
    followUps: state.followUps,
    followUpActive: state.followUpActive,
    askFollowUp,
    closeFollowUp,
  };
}
