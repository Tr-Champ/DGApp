-- ==========================================================
-- 1. USERS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);

-- ==========================================================
-- 2. PRODUCTS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    info JSONB DEFAULT '{}'::jsonb,
    images JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for fast browsing and search filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ==========================================================
-- 3. CARTS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::jsonb,
    total_price DECIMAL(10, 2) DEFAULT 0.00
);

-- ==========================================================
-- 4. ORDERS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for quick order history retrieval by user
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);


-- ==========================================================
-- SAMPLE DATA INSERTION (Optional Test Data)
-- ==========================================================

-- Insert sample user
INSERT INTO users (id, email, password_hash, is_admin)
VALUES (
    1,
    'john@gmail.com',
    '$2b$10$h3QxYx.....',
    FALSE
) ON CONFLICT (id) DO NOTHING;

-- Insert sample product
INSERT INTO products (id, name, category, price, quantity, info, images)
VALUES (
    1,
    'Nike Air Max',
    'Shoes',
    120.00,
    50,
    '{"brand": "Nike", "color": "Black", "sizes": [40, 41, 42]}'::jsonb,
    '["/products/nike-air-1.jpg", "/products/nike-air-2.jpg"]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert sample cart
INSERT INTO carts (id, user_id, items, total_price)
VALUES (
    1,
    1,
    '[
        {
            "product_id": 1,
            "name": "Nike Air Max",
            "price": 120,
            "quantity": 2,
            "subtotal": 240
        },
        {
            "product_id": 2,
            "name": "Leather Bag",
            "price": 50,
            "quantity": 1,
            "subtotal": 50
        }
    ]'::jsonb,
    290.00
) ON CONFLICT (id) DO NOTHING;

-- Insert sample order
INSERT INTO orders (id, user_id, items, total_price, paid, delivered, created_at)
VALUES (
    1,
    1,
    '[
        {
            "product_id": 1,
            "name": "Nike Air Max",
            "price": 120,
            "quantity": 2,
            "subtotal": 240
        }
    ]'::jsonb,
    240.00,
    TRUE,
    FALSE,
    NOW()
) ON CONFLICT (id) DO NOTHING;