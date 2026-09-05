-- ============================================================
-- CivicSolve AI — Student Portal migration
-- Safe to run against the EXISTING database.
-- Does NOT touch, alter, or drop the `reports` table.
-- All statements are idempotent (IF NOT EXISTS) so re-running
-- this file is harmless.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. students
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    college         TEXT NOT NULL,
    branch          TEXT NOT NULL,
    year_of_study   TEXT NOT NULL,
    phone           TEXT NOT NULL,
    city            TEXT NOT NULL,
    email_verified  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. student_otps
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_otps (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    attempts    INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_otps_email
    ON student_otps (email);

-- ------------------------------------------------------------
-- 3. student_problems  (student <-> reports, i.e. "take problem")
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_problems (
    id          SERIAL PRIMARY KEY,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    problem_id  INTEGER NOT NULL REFERENCES reports(id)  ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'INTERESTED'
                CHECK (status IN ('INTERESTED', 'WORKING', 'COMPLETED')),
    joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    solution_text TEXT,
    solution_submitted_at TIMESTAMP,
    UNIQUE (student_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_student_problems_student
    ON student_problems (student_id);

-- ------------------------------------------------------------
-- 4. problem_reports  (individual citizen submissions that
--    were merged/deduplicated by the AI pipeline into a
--    unified `reports` row)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 5. Helpful index on the EXISTING reports table for
--    branch-matching queries (responsible_fields is TEXT[]).
--    This only adds an index — it does not alter any column.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reports_responsible_fields
    ON reports USING GIN (responsible_fields);

CREATE TABLE IF NOT EXISTS citizen_cases (
    case_reference TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'RECEIVED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE problem_reports ADD COLUMN IF NOT EXISTS case_reference TEXT;
CREATE INDEX IF NOT EXISTS idx_problem_reports_case_reference ON problem_reports (case_reference);

COMMIT;
