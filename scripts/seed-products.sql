-- ============================================================================
-- scripts/seed-products.sql
-- Seed dữ liệu linh kiện kho hàng khởi tạo (UC1a, UC2, UC4, UC5)
-- Dùng độc lập cho local dev bootstrap, CI/CD hoặc Docker mysql client
-- ============================================================================

USE smartpc_db;

INSERT IGNORE INTO products (
    product_id, name, brand, description, specs, image_url, gallery_urls,
    price, stock_quantity, benchmark_score, sync_status, is_active, category_id,
    version, created_at, updated_at
) VALUES
-- ============================================================================
-- 1. CPU (Bộ vi xử lý) - Category: c0000001-0000-0000-0000-000000000001
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000001',
    'Bộ vi xử lý Intel Core i5-13600K (Up to 5.1GHz, 14 Cores 20 Threads, 24MB Cache)',
    'INTEL',
    'Vi xử lý Raptor Lake socket LGA1700, 14 nhân 20 luồng, hỗ trợ cả RAM DDR4 và DDR5, hiệu năng render và gaming vượt trội.',
    JSON_OBJECT('socket_type', 'LGA1700', 'tdp_w', 125, 'core_count', 14, 'thread_count', 20, 'integrated_graphics', true),
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY('https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80'),
    7490000, 25, 88.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000001', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000002',
    'Bộ vi xử lý Intel Core i7-14700K (Up to 5.6GHz, 20 Cores 28 Threads, 33MB Cache)',
    'INTEL',
    'Vi xử lý thế hệ 14 Raptor Lake Refresh socket LGA1700, bổ sung thêm E-core, xử lý đa nhiệm cực mạnh cho Creator và Streamer.',
    JSON_OBJECT('socket_type', 'LGA1700', 'tdp_w', 125, 'core_count', 20, 'thread_count', 28, 'integrated_graphics', true),
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    10890000, 15, 94.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000001', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000003',
    'Bộ vi xử lý AMD Ryzen 7 7800X3D (4.2GHz~5.0GHz, 8 Cores 16 Threads, 104MB Cache, Socket AM5)',
    'AMD',
    'Vua vi xử lý Gaming với công nghệ 3D V-Cache độc quyền, tiết kiệm điện năng cực tốt trên nền tảng socket AM5 tân tiến.',
    JSON_OBJECT('socket_type', 'AM5', 'tdp_w', 120, 'core_count', 8, 'thread_count', 16, 'integrated_graphics', true),
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    10490000, 20, 96.5, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000001', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000004',
    'Bộ vi xử lý AMD Ryzen 5 7600 (3.8GHz~5.1GHz, 6 Cores 12 Threads, 38MB Cache, Socket AM5)',
    'AMD',
    'Lựa chọn quốc dân phân khúc tầm trung cho socket AM5, hiệu năng đơn nhân tuyệt vời, đi kèm quạt tản nhiệt Wraith Stealth.',
    JSON_OBJECT('socket_type', 'AM5', 'tdp_w', 65, 'core_count', 6, 'thread_count', 12, 'integrated_graphics', true),
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    5190000, 0, 82.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000001', 0, NOW(), NOW()
),

