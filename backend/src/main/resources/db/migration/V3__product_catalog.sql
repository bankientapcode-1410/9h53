-- =========================================================================
-- V3__product_catalog.sql  (MySQL >= 8.0.17: cần cho CHECK & Multi-Valued Index)
-- =========================================================================

-- 1. CATEGORIES: thêm audit columns
ALTER TABLE categories
    ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE INDEX idx_categories_parent ON categories(parent_category_id);

-- 1.1 Seed 3 nhóm cấp 1 và gắn 8 danh mục lá (đã có từ V2) vào nhóm
INSERT IGNORE INTO categories (category_id, category_code, category_name, description, parent_category_id) VALUES
    ('g0000001-0000-0000-0000-000000000001', 'PC_CORE',            'Linh kiện cốt lõi',          'CPU, Mainboard, RAM, VGA', NULL),
    ('g0000001-0000-0000-0000-000000000002', 'STORAGE_DEVICES',    'Thiết bị lưu trữ',           'SSD, HDD',                 NULL),
    ('g0000001-0000-0000-0000-000000000003', 'POWER_COOLING_CASE', 'Nguồn, Tản nhiệt & Vỏ máy',  'PSU, Tản nhiệt, Case',     NULL);

UPDATE categories SET parent_category_id = 'g0000001-0000-0000-0000-000000000001'
 WHERE category_code IN ('CPU', 'MOTHERBOARD', 'RAM', 'GPU');
UPDATE categories SET parent_category_id = 'g0000001-0000-0000-0000-000000000002'
 WHERE category_code IN ('SSD_M2');
UPDATE categories SET parent_category_id = 'g0000001-0000-0000-0000-000000000003'
 WHERE category_code IN ('PSU', 'CASE', 'CPU_COOLER');

-- 2. PRODUCTS: cột nghiệp vụ mới, ràng buộc, cột ảo & chỉ mục
ALTER TABLE products
    ADD COLUMN gallery_urls JSON NULL COMMENT 'Mảng link ảnh bổ sung (tối đa 10)',
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 COMMENT 'Optimistic Locking',
    ADD COLUMN sync_requested_at TIMESTAMP NULL COMMENT 'Thời điểm chuyển PENDING gần nhất (Recovery Job)',
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'Soft delete',
    MODIFY COLUMN benchmark_score DOUBLE NOT NULL DEFAULT 0 COMMENT 'Thang chuẩn hóa 0-100',
    MODIFY COLUMN sync_status ENUM('SYNCED', 'PENDING', 'FAILED') NOT NULL DEFAULT 'PENDING',
    MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ADD CONSTRAINT chk_products_price     CHECK (price >= 0),
    ADD CONSTRAINT chk_products_stock     CHECK (stock_quantity >= 0),
    ADD CONSTRAINT chk_products_benchmark CHECK (benchmark_score BETWEEN 0 AND 100),

    -- Generated Virtual Columns (giá trị đã được SpecSchemaValidator chuẩn hóa kiểu)
    ADD COLUMN v_socket_type VARCHAR(50) GENERATED ALWAYS AS (specs->>'$.socket_type') VIRTUAL,
    ADD COLUMN v_form_factor VARCHAR(50) GENERATED ALWAYS AS (specs->>'$.form_factor') VIRTUAL,
    ADD COLUMN v_memory_type VARCHAR(20) GENERATED ALWAYS AS (specs->>'$.memory_type') VIRTUAL,
    ADD COLUMN v_vram_gb     SMALLINT UNSIGNED GENERATED ALWAYS AS (CAST(specs->>'$.vram_gb' AS UNSIGNED)) VIRTUAL;

-- Đặt sync_requested_at cho dữ liệu cũ đang PENDING để Recovery Job xử lý
UPDATE products SET sync_requested_at = created_at WHERE sync_status = 'PENDING' AND sync_requested_at IS NULL;

-- Chỉ mục danh sách công khai (category + active + chưa xóa luôn có trong WHERE)
CREATE INDEX idx_products_cat_price     ON products (category_id, is_active, deleted_at, price);
CREATE INDEX idx_products_cat_brand     ON products (category_id, is_active, deleted_at, brand);
CREATE INDEX idx_products_cat_benchmark ON products (category_id, is_active, deleted_at, benchmark_score);
CREATE INDEX idx_products_cat_newest    ON products (category_id, is_active, deleted_at, created_at);
-- Chỉ xóa index cũ SAU KHI đã có composite index tiền tố category_id (MySQL yêu cầu FK luôn có index hỗ trợ)
DROP INDEX idx_products_category ON products;

-- Chỉ mục trên cột ảo
CREATE INDEX idx_products_v_socket      ON products (category_id, is_active, v_socket_type);
CREATE INDEX idx_products_v_form_factor ON products (category_id, is_active, v_form_factor);
CREATE INDEX idx_products_v_memory      ON products (category_id, is_active, v_memory_type);
CREATE INDEX idx_products_v_vram        ON products (category_id, is_active, v_vram_gb);

-- Multi-Valued Index cho mảng socket (MOTHERBOARD, CPU_COOLER) - truy vấn bằng MEMBER OF
CREATE INDEX idx_products_mv_sockets ON products ((CAST(specs->'$.supported_sockets' AS CHAR(32) ARRAY)));

-- Chỉ mục cho Admin & Recovery Job
CREATE INDEX idx_products_sync ON products (sync_status, sync_requested_at);

-- 3. PRODUCT_EMBEDDINGS: metadata vector
ALTER TABLE product_embeddings
    ADD COLUMN embedding_model VARCHAR(100) NOT NULL DEFAULT 'text-embedding-004',
    ADD COLUMN dimensions SMALLINT UNSIGNED NOT NULL DEFAULT 768,
    ADD COLUMN content_hash CHAR(64) NOT NULL DEFAULT '' COMMENT 'SHA-256 của model + nội dung embedding',
    ADD COLUMN synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
