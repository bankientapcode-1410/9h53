-- =========================================================
-- SmartPC Initial Database Migration Schema (V1)
-- Matches ERD in prj1.md Section 3
-- =========================================================

-- Ensure required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Enum Types
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE sync_status_enum AS ENUM ('SYNCED', 'PENDING', 'FAILED');
CREATE TYPE payment_method_enum AS ENUM ('COD', 'TRANSFER', 'EWALLET', 'INSTALLMENT');
CREATE TYPE payment_status_enum AS ENUM ('UNPAID', 'PAID', 'REFUNDED');
CREATE TYPE order_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED');
CREATE TYPE rule_operator_enum AS ENUM ('EQUALS', 'IN', 'NOT_IN', 'LTE', 'GTE', 'RANGE');
CREATE TYPE rule_severity_enum AS ENUM ('ERROR', 'WARNING', 'INFO');

-- 2. Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role user_role NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL
);

-- 4. Products Table
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    description TEXT,
    specs JSONB NOT NULL DEFAULT '{}',
    image_url TEXT,
    price INT NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0,
    benchmark_score FLOAT DEFAULT 0,
    sync_status sync_status_enum DEFAULT 'PENDING',
    is_active BOOLEAN NOT NULL DEFAULT true,
    category_id UUID NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on JSONB specs and category for high-speed queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_specs ON products USING gin(specs);

-- 5. Product Embeddings Table (Vector DB in PostgreSQL)
CREATE TABLE product_embeddings (
    product_id UUID PRIMARY KEY REFERENCES products(product_id) ON DELETE CASCADE,
    embedding_vector vector(1536) NOT NULL
);

-- HNSW Vector Index for Cosine Similarity search
CREATE INDEX idx_product_embeddings_vector ON product_embeddings 
USING hnsw (embedding_vector vector_cosine_ops);

-- 6. Carts Table
CREATE TABLE carts (
    cart_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Cart Items Table
CREATE TABLE cart_items (
    cart_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    CONSTRAINT uq_cart_product UNIQUE(cart_id, product_id)
);

-- 8. Orders Table
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    shipping_address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    payment_method payment_method_enum NOT NULL DEFAULT 'COD',
    payment_status payment_status_enum NOT NULL DEFAULT 'UNPAID',
    status order_status_enum NOT NULL DEFAULT 'PENDING',
    total_amount INT NOT NULL DEFAULT 0,
    discount_amount INT NOT NULL DEFAULT 0,
    voucher_code VARCHAR(50),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 9. Order Details Table
CREATE TABLE order_details (
    order_detail_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price INT NOT NULL DEFAULT 0
);

-- 10. PC Profiles Table
CREATE TABLE pc_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    profile_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Profile Components Table
CREATE TABLE profile_components (
    component_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES pc_profiles(profile_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

-- 12. Hardware Compatibility Rules Table
CREATE TABLE compat_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    source_category VARCHAR(50) NOT NULL REFERENCES categories(category_code) ON DELETE CASCADE,
    target_category VARCHAR(50) NOT NULL REFERENCES categories(category_code) ON DELETE CASCADE,
    source_spec_key VARCHAR(100) NOT NULL,
    target_spec_key VARCHAR(100) NOT NULL,
    operator rule_operator_enum NOT NULL,
    severity rule_severity_enum NOT NULL,
    error_message_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_compat_rules_pair ON compat_rules(source_category, target_category, is_active);
