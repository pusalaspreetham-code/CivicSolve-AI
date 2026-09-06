-- ============================================================
-- CivicSolve AI — Additional Features migration
-- Covers: Solution Evidence, Faculty Management, Faculty
-- Guidance Requests.
--
-- Safe to run against the EXISTING database.
-- Does NOT touch, alter, or drop any existing table's data.
-- All statements are idempotent (IF NOT EXISTS) so re-running
-- this file is harmless.
--
-- Run this AFTER student_portal.sql and university_portal.sql.
-- ------------------------------------------------------------
-- psql -U <user> -d civicsolve -f additional_features.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. team_solutions
--    One shared solution + evidence link per team (a team works
--    on exactly one problem, so this is effectively "the team's
--    solution to their problem"). Any team member can create or
--    update it — there is no review/approval workflow.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_solutions (
    id              SERIAL PRIMARY KEY,
    team_id         INTEGER NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
    solution_text   TEXT NOT NULL,
    evidence_link   TEXT,
    created_by      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    updated_by      INTEGER REFERENCES students(id) ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_solutions_team ON team_solutions (team_id);

-- ------------------------------------------------------------
-- 2. faculties
--    Managed entirely by the university. No login of their own.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculties (
    id              SERIAL PRIMARY KEY,
    university_id   INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    department      TEXT NOT NULL,
    expertise       TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (university_id, email)
);

CREATE INDEX IF NOT EXISTS idx_faculties_university ON faculties (university_id);

-- ------------------------------------------------------------
-- 3. faculty_guidance_requests
--    Optional student -> faculty guidance requests. Faculty
--    accept/deny entirely through a tokenized email link — no
--    faculty login, portal, or dashboard.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty_guidance_requests (
    id                SERIAL PRIMARY KEY,
    student_id        INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    faculty_id        INTEGER NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    problem_id        INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    team_id           INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    message           TEXT,
    status            TEXT NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'ACCEPTED', 'DENIED')),
    response_token    TEXT NOT NULL UNIQUE,
    requested_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guidance_requests_student ON faculty_guidance_requests (student_id);
CREATE INDEX IF NOT EXISTS idx_guidance_requests_faculty ON faculty_guidance_requests (faculty_id);
CREATE INDEX IF NOT EXISTS idx_guidance_requests_token ON faculty_guidance_requests (response_token);

COMMIT;

-- ------------------------------------------------------------
-- NOTE on environment variables:
-- The faculty guidance email contains ACCEPT/DENY links that hit
-- the backend directly (faculty has no login). Set this in
-- backend/.env so those links point at your deployed API:
--
--   API_BASE_URL=http://localhost:5000
--
-- If not set, it falls back to http://localhost:<PORT>.
-- ============================================================