-- ============================================================================
-- 2. MOTHERBOARD (Bo mạch chủ) - Category: c0000001-0000-0000-0000-000000000002
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000005',
    'Bo mạch chủ ASUS ROG STRIX B760-A GAMING WIFI D4',
    'ASUS',
    'Bo mạch chủ tone trắng sang trọng, hỗ trợ CPU Intel Gen 12/13/14 LGA1700, Wi-Fi 6E, 3 khe M.2 NVMe PCIe 4.0 và RAM DDR4.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700'), 'form_factor', 'ATX', 'supported_memory_types', JSON_ARRAY('DDR4'), 'ram_slots', 4, 'max_ram_gb', 128, 'm2_slots', 3, 'max_pcie_gen', 4.0, 'chipset', 'B760'),
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    5490000, 12, 82.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000002', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000006',
    'Bo mạch chủ MSI MAG Z790 TOMAHAWK WIFI DDR5',
    'MSI',
    'Bo mạch chủ quân sự bền bỉ, tản nhiệt VRM dày dặn, hỗ trợ ép xung CPU Intel LGA1700, 4 khe M.2 PCIe 4.0 và RAM DDR5 tốc độ cao.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700'), 'form_factor', 'ATX', 'supported_memory_types', JSON_ARRAY('DDR5'), 'ram_slots', 4, 'max_ram_gb', 192, 'm2_slots', 4, 'max_pcie_gen', 5.0, 'chipset', 'Z790'),
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    7290000, 18, 90.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000002', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000007',
    'Bo mạch chủ GIGABYTE B650 AORUS ELITE AX',
    'GIGABYTE',
    'Nền tảng tối ưu cho AMD Ryzen 7000/8000/9000 series socket AM5, PCIe 5.0 M.2, Wi-Fi 6E, tản nhiệt M.2 Thermal Guard.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('AM5'), 'form_factor', 'ATX', 'supported_memory_types', JSON_ARRAY('DDR5'), 'ram_slots', 4, 'max_ram_gb', 192, 'm2_slots', 3, 'max_pcie_gen', 5.0, 'chipset', 'B650'),
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    5890000, 22, 86.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000002', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000008',
    'Bo mạch chủ ASRock B650M-HDV/M.2 Micro-ATX',
    'ASROCK',
    'Bo mạch chủ Micro-ATX nhỏ gọn, giá thành tối ưu cho AM5, 2 khe cắm RAM DDR5, trang bị sẵn khe cắm Wi-Fi M.2 Key E.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('AM5'), 'form_factor', 'Micro-ATX', 'supported_memory_types', JSON_ARRAY('DDR5'), 'ram_slots', 2, 'max_ram_gb', 96, 'm2_slots', 2, 'max_pcie_gen', 5.0, 'chipset', 'B650'),
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3190000, 30, 75.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000002', 0, NOW(), NOW()
),

-- ============================================================================
-- 3. RAM (Bộ nhớ trong) - Category: c0000001-0000-0000-0000-000000000003
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000009',
    'RAM Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz Black',
    'CORSAIR',
    'Dòng RAM DDR4 quốc dân tản nhiệt nhôm nguyên chất cấu hình thấp (low profile), tương thích hoàn hảo mọi tản nhiệt khí.',
    JSON_OBJECT('memory_type', 'DDR4', 'capacity_gb', 16, 'bus_speed_mhz', 3200, 'modules_per_kit', 2),
    'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1190000, 40, 72.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000003', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000010',
    'RAM Kingston Fury Beast RGB 32GB (2x16GB) DDR4 3600MHz',
    'KINGSTON',
    'Bộ nhớ DDR4 hiệu năng cao với dải LED RGB đồng bộ ấn tượng, xung nhịp 3600MHz tối ưu độ trễ cho nền tảng Intel và AMD.',
    JSON_OBJECT('memory_type', 'DDR4', 'capacity_gb', 32, 'bus_speed_mhz', 3600, 'modules_per_kit', 2),
    'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2190000, 25, 78.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000003', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000011',
    'RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz Black',
    'CORSAIR',
    'Kit RAM DDR5 thế hệ mới, hỗ trợ cả Intel XMP 3.0 và AMD EXPO, tích hợp PMIC điều áp trên mạch đem lại độ ổn định tối đa.',
    JSON_OBJECT('memory_type', 'DDR5', 'capacity_gb', 32, 'bus_speed_mhz', 6000, 'modules_per_kit', 2),
    'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3290000, 20, 89.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000003', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000012',
    'RAM G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5 6000MHz Silver',
    'GSKILL',
    'Siêu phẩm RAM DDR5 thân nhôm phay xước bạc sang trọng, dung lượng khủng 64GB phục vụ dựng phim 4K/8K và đồ họa 3D hạng nặng.',
    JSON_OBJECT('memory_type', 'DDR5', 'capacity_gb', 64, 'bus_speed_mhz', 6000, 'modules_per_kit', 2),
    'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    5990000, 10, 95.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000003', 0, NOW(), NOW()
),

