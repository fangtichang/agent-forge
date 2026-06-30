/** Report domain types for the deep research report agent. */

/** Overall report generation status. */
export type ReportStatus =
  | 'idle'
  | 'decomposing'
  | 'searching'
  | 'generating'
  | 'completed'
  | 'error';

/** Status of an individual sub-task. */
export type SubTaskStatus = 'pending' | 'searching' | 'completed';

/** Status of an individual chapter. */
export type ChapterStatus = 'pending' | 'generating' | 'completed';

/** Status of a follow-up question. */
export type FollowUpStatus = 'pending' | 'generating' | 'completed';

/** High-level generation phase shown in the UI stepper. */
export type GenerationPhase =
  | 'input'
  | 'decomposing'
  | 'searching'
  | 'generating'
  | 'done';

/** A citation reference from a search result. */
export interface Citation {
  id: number;
  url: string;
  title: string;
  snippet: string;
}

/** A sub-task broken down from the main topic. */
export interface SubTask {
  id: string;
  title: string;
  query: string;
  status: SubTaskStatus;
}

/** A report chapter with generated content and citations. */
export interface Chapter {
  id: string;
  title: string;
  content: string;
  citations: Citation[];
  status: ChapterStatus;
}

/** The complete report data model. */
export interface Report {
  id: string;
  topic: string;
  status: ReportStatus;
  subTasks: SubTask[];
  chapters: Chapter[];
  createdAt: string;
}

/** A follow-up question and its answer for a specific paragraph. */
export interface FollowUp {
  id: string;
  chapterId: string;
  paragraphIndex: number;
  question: string;
  answer: string;
  citations: Citation[];
  status: FollowUpStatus;
  parentId?: string;
}
