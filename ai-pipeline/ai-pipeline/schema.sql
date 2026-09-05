-- ============================================================
-- CivicSolve AI Pipeline — `reports` table
-- Run this BEFORE server/database/schema.sql (citizen intake) and
-- BEFORE the student portal's database/student_portal.sql, since
-- both of those reference this table.
-- Safe to re-run: every statement is IF NOT EXISTS.
-- ============================================================

-- pgvector extension, needed for the `embedding` similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Unified, AI-classified civic problems. Each row can represent
-- MANY individual citizen submissions (see problem_reports below) —
-- the AI pipeline merges duplicate reports of the same underlying
-- problem into a single row and just appends a new location.
CREATE TABLE IF NOT EXISTS reports (
    id                  SERIAL PRIMARY KEY,
    report_text         TEXT,
    problem_title       TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    domain              TEXT NOT NULL,
    responsible_fields  TEXT[] NOT NULL DEFAULT '{}',
    severity            TEXT NOT NULL,
    confidence          NUMERIC,
    locations           JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_path          TEXT,
    image_description   TEXT,
    embedding           vector(384),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector index for fast nearest-neighbor duplicate search
CREATE INDEX IF NOT EXISTS idx_reports_embedding
    ON reports USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Individual citizen submissions that were merged/deduplicated by the
-- AI pipeline into a `reports` row. (Also created by the student
-- portal's migration if that runs first — both are IF NOT EXISTS.)
CREATE TABLE IF NOT EXISTS problem_reports (
    id           SERIAL PRIMARY KEY,
    problem_id   INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    report_text  TEXT,
    latitude     DOUBLE PRECISION,
    longitude    DOUBLE PRECISION,
    image_path   TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_problem_reports_problem
    ON problem_reports (problem_id);
