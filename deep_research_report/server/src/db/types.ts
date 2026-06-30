/**
 * Database row types — correspond to the tables defined in
 * db/migrations/001_initial_schema.sql.
 *
 * All date fields are returned as ISO 8601 strings by pg via node-postgres.
 * UUID columns are also returned as strings.
 */

export interface ReportRow {
  id: string;
  topic: string;
  status: string;
  total_chapters: number;
  meta: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface SubTaskRow {
  id: string;
  report_id: string;
  sort_order: number;
  title: string;
  query: string;
  search_terms: string[];
  status: string;
  sources_found: number;
  created_at: string;
}

export interface ChapterRow {
  id: string;
  report_id: string;
  sub_task_id: string | null;
  sort_order: number;
  title: string;
  content: string;
  word_count: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export interface CitationRow {
  id: number;
  chapter_id: string;
  citation_index: number;
  url: string;
  title: string | null;
  snippet: string | null;
  domain: string | null;
  created_at: string;
}

export interface FollowUpRow {
  id: string;
  chapter_id: string;
  parent_id: string | null;
  paragraph_index: number;
  question: string;
  answer: string;
  citations: unknown;
  depth: number;
  status: string;
  created_at: string;
}

export interface KnowledgeDocumentRow {
  id: string;
  title: string;
  content: string;
  content_hash: string;
  source_url: string | null;
  source_type: string;
  word_count: number;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ApiCallLogRow {
  id: string;
  report_id: string | null;
  service: string;
  provider: string | null;
  model: string | null;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number | null;
  cost_usd: number;
  status: string;
  error_message: string | null;
  created_at: string;
}
