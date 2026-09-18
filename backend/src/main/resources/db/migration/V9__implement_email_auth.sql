-- V9__implement_email_auth.sql

-- Alter users table safely without breaking existing bootstrapped records
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';

-- Now alter default for new inserts to be pending_activation
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'pending_activation';

-- Create Invitation Tokens Table
CREATE TABLE IF NOT EXISTS invitation_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    link_expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
