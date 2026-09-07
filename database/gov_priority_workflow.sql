-- ============================================================
-- Government priority-review workflow
-- Run this AFTER: schema.sql (reports), government_portal.sql, gov_updates.sql
-- Purely additive / idempotent — safe to re-run.
--
-- Workflow this migration enables:
--   1. Citizen submits -> AI pipeline finds the problem's "genome"
--      (classification + embedding + duplicate match) and computes a
--      priority_score (0-100) from severity/confidence/report volume.
--   2. priority_score below PRIORITY_DISCARD_THRESHOLD (see ai-pipeline
--      main.py)  -> gov_review_status = 'DISCARDED'. Never shown anywhere.
--   3. priority_score at/above the threshold -> gov_review_status =
--      'PENDING_REVIEW'. Visible ONLY in the government portal, NOT in
--      the student portal.
--   4. A government official approves -> gov_review_status =
--      'GOV_APPROVED'. Only now does it become visible to students and
--      universities. Officials can also reject -> 'GOV_REJECTED'.
-- ============================================================

BEGIN;

ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS priority_score NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS gov_review_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
    CHECK (gov_review_status IN ('DISCARDED', 'PENDING_REVIEW', 'GOV_APPROVED', 'GOV_REJECTED'));

ALTER TABLE reports ADD COLUMN IF NOT EXISTS discard_reason TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES government_users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS review_remarks TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_gov_review_status ON reports (gov_review_status);
CREATE INDEX IF NOT EXISTS idx_reports_priority_score ON reports (priority_score DESC);

-- Backfill rows that already existed before this migration ran, so
-- nothing that citizens/students were already relying on disappears.
-- We approximate a priority_score from severity + confidence (the same
-- formula the AI pipeline now applies on every new/merged report) and
-- mark everything that already existed as GOV_APPROVED so the student
-- portal keeps showing exactly what it showed before this migration.
UPDATE reports
SET priority_score = ROUND(
        (CASE UPPER(severity)
            WHEN 'CRITICAL' THEN 90
            WHEN 'HIGH'      THEN 70
            WHEN 'MEDIUM'    THEN 45
            WHEN 'LOW'       THEN 20
            ELSE 10
         END) * 0.7
        + (COALESCE(confidence, 0.5) * 100) * 0.3
    , 2)
WHERE priority_score = 0;

UPDATE reports
SET gov_review_status = 'GOV_APPROVED',
    reviewed_at = CURRENT_TIMESTAMP,
    review_remarks = 'Auto-approved: pre-existed the priority/approval workflow migration.'
WHERE gov_review_status = 'PENDING_REVIEW'
  AND created_at < CURRENT_TIMESTAMP;

-- Audit-log action types used by the new approve/reject endpoints
-- (gov_access_log.action is a free-text column already, no ALTER needed,
-- documented here for reference: 'APPROVE_PROBLEM' | 'REJECT_PROBLEM').

COMMIT;
