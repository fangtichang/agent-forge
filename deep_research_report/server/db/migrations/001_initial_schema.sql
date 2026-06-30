-- ============================================================
-- Agent Forge — Initial Schema Migration
-- PostgreSQL 15+ with pgvector extension
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector support

-- ============================================================
-- 1. Reports table
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic           VARCHAR(500)  NOT NULL,
    status          VARCHAR(20)   DEFAULT 'pending',
    total_chapters  INTEGER       DEFAULT 0,
    meta            JSONB         DEFAULT '{}',
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status  ON reports(status) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- ============================================================
-- 2. Sub-tasks table
-- ============================================================
CREATE TABLE IF NOT EXISTS sub_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    sort_order      INTEGER       DEFAULT 0,
    title           VARCHAR(500)  NOT NULL,
    query           TEXT          NOT NULL,
    search_terms    TEXT[]        DEFAULT '{}',
    status          VARCHAR(20)   DEFAULT 'pending',
    sources_found   INTEGER       DEFAULT 0,
    created_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_tasks_report ON sub_tasks(report_id);

-- ============================================================
-- 3. Chapters table
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    sub_task_id     UUID REFERENCES sub_tasks(id),
    sort_order      INTEGER       DEFAULT 0,
    title           VARCHAR(500)  NOT NULL,
    content         TEXT          DEFAULT '',
    word_count      INTEGER       DEFAULT 0,
    status          VARCHAR(20)   DEFAULT 'pending',
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chapters_report ON chapters(report_id);

-- ============================================================
-- 4. Citations table
-- ============================================================
CREATE TABLE IF NOT EXISTS citations (
    id              SERIAL PRIMARY KEY,
    chapter_id      UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    citation_index  INTEGER      NOT NULL,
    url             TEXT         NOT NULL,
    title           VARCHAR(500),
    snippet         TEXT,
    domain          VARCHAR(255),
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_chapter ON citations(chapter_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_citations_unique ON citations(chapter_id, citation_index);

-- ============================================================
-- 5. Follow-ups table
-- ============================================================
CREATE TABLE IF NOT EXISTS follow_ups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id      UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES follow_ups(id),
    paragraph_index INTEGER      NOT NULL,
    question        TEXT         NOT NULL,
    answer          TEXT         DEFAULT '',
    citations       JSONB        DEFAULT '[]',
    depth           INTEGER      DEFAULT 1 CHECK (depth BETWEEN 1 AND 2),
    status          VARCHAR(20)  DEFAULT 'pending',
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_chapter ON follow_ups(chapter_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_parent  ON follow_ups(parent_id);

-- ============================================================
-- 6. Knowledge documents table (RAG)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500)  NOT NULL,
    content         TEXT          NOT NULL,
    content_hash    VARCHAR(64)   NOT NULL,
    source_url      TEXT,
    source_type     VARCHAR(50)   DEFAULT 'upload',
    word_count      INTEGER       DEFAULT 0,
    embedding       vector(1536),
    meta            JSONB         DEFAULT '{}',
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- pgvector IVFFlat index for similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
    ON knowledge_documents
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_knowledge_hash ON knowledge_documents(content_hash);

-- ============================================================
-- 7. Search cache table (Redis backup)
-- ============================================================
CREATE TABLE IF NOT EXISTS search_cache (
    id              SERIAL PRIMARY KEY,
    query_hash      VARCHAR(64)   UNIQUE NOT NULL,
    query_text      TEXT          NOT NULL,
    results         JSONB         NOT NULL,
    hit_count       INTEGER       DEFAULT 1,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    expires_at      TIMESTAMPTZ   DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

-- ============================================================
-- 8. API call logs (monitoring/billing)
-- ============================================================
CREATE TABLE IF NOT EXISTS api_call_logs (
    id              BIGSERIAL PRIMARY KEY,
    report_id       UUID REFERENCES reports(id),
    service         VARCHAR(50)   NOT NULL,
    provider        VARCHAR(50),
    model           VARCHAR(100),
    tokens_in       INTEGER       DEFAULT 0,
    tokens_out      INTEGER       DEFAULT 0,
    latency_ms      INTEGER,
    cost_usd        DECIMAL(10,6) DEFAULT 0,
    status          VARCHAR(20)   DEFAULT 'success',
    error_message   TEXT,
    created_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_report  ON api_call_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_call_logs(created_at DESC);
