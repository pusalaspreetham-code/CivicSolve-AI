-- ============================================================
-- CivicSolve AI — Industry ⇄ Student Team Messaging migration
--
-- Lets an industry partner that has ADOPTED a civic problem
-- message the student team(s) working on that problem directly,
-- and lets team members message back. This is a lightweight
-- conversation scoped to one (industry, team) pair — there is
-- no separate industry-side portal change, just a thread the
-- Industry Portal and the Student Portal both already have
-- access to render.
--
-- Safe to run against the EXISTING database.
-- Does NOT touch, alter, or drop any existing table's data.
-- All statements are idempotent (IF NOT EXISTS) so re-running
-- this file is harmless.
--
-- Depends on: student_portal.sql and industry_portal.sql having
-- already been run (references `teams`, `team_members`,
-- `industries`, `industry_problem_adoptions`, `reports`).
--
-- Run:
--   psql -U <user> -d civicsolve -f industry_messaging.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- industry_team_messages
--   One row per chat message in an (industry, team) conversation.
--   A conversation only exists once that industry has an
--   adoption record for the team's problem — enforced in the
--   application layer, not by a DB constraint, since adoptions
--   are keyed by problem_id while this is keyed by team_id
--   (a problem can have multiple teams).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS industry_team_messages (
    id                    SERIAL PRIMARY KEY,
    industry_id           INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
    team_id               INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    problem_id            INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    sender_type           TEXT NOT NULL CHECK (sender_type IN ('INDUSTRY', 'STUDENT')),
    sender_student_id     INTEGER REFERENCES students(id) ON DELETE SET NULL,
    message               TEXT NOT NULL,
    is_read_by_industry   BOOLEAN NOT NULL DEFAULT FALSE,
    is_read_by_team       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_itm_industry_team ON industry_team_messages (industry_id, team_id, created_at);
CREATE INDEX IF NOT EXISTS idx_itm_team ON industry_team_messages (team_id, created_at);
CREATE INDEX IF NOT EXISTS idx_itm_unread_industry ON industry_team_messages (industry_id) WHERE is_read_by_industry = FALSE;
CREATE INDEX IF NOT EXISTS idx_itm_unread_team ON industry_team_messages (team_id) WHERE is_read_by_team = FALSE;

COMMIT;
-- ============================================================
