import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportContext } from '@/context/ReportContext';
import { AdapterFactory } from '@/services/adapter';
import { StorageService } from '@/services/storage';
import type { IReportAPI } from '@/types';

/**
 * Custom hook encapsulating the full report generation workflow.
 *
 * Usage:
 *   const { startReport, loadReport, resetReport, getApi } = useReport();
 */
export function useReport() {
  const { state, dispatch } = useReportContext();
  const navigate = useNavigate();

  /**
   * Get the current API service instance.
   *
   * Called fresh on each invocation (not cached at hook level) so that
   * async backend detection can swap the adapter mid-session without
   * stale closures holding a reference to the old instance.
   */
  function getApi(): IReportAPI {
    return AdapterFactory.create();
  }

  /**
   * Start a new report generation for the given topic.
   *
   * Orchestrates the full pipeline:
   * 1. Decompose topic → sub-tasks
   * 2. Stream search progress
   * 3. Stream chapter generation for each sub-task
   * 4. Mark report as complete
   */
  const startReport = useCallback(
    async (topic: string) => {
      try {
        const api = getApi();
        const reportId = StorageService.generateId();

        // Phase 1: Initialize report
        dispatch({ type: 'START', topic, reportId });

        // Phase 2: Decompose
        const decomposeResult = await api.decompose(topic);
        dispatch({
          type: 'ADD_SUBTASKS',
          subTasks: decomposeResult.subTasks,
        });

        // Phase 3: Search — use decomposeResult for sub-task list (avoids stale closure)
        const subTaskList = decomposeResult.subTasks;
        for await (const searchEvent of api.searchStream()) {
          dispatch({
            type: 'UPDATE_SUBTASK',
            subTaskId: searchEvent.subTaskId,
            status: 'searching',
          });
          dispatch({
            type: 'UPDATE_SUBTASK',
            subTaskId: searchEvent.subTaskId,
            status: 'completed',
          });
        }

        // Ensure all sub-tasks are marked completed
        for (const st of subTaskList) {
          dispatch({
            type: 'UPDATE_SUBTASK',
            subTaskId: st.id,
            status: 'completed',
          });
        }

        // Phase 4: Generate chapters
        const subTaskIds = subTaskList.map((st) => st.id);
        const chapterIds = subTaskIds.map(
          (stId) => `ch_${stId.split('_')[1]}`,
        );

        for (const chapterId of chapterIds) {
          for await (const chunkEvent of api.generateStream(chapterId)) {
            dispatch({
              type: 'APPEND_CHUNK',
              chapterId: chunkEvent.chapterId,
              chunk: chunkEvent.chunk,
              citations: chunkEvent.citations,
            });
          }
          dispatch({ type: 'CHAPTER_COMPLETE', chapterId });
        }

        dispatch({ type: 'REPORT_COMPLETE', reportId });

        // Navigate to report page (saving handled by ProgressPage)
        navigate(`/report/${reportId}`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '报告生成失败，请重试';
        dispatch({ type: 'SET_ERROR', error: message });
      }
    },
    [dispatch, navigate],
  );

  /**
   * Load a previously saved report from localStorage.
   */
  const loadReport = useCallback(
    (id: string) => {
      const report = StorageService.loadReport(id);
      if (report) {
        dispatch({ type: 'LOAD_REPORT', report });
        navigate(`/report/${id}`);
      } else {
        dispatch({ type: 'SET_ERROR', error: '报告未找到' });
      }
    },
    [dispatch, navigate],
  );

  /**
   * Reset the report state and return to home.
   */
  const resetReport = useCallback(() => {
    dispatch({ type: 'RESET' });
    navigate('/');
  }, [dispatch, navigate]);

  return {
    state,
    startReport,
    loadReport,
    resetReport,
    getApi,
  };
}
