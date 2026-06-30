/**
 * Report Repository �?CRUD operations for reports, sub-tasks, chapters, and citations.
 *
 * All functions are best-effort: failures are logged via console.warn and
 * the caller receives empty/null results rather than thrown exceptions.
 * The system must remain operational even when the database is unavailable.
 */
import { query } from '../connection.js';
import type {
  ReportRow,
  SubTaskRow,
  ChapterRow,
  CitationRow,
  FollowUpRow,
} from '../types.js';

// ── Reports ──

/** Create a new report record. Returns the inserted row. */
export async function createReport(topic: string): Promise<ReportRow | null> {
  const rows = await query<ReportRow>(
    `INSERT INTO reports (topic, status, total_chapters, meta)
     VALUES ($1, 'pending', 0, '{}'::jsonb)
     RETURNING *`,
    [topic],
  );
  return rows[0] || null;
}

/** Retrieve a single report by ID. */
export async function getReport(id: string): Promise<ReportRow | null> {
  const rows = await query<ReportRow>(
    'SELECT * FROM reports WHERE id = $1',
    [id],
  );
  return rows[0] || null;
}

/** List reports with pagination, newest first. */
export async function listReports(
  limit = 50,
  offset = 0,
): Promise<ReportRow[]> {
  return query<ReportRow>(
    'SELECT * FROM reports ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  );
}

/** Update a report's status. */
export async function updateReportStatus(
  id: string,
  status: string,
): Promise<void> {
  const completedAt = status === 'completed' ? 'NOW()' : null;
  await query(
    `UPDATE reports
     SET status = $2, completed_at = ${completedAt}, updated_at = NOW()
     WHERE id = $1`,
    [id, status],
  );
}

/** Delete a report and all cascaded rows. */
export async function deleteReport(id: string): Promise<void> {
  await query('DELETE FROM reports WHERE id = $1', [id]);
}

// ── Sub-Tasks ──

/** Insert multiple sub-tasks for a report in a single batch. */
export async function createSubTasks(
  reportId: string,
  subTasks: { title: string; query: string; searchTerms: string[] }[],
): Promise<void> {
  if (subTasks.length === 0) return;

  const values: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  for (let i = 0; i < subTasks.length; i++) {
    const st = subTasks[i];
    values.push(
      `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`,
    );
    params.push(reportId, i, st.title, st.query, st.searchTerms);
    paramIdx += 5;
  }

  await query(
    `INSERT INTO sub_tasks (report_id, sort_order, title, query, search_terms)
     VALUES ${values.join(', ')}`,
    params,
  );
}

// ── Chapters ──

/** Create a new chapter. Returns the inserted row. */
export async function createChapter(data: {
  reportId: string;
  subTaskId: string | null;
  sortOrder: number;
  title: string;
}): Promise<ChapterRow | null> {
  const rows = await query<ChapterRow>(
    `INSERT INTO chapters (report_id, sub_task_id, sort_order, title, content, word_count, status)
     VALUES ($1, $2, $3, $4, '', 0, 'pending')
     RETURNING *`,
    [data.reportId, data.subTaskId, data.sortOrder, data.title],
  );
  return rows[0] || null;
}

/** Update a chapter's content and word count. */
export async function updateChapterContent(
  id: string,
  content: string,
  wordCount: number,
): Promise<void> {
  await query(
    `UPDATE chapters
     SET content = $2, word_count = $3, status = 'completed', completed_at = NOW()
     WHERE id = $1`,
    [id, content, wordCount],
  );
}

/** Get all chapters for a report, ordered by sort_order. */
export async function getChaptersByReport(
  reportId: string,
): Promise<ChapterRow[]> {
  return query<ChapterRow>(
    'SELECT * FROM chapters WHERE report_id = $1 ORDER BY sort_order ASC',
    [reportId],
  );
}

// ── Citations ──

/** Insert multiple citations for a chapter in a batch. */
export async function createCitations(
  chapterId: string,
  citations: { index: number; url: string; title: string; snippet: string }[],
): Promise<void> {
  if (citations.length === 0) return;

  const values: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  for (const c of citations) {
    const domain = extractDomain(c.url);
    values.push(
      `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`,
    );
    params.push(chapterId, c.index, c.url, c.title, c.snippet, domain);
    paramIdx += 6;
  }

  // ON CONFLICT DO NOTHING to handle idempotent re-runs
  await query(
    `INSERT INTO citations (chapter_id, citation_index, url, title, snippet, domain)
     VALUES ${values.join(', ')}
     ON CONFLICT (chapter_id, citation_index) DO NOTHING`,
    params,
  );
}

/** Get all citations for a chapter, ordered by citation_index. */
export async function getCitationsByChapter(
  chapterId: string,
): Promise<CitationRow[]> {
  return query<CitationRow>(
    'SELECT * FROM citations WHERE chapter_id = $1 ORDER BY citation_index ASC',
    [chapterId],
  );
}

// ── Follow-Ups ──

/** Get all follow-ups for a chapter. */
export async function getFollowUpsByChapter(
  chapterId: string,
): Promise<FollowUpRow[]> {
  return query<FollowUpRow>(
    'SELECT * FROM follow_ups WHERE chapter_id = $1 ORDER BY created_at ASC',
    [chapterId],
  );
}

// ── Helpers ──

/** Extract the domain from a URL for citation grouping. */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
