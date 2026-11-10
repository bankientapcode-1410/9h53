-- ============================================================================
-- V7__supplemental_test_seed_coverage.sql
-- Bổ sung linh kiện & thiết bị ngoại vi mẫu đảm bảo mọi nhánh điều kiện lọc >= 2 sản phẩm
-- ============================================================================

INSERT IGNORE INTO products (
    product_id, name, brand, description, specs, image_url, gallery_urls,
    price, stock_quantity, benchmark_score, sync_status, is_active, category_id,
    version, created_at, updated_at
) VALUES
(
    'e0000001-0000-0000-0000-000000000070',
    'Card màn hình MSI GeForce RTX 4060 Ventus 2X Black 8GB GDDR6',
    'MSI',
    'Card màn hình 8GB VRAM tối ưu cho Gaming Full HD 1080p, kiến trúc Ada Lovelace tiết kiệm điện năng chỉ 115W, tản nhiệt quạt TORX 4.0.',
    JSON_OBJECT('vram_gb', 8, 'length_mm', 199.0, 'tdp_w', 115.0, 'recommended_psu_w', 550, 'pcie_gen', 4.0, 'vram_type', 'GDDR6'),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    8290000, 30, 85.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000004', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000071',
    'Card màn hình ASUS Dual GeForce RTX 4070 White OC Edition 12GB GDDR6X',
    'ASUS',
    'Card đồ họa tone màu trắng tuyết sang trọng, 12GB GDDR6X băng thông cao, 2 quạt công nghệ Axial-tech với vòng bi quạt kép siêu bền.',
    JSON_OBJECT('vram_gb', 12, 'length_mm', 267.0, 'tdp_w', 200.0, 'recommended_psu_w', 650, 'pcie_gen', 4.0, 'vram_type', 'GDDR6X'),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    16890000, 15, 91.5, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000004', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000072',
    'Màn hình Gaming AOC 24G2SE 24 inch FHD VA 165Hz 1ms Cong',
    'AOC',
    'Màn hình gaming 24 inch FHD tấm nền VA độ tương phản 3500:1 sâu thẳm, tần số quét 165Hz, thời gian phản hồi 1ms MPRT, hỗ trợ HDR Mode.',
    JSON_OBJECT('screen_size_inch', 24.0, 'resolution', 'FHD (1920x1080)', 'refresh_rate_hz', 165, 'panel_type', 'VA', 'response_time_ms', 1.0),
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2890000, 35, 83.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000009', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000073',
    'Màn hình Gaming Samsung Odyssey G3 24 inch FHD VA 144Hz 1ms Chân xoay',
    'SAMSUNG',
    'Màn hình gaming 24 inch FHD 144Hz viền siêu mỏng 3 cạnh, chân đế công thái học nâng hạ và xoay 90 độ linh hoạt, bảo vệ mắt Eye Saver.',
    JSON_OBJECT('screen_size_inch', 24.0, 'resolution', 'FHD (1920x1080)', 'refresh_rate_hz', 144, 'panel_type', 'VA', 'response_time_ms', 1.0),
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3190000, 28, 84.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000009', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000074',
    'Bàn phím cơ không dây Akko 3084B Plus Black & Cyan Brown Switch',
    'AKKO',
    'Bàn phím cơ layout 84 phím nhỏ gọn, switch Akko CS Jelly Brown xúc giác êm ái, pin dung lượng 3000mAh, kết nối Bluetooth 5.0 và 2.4GHz.',
    JSON_OBJECT('connection_type', 'Wireless', 'switch_type', 'Mechanical Brown', 'layout', 'Compact 75%', 'led_type', 'RGB'),
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1990000, 25, 85.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000075',
    'Bàn phím cơ có dây Razer Huntsman V2 Tenkeyless Optical Red Switch',
    'RAZER',
    'Bàn phím gaming TKL sử dụng switch quang học tuyến tính Linear Optical thế hệ 2 siêu nhạy không độ trễ, foam tiêu âm tích hợp sẵn.',
    JSON_OBJECT('connection_type', 'Wired', 'switch_type', 'Optical Switch', 'layout', 'Tenkeyless (TKL)', 'led_type', 'RGB'),
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3490000, 18, 93.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000076',
    'Chuột gaming không dây Razer Basilisk V3 Pro 30000 DPI RGB',
    'RAZER',
    'Chuột công thái học cao cấp với con lăn nghiêng tự do HyperScroll, cảm biến quang Focus Pro 30K DPI, 13 vùng sáng Chroma RGB độc lập.',
    JSON_OBJECT('connection_type', 'Wireless', 'dpi', 30000, 'sensor', 'Optical', 'weight_g', 112),
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3690000, 15, 95.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000011', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000077',
    'Chuột gaming không dây ASUS ROG Harpe Ace Aim Lab Edition 32000 DPI',
    'ASUS',
    'Chuột thi đấu hợp tác cùng Aim Lab, trọng lượng chỉ 54g, cảm biến ROG AimPoint 36000 DPI, kết nối ROG SpeedNova 2.4GHz siêu tốc.',
    JSON_OBJECT('connection_type', 'Wireless', 'dpi', 32000, 'sensor', 'Optical', 'weight_g', 54),
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3190000, 20, 94.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000011', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000078',
    'Chuột gaming có dây Razer Viper Mini 8500 DPI Siêu nhẹ 61g',
    'RAZER',
    'Chuột gaming form nhỏ đối xứng siêu nhẹ 61g, switch quang học bền 50 triệu lần nhấn, cảm biến quang 8500 DPI, cáp bọc dù Speedflex.',
    JSON_OBJECT('connection_type', 'Wired', 'dpi', 8500, 'sensor', 'Optical', 'weight_g', 61),
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    690000, 40, 83.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000011', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000079',
    'Bo mạch chủ GIGABYTE Z790 AORUS ELITE AX DDR5 ATX',
    'GIGABYTE',
    'Bo mạch chủ cao cấp cho CPU Intel Gen 12/13/14 LGA1700, dàn nguồn 16+1+2 phase VRM, 4 khe M.2 PCIe 4.0 tản nhiệt Thermal Guard, Wi-Fi 6E.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700'), 'form_factor', 'ATX', 'supported_memory_types', JSON_ARRAY('DDR5'), 'ram_slots', 4, 'max_ram_gb', 192, 'm2_slots', 4, 'max_pcie_gen', 5.0, 'chipset', 'Z790'),
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    6990000, 16, 91.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000002', 0, NOW(), NOW()
);
