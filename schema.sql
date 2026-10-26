-- ==========================================================
-- D&G E-COMMERCE COMPLETE POSTGRESQL SCHEMA (NEON COMPATIBLE)
-- ==========================================================

-- Clean slate: Drop all tables in dependency order
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================================
-- 1. USERS TABLE (Passwordless Hardware Device Lock Auth)
-- ==========================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    device_token TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_device_token ON users(device_token);
CREATE INDEX idx_users_email ON users(email);

-- ==========================================================
-- 2. PRODUCTS TABLE (UUID String IDs)
-- ==========================================================
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    info JSONB DEFAULT '{}'::jsonb,
    images JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);

-- ==========================================================
-- 3. CARTS TABLE (UUID String IDs)
-- ==========================================================
CREATE TABLE carts (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::jsonb,
    total_price DECIMAL(10, 2) DEFAULT 0.00
);

CREATE INDEX idx_carts_user_id ON carts(user_id);

-- ==========================================================
-- 4. ORDERS TABLE (UUID String IDs)
-- ==========================================================
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);


-- ==========================================================
-- SAMPLE TEST DATA (Optional Seed)
-- ==========================================================

-- Sample user (customer by default; flip is_admin to TRUE in Neon for admin access)
INSERT INTO users (id, email, device_token, is_admin)
VALUES (
    1,
    'john@gmail.com',
    'sample-device-token-uuid-12345',
    FALSE
) ON CONFLICT (id) DO NOTHING;

-- Synchronize the serial sequence so subsequent registrations start at 2
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM users));

-- Sample products
INSERT INTO products (id, name, category, price, quantity, info, images)
VALUES (
    '1',
    'Nike Air Max',
    'Shoes',
    120.00,
    50,
    '{"brand": "Nike", "color": "Black", "sizes": [40, 41, 42]}'::jsonb,
    '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, category, price, quantity, info, images)
VALUES (
    '2',
    'Leather Luxury Bag',
    'Bags',
    85.00,
    30,
    '{"brand": "D&G Collection", "color": "Brown", "material": "Genuine Leather"}'::jsonb,
    '["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"]'::jsonb
) ON CONFLICT (id) DO NOTHING;