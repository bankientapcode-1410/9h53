-- ============================================================================
-- V12__add_ssd_sata_category_and_products.sql
-- Mở rộng nhóm Thiết bị lưu trữ (STORAGE_DEVICES) theo Phương án PA1 (không HDD):
-- 1. Cập nhật mô tả nhóm STORAGE_DEVICES phản ánh 2 dòng SSD cho máy cá nhân
-- 2. Thêm danh mục lá SSD_SATA (c0000001-0000-0000-0000-000000000012)
-- 3. Seed 12 sản phẩm Ổ cứng SSD SATA 2.5" thực tế (240GB -> 2TB)
--    Đảm bảo mỗi hãng (KINGSTON, WD, CRUCIAL, SAMSUNG) và mỗi dung lượng đều >= 2 SP
-- ============================================================================

UPDATE categories
SET description = 'Ổ cứng SSD M.2 NVMe & SSD SATA 2.5"',
    updated_at = NOW()
WHERE category_code = 'STORAGE_DEVICES';

INSERT INTO categories (
    category_id, category_code, category_name, description, parent_category_id, created_at, updated_at
) VALUES (
    'c0000001-0000-0000-0000-000000000012',
    'SSD_SATA',
    'Ổ cứng SSD SATA 2.5"',
    'Ổ cứng SSD chuẩn 2.5 inch giao tiếp SATA III 6Gb/s ổn định, tiết kiệm cho máy tính cá nhân',
    'g0000001-0000-0000-0000-000000000002',
    NOW(),
    NOW()
) AS new_cat
ON DUPLICATE KEY UPDATE
    category_name = new_cat.category_name,
    description = new_cat.description,
    parent_category_id = new_cat.parent_category_id,
    updated_at = NOW();

INSERT IGNORE INTO products (
    product_id, name, brand, description, specs, image_url, gallery_urls,
    price, stock_quantity, benchmark_score, sync_status, is_active, category_id,
    version, created_at, updated_at
) VALUES
-- ============================================================================
-- 1. PHÂN KHÚC 240GB (Nâng cấp văn phòng & lưu hệ điều hành tiết kiệm)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000086',
    'Ổ cứng SSD Kingston A400 240GB 2.5" SATA III',
    'KINGSTON',
    'Ổ cứng thể rắn Kingston A400 dung lượng 240GB chuẩn 2.5 inch SATA III 6Gb/s, tốc độ đọc tuần tự lên tới 500 MB/s, tối ưu chi phí khởi động Windows và ứng dụng văn phòng cho máy tính cá nhân.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 240, 'read_speed_mbps', 500, 'write_speed_mbps', 350, 'tdp_w', 1.5),
    '/images/products/e0000001-0000-0000-0000-000000000086.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000086.svg'),
    590000, 45, 62.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000087',
    'Ổ cứng SSD WD Green 240GB 2.5" SATA III',
    'WD',
    'Ổ cứng SSD Western Digital Green 240GB kích thước 2.5 inch mỏng 7mm, giao tiếp SATA III 6Gb/s với tốc độ đọc 545 MB/s, tiêu thụ điện năng cực thấp và chống sốc SLC Caching bền bỉ.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 240, 'read_speed_mbps', 545, 'write_speed_mbps', 430, 'tdp_w', 1.8),
    '/images/products/e0000001-0000-0000-0000-000000000087.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000087.svg'),
    570000, 40, 63.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),

-- ============================================================================
-- 2. PHÂN KHÚC 480GB (Lưu trữ đa năng giá hợp lý)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000088',
    'Ổ cứng SSD Kingston A400 480GB 2.5" SATA III',
    'KINGSTON',
    'Ổ cứng SSD Kingston A400 480GB chuẩn 2.5 inch SATA III 6Gb/s, đọc 500 MB/s và ghi 450 MB/s, mang lại không gian thoải mái chứa hệ điều hành, phần mềm đồ họa nhẹ và tài liệu cá nhân.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 480, 'read_speed_mbps', 500, 'write_speed_mbps', 450, 'tdp_w', 1.6),
    '/images/products/e0000001-0000-0000-0000-000000000088.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000088.svg'),
    890000, 38, 66.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000089',
    'Ổ cứng SSD Crucial BX500 480GB 2.5" SATA III',
    'CRUCIAL',
    'Ổ cứng SSD Crucial BX500 480GB sử dụng chip nhớ Micron 3D NAND tin cậy, tốc độ đọc 540 MB/s và ghi 500 MB/s qua cổng SATA III 6Gb/s, dễ dàng nâng cấp tốc độ cho PC cá nhân.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 480, 'read_speed_mbps', 540, 'write_speed_mbps', 500, 'tdp_w', 2.0),
    '/images/products/e0000001-0000-0000-0000-000000000089.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000089.svg'),
    850000, 36, 68.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),

