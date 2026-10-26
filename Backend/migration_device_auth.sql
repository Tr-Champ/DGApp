-- ==========================================================
-- NEON POSTGRESQL MIGRATION: PASSWORDLESS HARDWARE DEVICE AUTH
-- ==========================================================

BEGIN;

-- 1. Ensure table exists with base columns
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    device_token TEXT UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Drop the legacy password_hash column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- 3. Add device_token column if migrating from an existing table without it
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_token TEXT;

-- 4. Add timestamps if not present
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 5. Create unique index on device_token for fast lookup & hardware uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_device_token ON users(device_token);

-- 6. Ensure index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMIT;
