-- ============================================================
-- CivicSolve AI — University Portal + Teams migration
-- Safe to run against the EXISTING database.
-- Does NOT touch, alter, or drop `reports` or any student_portal
-- table other than adding a nullable FK column to `students`.
-- All statements are idempotent (IF NOT EXISTS) so re-running
-- this file is harmless.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. universities
--    A university registers once (like an institutional admin
--    account). `domain` is the part of their verified email
--    after the @ (e.g. "vit.edu.in") and is used to link
--    students whose email ends with that domain to this
--    university for dashboard statistics.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universities (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    domain            TEXT NOT NULL UNIQUE,
    password_hash     TEXT NOT NULL,
    contact_person    TEXT NOT NULL,
    phone             TEXT NOT NULL,
    city              TEXT NOT NULL,
    state             TEXT NOT NULL,
    email_verified    BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_universities_domain ON universities (domain);

-- ------------------------------------------------------------
-- 2. university_otps  (mirrors student_otps)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS university_otps (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    attempts    INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_university_otps_email ON university_otps (email);

-- ------------------------------------------------------------
-- 3. Link students to a university by verified email domain.
--    Nullable — older students / students whose email domain
--    doesn't match any registered university stay unlinked.
-- ------------------------------------------------------------
ALTER TABLE students ADD COLUMN IF NOT EXISTS university_id INTEGER REFERENCES universities(id);
CREATE INDEX IF NOT EXISTS idx_students_university_id ON students (university_id);

-- ------------------------------------------------------------
-- 4. teams  (a group of students collaborating on one problem)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    problem_id    INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    invite_code   TEXT NOT NULL UNIQUE,
    created_by    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    max_members   INTEGER NOT NULL DEFAULT 6,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_problem_id ON teams (problem_id);

-- ------------------------------------------------------------
-- 5. team_members
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
    id          SERIAL PRIMARY KEY,
    team_id     INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('LEADER', 'MEMBER')),
    joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (team_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_student ON team_members (student_id);

COMMIT;
