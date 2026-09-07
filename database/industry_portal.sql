-- ============================================================
-- CivicSolve AI — Industry Portal migration
-- Safe to run against the EXISTING database.
-- Does NOT touch, alter, or drop `reports`, `students`,
-- `student_problems`, `universities`, or any other existing table.
-- All statements are idempotent (IF NOT EXISTS) so re-running
-- this file is harmless.
--
-- Depends on: student_portal.sql having already been run
-- (references `reports` and `student_problems`).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. industries
--    Corporate / company accounts providing mentorship,
--    pilot funding, hardware resources, and field deployment.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS industries (
    id                SERIAL PRIMARY KEY,
    company_name      TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    domain            TEXT NOT NULL,
    password_hash     TEXT NOT NULL,
    contact_person    TEXT NOT NULL,
    designation       TEXT NOT NULL,
    phone             TEXT NOT NULL,
    sector            TEXT NOT NULL,
    city              TEXT NOT NULL,
    state             TEXT NOT NULL,
    website           TEXT,
    email_verified    BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_industries_domain ON industries (domain);
CREATE INDEX IF NOT EXISTS idx_industries_sector ON industries (sector);

-- ------------------------------------------------------------
-- 2. industry_otps  (mirrors student_otps / university_otps / government_otps)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS industry_otps (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    attempts    INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_industry_otps_email ON industry_otps (email);

-- ------------------------------------------------------------
-- 3. industry_problem_adoptions
--    Tracks corporate commitments to adopt civic problems
--    (Mentorship, Pilot Funding, Hardware Resources, Field Deployment)
--    and milestone progress: EVALUATING -> ACTIVE -> PILOT_DEPLOYED -> RESOLVED
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS industry_problem_adoptions (
    id                SERIAL PRIMARY KEY,
    industry_id       INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
    problem_id        INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    commitment_type   TEXT NOT NULL CHECK (commitment_type IN ('MENTORSHIP', 'PILOT_FUNDING', 'HARDWARE_RESOURCES', 'FIELD_DEPLOYMENT')),
    status            TEXT NOT NULL DEFAULT 'EVALUATING' CHECK (status IN ('EVALUATING', 'ACTIVE', 'PILOT_DEPLOYED', 'RESOLVED')),
    notes             TEXT,
    budget_estimate   NUMERIC DEFAULT 0,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (industry_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_industry_adoptions_industry ON industry_problem_adoptions (industry_id);
CREATE INDEX IF NOT EXISTS idx_industry_adoptions_problem ON industry_problem_adoptions (problem_id);
CREATE INDEX IF NOT EXISTS idx_industry_adoptions_status ON industry_problem_adoptions (status);

-- ------------------------------------------------------------
-- 4. industry_solution_reviews
--    Feedback, rating, and pilot-adoption flags left by industry
--    partners on solutions submitted by students in student_problems.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS industry_solution_reviews (
    id                 SERIAL PRIMARY KEY,
    industry_id        INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
    student_problem_id INTEGER NOT NULL REFERENCES student_problems(id) ON DELETE CASCADE,
    review_text        TEXT NOT NULL,
    rating             INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    pilot_interest     BOOLEAN DEFAULT FALSE,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (industry_id, student_problem_id)
);

CREATE INDEX IF NOT EXISTS idx_industry_reviews_student_problem ON industry_solution_reviews (student_problem_id);
CREATE INDEX IF NOT EXISTS idx_industry_reviews_industry ON industry_solution_reviews (industry_id);

COMMIT;
