BEGIN;

-- Add created_at if missing
ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Ensure column exists or is renamed
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='reports' and column_name='status') THEN
      ALTER TABLE reports RENAME COLUMN status TO verification_status;
  END IF;
END $$;

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_verification_status_check;

-- Migrate existing cases before constraint
UPDATE reports SET verification_status = 'PUBLISHED' WHERE verification_status IN ('OPEN', 'ACKNOWLEDGED');
UPDATE reports SET verification_status = 'REJECTED' WHERE verification_status IN ('DISMISSED_FAKE', 'DISMISSED_DUPLICATE', 'CLOSED_EXTERNAL');
UPDATE reports SET verification_status = 'RECEIVED' WHERE verification_status NOT IN ('RECEIVED', 'AI_PROCESSED', 'UNDER_VERIFICATION', 'NEEDS_INFORMATION', 'REJECTED', 'VERIFIED', 'PUBLISHED', 'IN_PROGRESS', 'RESOLVED');

-- Now apply constraint
ALTER TABLE reports ADD CONSTRAINT reports_verification_status_check 
    CHECK (verification_status IN ('RECEIVED', 'AI_PROCESSED', 'UNDER_VERIFICATION', 'NEEDS_INFORMATION', 'REJECTED', 'VERIFIED', 'PUBLISHED', 'IN_PROGRESS', 'RESOLVED'));
ALTER TABLE reports ALTER COLUMN verification_status SET DEFAULT 'RECEIVED';

ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority_score INTEGER CHECK (priority_score >= 0 AND priority_score <= 100);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES government_users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Fix existing gov bugs: Action Types mismatch
ALTER TABLE government_actions DROP CONSTRAINT IF EXISTS government_actions_action_type_check;
ALTER TABLE government_actions ADD CONSTRAINT government_actions_action_type_check 
    CHECK (action_type IN ('ACKNOWLEDGED', 'IN_PROGRESS', 'BUDGET_ALLOCATED', 'RESOLVED', 'REJECTED', 'DISMISSED_FAKE', 'DISMISSED_DUPLICATE', 'CLOSED_EXTERNAL'));

-- Ensure Government users have all fields
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (account_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS office_address TEXT;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS justification TEXT;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMIT;