-- ============================================================================
-- 3. PHÂN KHÚC 500GB (Hiệu năng ổn định & độ bền cao)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000090',
    'Ổ cứng SSD WD Blue SA510 500GB 2.5" SATA III',
    'WD',
    'Ổ cứng SSD WD Blue SA510 500GB thiết kế dành riêng cho người dùng sáng tạo nội dung và PC cá nhân, đạt tốc độ đọc tối đa 560 MB/s và ghi 510 MB/s qua giao tiếp SATA III 6Gb/s.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 500, 'read_speed_mbps', 560, 'write_speed_mbps', 510, 'tdp_w', 2.2),
    '/images/products/e0000001-0000-0000-0000-000000000090.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000090.svg'),
    1150000, 32, 72.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000091',
    'Ổ cứng SSD Crucial MX500 500GB 2.5" SATA III',
    'CRUCIAL',
    'Ổ cứng SSD Crucial MX500 500GB tích hợp bộ nhớ đệm DRAM Cache và bảo vệ mất điện đột ngột, đọc 560 MB/s và ghi 510 MB/s, cực kỳ bền bỉ khi làm ổ cài đặt hệ điều hành lẫn lưu game.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 500, 'read_speed_mbps', 560, 'write_speed_mbps', 510, 'tdp_w', 2.5),
    '/images/products/e0000001-0000-0000-0000-000000000091.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000091.svg'),
    1290000, 30, 76.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000092',
    'Ổ cứng SSD Samsung 870 EVO 500GB 2.5" SATA III',
    'SAMSUNG',
    'Ổ cứng SSD Samsung 870 EVO 500GB dẫn đầu phân khúc SATA 2.5 inch với V-NAND thế hệ mới và controller MKX, đạt ngưỡng bão hòa SATA III 560 MB/s đọc, 530 MB/s ghi cùng độ bền 300 TBW.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 500, 'read_speed_mbps', 560, 'write_speed_mbps', 530, 'tdp_w', 2.5),
    '/images/products/e0000001-0000-0000-0000-000000000092.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000092.svg'),
    1490000, 28, 80.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),

-- ============================================================================
-- 4. PHÂN KHÚC 1TB / 1000GB (Mở rộng kho game và dữ liệu cá nhân)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000093',
    'Ổ cứng SSD WD Blue SA510 1TB 2.5" SATA III',
    'WD',
    'Ổ cứng SSD WD Blue SA510 dung lượng lớn 1TB chuẩn 2.5 inch SATA III, tốc độ đọc 560 MB/s và ghi 520 MB/s, giải pháp lưu trữ thư viện ảnh RAW, video và game thay thế hoàn toàn ổ HDD truyền thống.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 1000, 'read_speed_mbps', 560, 'write_speed_mbps', 520, 'tdp_w', 2.5),
    '/images/products/e0000001-0000-0000-0000-000000000093.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000093.svg'),
    1950000, 24, 75.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000094',
    'Ổ cứng SSD Crucial MX500 1TB 2.5" SATA III',
    'CRUCIAL',
    'Ổ cứng SSD Crucial MX500 1TB chuẩn 2.5 inch SATA III có DRAM Cache và mã hóa phần cứng AES 256-bit, đọc 560 MB/s và ghi 510 MB/s, vận hành êm ái và ổn định cho bộ máy làm việc lẫn giải trí.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 1000, 'read_speed_mbps', 560, 'write_speed_mbps', 510, 'tdp_w', 3.0),
    '/images/products/e0000001-0000-0000-0000-000000000094.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000094.svg'),
    2190000, 22, 79.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000095',
    'Ổ cứng SSD Samsung 870 EVO 1TB 2.5" SATA III',
    'SAMSUNG',
    'Ổ cứng SSD Samsung 870 EVO 1TB SATA III trang bị 1GB LPDDR4 DRAM Cache và công nghệ Intelligent TurboWrite, tốc độ đọc 560 MB/s và độ bền lên đến 600 TBW cho nhu cầu sử dụng cường độ cao.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 1000, 'read_speed_mbps', 560, 'write_speed_mbps', 530, 'tdp_w', 3.0),
    '/images/products/e0000001-0000-0000-0000-000000000095.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000095.svg'),
    2590000, 20, 84.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),

-- ============================================================================
-- 5. PHÂN KHÚC 2TB / 2000GB (Kho chứa dung lượng lớn không cần HDD)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000096',
    'Ổ cứng SSD Crucial BX500 2TB 2.5" SATA III',
    'CRUCIAL',
    'Ổ cứng SSD Crucial BX500 2TB dung lượng lớn chuẩn 2.5 inch SATA III 6Gb/s, đọc 540 MB/s và ghi 500 MB/s, giải pháp mở rộng bộ nhớ im lặng, tốc độ cao gấp nhiều lần HDD cho dàn PC cá nhân.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 2000, 'read_speed_mbps', 540, 'write_speed_mbps', 500, 'tdp_w', 2.8),
    '/images/products/e0000001-0000-0000-0000-000000000096.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000096.svg'),
    3590000, 14, 74.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000097',
    'Ổ cứng SSD Samsung 870 QVO 2TB 2.5" SATA III',
    'SAMSUNG',
    'Ổ cứng SSD Samsung 870 QVO 2TB chuẩn 2.5 inch SATA III tối ưu cho nhu cầu lưu trữ dung lượng khủng trên máy tính cá nhân, đọc 560 MB/s và ghi 530 MB/s với độ bền 720 TBW.',
    JSON_OBJECT('interface_type', 'SATA III 6Gb/s', 'form_factor', '2.5 inch', 'capacity_gb', 2000, 'read_speed_mbps', 560, 'write_speed_mbps', 530, 'tdp_w', 3.2),
    '/images/products/e0000001-0000-0000-0000-000000000097.svg',
    JSON_ARRAY('/images/products/e0000001-0000-0000-0000-000000000097.svg'),
    4290000, 12, 78.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000012', 0, NOW(), NOW()
);
