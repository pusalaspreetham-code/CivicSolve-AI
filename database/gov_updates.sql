BEGIN;

-- A1. Give reports an actual lifecycle state
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED_FAKE', 'DISMISSED_DUPLICATE', 'CLOSED_EXTERNAL'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status_set_by INTEGER REFERENCES government_users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status_set_at TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_brief JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_brief_generated_at TIMESTAMP;

-- A2. Gate government accounts behind approval
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (account_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS office_address TEXT;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS justification TEXT;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE government_users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Set existing government_users to APPROVED to avoid locking out existing test accounts
UPDATE government_users SET account_status = 'APPROVED' WHERE account_status = 'PENDING';

-- A3. A real admin table — deliberately NOT self-registerable
CREATE TABLE IF NOT EXISTS admin_users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A4. Audit trail for who accessed what
CREATE TABLE IF NOT EXISTS gov_access_log (
    id           SERIAL PRIMARY KEY,
    gov_user_id  INTEGER NOT NULL REFERENCES government_users(id),
    problem_id   INTEGER REFERENCES reports(id),
    student_id   INTEGER REFERENCES students(id),
    action       TEXT NOT NULL,          -- 'VIEW_STUDENT_LIST' | 'VIEW_AI_BRIEF' | 'SET_STATUS' | 'REMOVE_STUDENT'
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A5. Let a student choose to expose contact details for a specific case
ALTER TABLE student_problems ADD COLUMN IF NOT EXISTS share_contact BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_problems ADD COLUMN IF NOT EXISTS removed_by_gov BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_problems ADD COLUMN IF NOT EXISTS removal_reason TEXT;

COMMIT;
