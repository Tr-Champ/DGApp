-- ==========================================================
-- NEON POSTGRESQL MIGRATION: 
-- 1. PASSWORDLESS HARDWARE DEVICE AUTH
-- 2. FIX UUID STRING ID FOR PRODUCTS, CARTS, AND ORDERS
-- ==========================================================

BEGIN;

-- 1. Ensure users table exists with base columns
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

-- ==========================================================
-- CRITICAL FIX: CONVERT INTEGER SERIAL ID TO VARCHAR(255)
-- Resolves: (psycopg.errors.DatatypeMismatch) column "id" is of type integer but expression is of type character varying
-- ==========================================================

-- Fix products table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE products ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR;
        ALTER TABLE products ALTER COLUMN id DROP DEFAULT;
    END IF;
END $$;

-- Fix carts table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'carts' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE carts ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR;
        ALTER TABLE carts ALTER COLUMN id DROP DEFAULT;
    END IF;
END $$;

-- Fix orders table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE orders ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR;
        ALTER TABLE orders ALTER COLUMN id DROP DEFAULT;
    END IF;
END $$;

COMMIT;