-- ============================================================================
-- 4. GPU (Card màn hình / VGA) - Category: c0000001-0000-0000-0000-000000000004
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000013',
    'Card màn hình ASUS Dual GeForce RTX 4060 V2 OC 8GB GDDR6',
    'ASUS',
    'Kiến trúc NVIDIA Ada Lovelace tân tiến, 2 quạt công nghệ Axial-tech với vòng chắn giúp tăng áp suất khí, chiều dài chỉ 227mm.',
    JSON_OBJECT('vram_gb', 8, 'length_mm', 227.2, 'tdp_w', 115, 'recommended_psu_w', 550, 'pcie_gen', 4.0, 'vram_type', 'GDDR6'),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY('https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80'),
    7990000, 15, 78.5, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000004', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000014',
    'Card màn hình MSI GeForce RTX 4070 Ti SUPER 16G GAMING X SLIM',
    'MSI',
    'Bộ nhớ VRAM 16GB GDDR6X thoải mái chơi game 2K/4K max settings, tản nhiệt TRI FROZR 3 với quạt TORX Fan 5.0 tối ưu luồng gió.',
    JSON_OBJECT('vram_gb', 16, 'length_mm', 307.0, 'tdp_w', 285, 'recommended_psu_w', 750, 'pcie_gen', 4.0, 'vram_type', 'GDDR6X'),
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    24490000, 8, 94.2, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000004', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000015',
    'Card màn hình GIGABYTE Radeon RX 7800 XT GAMING OC 16GB',
    'GIGABYTE',
    'Kiến trúc AMD RDNA 3, 16GB VRAM, hệ thống làm mát WINDFORCE 3 quạt quay đảo chiều, hỗ trợ công nghệ AMD HYPR-RX và FSR 3.',
    JSON_OBJECT('vram_gb', 16, 'length_mm', 302.0, 'tdp_w', 263, 'recommended_psu_w', 700, 'pcie_gen', 4.0, 'vram_type', 'GDDR6'),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    15290000, 12, 89.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000004', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000016',
    'Card màn hình ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB',
    'ASUS',
    'Đỉnh cao đồ họa thế giới với 24GB VRAM GDDR6X, khung kim loại nguyên khối, quạt tản nhiệt lớn hơn 23% so với thế hệ trước.',
    JSON_OBJECT('vram_gb', 24, 'length_mm', 357.6, 'tdp_w', 450, 'recommended_psu_w', 1000, 'pcie_gen', 4.0, 'vram_type', 'GDDR6X'),
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    52990000, 4, 99.5, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000004', 0, NOW(), NOW()
),

-- ============================================================================
-- 5. SSD_M2 (Ổ cứng M.2 NVMe) - Category: c0000001-0000-0000-0000-000000000005
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000017',
    'Ổ cứng SSD Kingston NV2 500GB M.2 2280 NVMe PCIe 4.0',
    'KINGSTON',
    'Giải pháp nâng cấp lưu trữ thế hệ mới tốc độ đọc 3500 MB/s, thiết kế nhỏ gọn M.2 2280 một mặt, tối ưu điện năng.',
    JSON_OBJECT('interface_type', 'NVMe PCIe 4.0', 'capacity_gb', 500, 'read_speed_mbps', 3500, 'tdp_w', 5.0),
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1090000, 50, 75.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000005', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000018',
    'Ổ cứng SSD Samsung 990 PRO 1TB M.2 PCIe Gen 4.0 x4 NVMe',
    'SAMSUNG',
    'Tốc độ đọc lên tới 7450 MB/s và ghi 6900 MB/s, bộ điều khiển phủ niken tản nhiệt thông minh, dẫn đầu độ bền và tốc độ load game.',
    JSON_OBJECT('interface_type', 'NVMe PCIe 4.0', 'capacity_gb', 1000, 'read_speed_mbps', 7450, 'tdp_w', 8.5),
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2890000, 35, 95.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000005', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000019',
    'Ổ cứng SSD Crucial T700 2TB PCIe Gen 5.0 x4 NVMe M.2',
    'CRUCIAL',
    'Tốc độ đọc cực khủng lên tới 12,400 MB/s chuẩn PCIe 5.0, sẵn sàng cho công nghệ Microsoft DirectStorage và AI training.',
    JSON_OBJECT('interface_type', 'NVMe PCIe 5.0', 'capacity_gb', 2000, 'read_speed_mbps', 12400, 'tdp_w', 11.0),
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    7490000, 8, 99.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000005', 0, NOW(), NOW()
),

