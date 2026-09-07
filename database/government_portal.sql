BEGIN;

CREATE TABLE IF NOT EXISTS government_users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    jurisdiction_city TEXT NOT NULL,
    jurisdiction_state TEXT NOT NULL,
    phone TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS government_otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_government_otps_email ON government_otps (email);

CREATE TABLE IF NOT EXISTS government_actions (
    id SERIAL PRIMARY KEY,
    gov_user_id INTEGER NOT NULL REFERENCES government_users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('ACKNOWLEDGED', 'IN_PROGRESS', 'BUDGET_ALLOCATED', 'RESOLVED', 'REJECTED')),
    remarks TEXT,
    budget_estimate NUMERIC,
    timeline_days INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_government_actions_gov_user_id ON government_actions(gov_user_id);
CREATE INDEX IF NOT EXISTS idx_government_actions_problem_id ON government_actions(problem_id);

COMMIT;