-- ============================================================================
-- 6. PSU (Nguồn máy tính) - Category: c0000001-0000-0000-0000-000000000006
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000020',
    'Nguồn máy tính Corsair CV650 650W 80 Plus Bronze',
    'CORSAIR',
    'Nguồn công suất thực 650W chuẩn 80 Plus Bronze đáng tin cậy, quạt làm mát 120mm tự điều tốc giữ cho hệ thống êm ái.',
    JSON_OBJECT('rated_wattage_w', 650, 'efficiency_rating', '80 Plus Bronze', 'form_factor', 'ATX'),
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1490000, 30, 74.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000006', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000021',
    'Nguồn máy tính MSI MAG A750GL PCIE5 750W 80 Plus Gold Modular',
    'MSI',
    'Hỗ trợ chuẩn ATX 3.0 và PCIe 5.0 với đầu nối 12VHPWR nguyên bản màu vàng chống cắm lỏng, hiệu suất 80 Plus Gold cao cấp.',
    JSON_OBJECT('rated_wattage_w', 750, 'efficiency_rating', '80 Plus Gold', 'form_factor', 'ATX'),
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2690000, 25, 86.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000006', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000022',
    'Nguồn máy tính Corsair RM850e 850W 80 Plus Gold Full Modular',
    'CORSAIR',
    'Bộ nguồn fully modular đạt chuẩn Cybenetics Platinum về độ ồn thấp, tụ điện 105°C công nghiệp Nhật Bản vận hành bền bỉ 24/7.',
    JSON_OBJECT('rated_wattage_w', 850, 'efficiency_rating', '80 Plus Gold', 'form_factor', 'ATX'),
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3390000, 18, 90.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000006', 0, NOW(), NOW()
),

-- ============================================================================
-- 7. CASE (Vỏ máy tính) - Category: c0000001-0000-0000-0000-000000000007
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000023',
    'Vỏ máy tính NZXT H5 Flow RGB Black Mid-Tower',
    'NZXT',
    'Thiết kế thông thoáng tối đa luồng khí, quạt đáy chuyên dụng hút gió làm mát trực tiếp cho VGA, kính cường lực nguyên khối.',
    JSON_OBJECT('supported_form_factors', JSON_ARRAY('ATX', 'Micro-ATX', 'Mini-ITX'), 'max_gpu_length_mm', 365.0, 'max_cooler_height_mm', 165.0),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2590000, 14, 85.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000007', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000024',
    'Vỏ máy tính Montech AIR 903 MAX Black E-ATX',
    'MONTECH',
    'Vỏ case lưới thoáng khí cực đại, lắp sẵn 4 quạt HP140 ARGB mạnh mẽ, khoang lắp VGA rộng tới 400mm, tản nhiệt khí tới 180mm.',
    JSON_OBJECT('supported_form_factors', JSON_ARRAY('ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'), 'max_gpu_length_mm', 400.0, 'max_cooler_height_mm', 180.0),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1790000, 20, 88.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000007', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000025',
    'Vỏ máy tính Lian Li O11 Dynamic EVO RGB Black',
    'LIANLI',
    'Case bể cá 2 mặt kính cường lực không cột góc, dải LED RGB viền kép, lắp vừa card đồ họa dài tới 455mm và 3 radiator 360mm cùng lúc.',
    JSON_OBJECT('supported_form_factors', JSON_ARRAY('ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'), 'max_gpu_length_mm', 455.0, 'max_cooler_height_mm', 167.0),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    4190000, 10, 94.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000007', 0, NOW(), NOW()
),

-- ============================================================================
-- 8. CPU_COOLER (Tản nhiệt CPU) - Category: c0000001-0000-0000-0000-000000000008
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000026',
    'Tản nhiệt khí CPU Thermalright Peerless Assassin 120 SE',
    'THERMALRIGHT',
    'Vua tản nhiệt khí tháp đôi 6 ống đồng AGHP thế hệ 4, quạt TL-C12C-S êm ái, cân tốt các dòng CPU công suất tiêu thụ lên tới 245W.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700', 'AM5', 'AM4'), 'cooler_type', 'AIR', 'height_mm', 155.0, 'tdp_w', 245.0),
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    890000, 35, 83.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000008', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000027',
    'Tản nhiệt nước AIO DeepCool LT720 360mm Black',
    'DEEPCOOL',
    'Bơm nước thế hệ thứ 4 công suất cao, mặt gương vô cực đa chiều tuyệt đẹp, làm mát tối ưu cho CPU Intel & AMD TDP tới 300W.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700', 'AM5', 'AM4'), 'cooler_type', 'AIO_360', 'height_mm', 52.0, 'tdp_w', 300.0),
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3490000, 12, 91.5, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000008', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000028',
    'Tản nhiệt nước AIO NZXT Kraken 240 RGB White',
    'NZXT',
    'Màn hình LCD 1.54 inch hiển thị nhiệt độ thời gian thực, quạt tản nhiệt F120 RGB Core áp suất tĩnh cao, ống bọc dù bện cao cấp.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700', 'AM5', 'AM4'), 'cooler_type', 'AIO_240', 'height_mm', 53.0, 'tdp_w', 250.0),
    'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3990000, 9, 88.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000008', 0, NOW(), NOW()
);
