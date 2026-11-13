-- ============================================================================
-- V6__peripherals_and_expanded_inventory.sql
-- 1. Thêm nhóm danh mục cấp 1 PERIPHERALS & 3 danh mục lá: MONITOR, KEYBOARD, MOUSE
-- 2. Seed mở rộng 41 linh kiện & thiết bị mẫu (đưa tổng kho lên 69 sản phẩm)
-- 3. Đảm bảo mọi danh mục khi chọn bất kỳ điều kiện lọc nào đều có ít nhất 2 sản phẩm
-- ============================================================================

-- 1. Bổ sung Nhóm Cấp 1 PERIPHERALS
INSERT IGNORE INTO categories (category_id, category_code, category_name, description, parent_category_id, created_at, updated_at) VALUES
('g0000001-0000-0000-0000-000000000004', 'PERIPHERALS', 'Màn hình & Thiết bị ngoại vi', 'Màn hình máy tính, bàn phím cơ, chuột gaming cao cấp', NULL, NOW(), NOW());

-- 1.1 Bổ sung 3 Danh mục lá: MONITOR, KEYBOARD, MOUSE
INSERT IGNORE INTO categories (category_id, category_code, category_name, description, parent_category_id, created_at, updated_at) VALUES
('c0000001-0000-0000-0000-000000000009', 'MONITOR', 'Màn hình máy tính (Monitor)', 'Màn hình Gaming, Đồ họa IPS/OLED 144Hz-240Hz', 'g0000001-0000-0000-0000-000000000004', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000010', 'KEYBOARD', 'Bàn phím cơ (Keyboard)', 'Bàn phím cơ Gaming, văn phòng, switch cơ học, wireless', 'g0000001-0000-0000-0000-000000000004', NOW(), NOW()),
('c0000001-0000-0000-0000-000000000011', 'MOUSE', 'Chuột máy tính (Mouse)', 'Chuột gaming không dây/có dây, cảm biến quang học DPI cao', 'g0000001-0000-0000-0000-000000000004', NOW(), NOW());

-- 2. Seed mở rộng 41 sản phẩm mới chất lượng cao
INSERT IGNORE INTO products (
    product_id, name, brand, description, specs, image_url, gallery_urls,
    price, stock_quantity, benchmark_score, sync_status, is_active, category_id,
    version, created_at, updated_at
) VALUES
-- ============================================================================
-- 1. Bổ sung CPU (Không iGPU cho LGA1700 & AM5)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000029',
    'Bộ vi xử lý Intel Core i5-13400F (Up to 4.6GHz, 10 Cores 16 Threads, 20MB Cache)',
    'INTEL',
    'CPU Intel Gen 13 socket LGA1700 quốc dân cho phân khúc tầm trung giá rẻ, không iGPU, tối ưu chi phí khi lắp kèm card đồ họa rời.',
    JSON_OBJECT('socket_type', 'LGA1700', 'tdp_w', 65, 'core_count', 10, 'thread_count', 16, 'integrated_graphics', false),
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    4890000, 35, 80.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000001', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000030',
    'Bộ vi xử lý Intel Core i5-14600KF (Up to 5.3GHz, 14 Cores 20 Threads, 24MB Cache)',
    'INTEL',
    'CPU thế hệ 14 mở khóa ép xung Raptor Lake Refresh socket LGA1700, hiệu năng đơn nhân và đa nhiệm cực mạnh, không tích hợp iGPU.',
    JSON_OBJECT('socket_type', 'LGA1700', 'tdp_w', 125, 'core_count', 14, 'thread_count', 20, 'integrated_graphics', false),
    'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    7690000, 20, 89.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000001', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000031',
    'Bộ vi xử lý AMD Ryzen 5 7500F (3.7GHz~5.0GHz, 6 Cores 12 Threads, 38MB Cache, Socket AM5)',
    'AMD',
    'Lựa chọn tối ưu hiệu năng trên giá thành cho socket AM5, 6 nhân 12 luồng kiến trúc Zen 4, không tích hợp iGPU, nhiệt độ mát mẻ.',
    JSON_OBJECT('socket_type', 'AM5', 'tdp_w', 65, 'core_count', 6, 'thread_count', 12, 'integrated_graphics', false),
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3990000, 40, 81.5, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000001', 0, NOW(), NOW()
),

-- ============================================================================
-- 2. Bổ sung MOTHERBOARD (Đủ cặp LGA1700 DDR4, AM5 ATX, AM5 Micro-ATX)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000032',
    'Bo mạch chủ MSI PRO B760M-P DDR4 Micro-ATX',
    'MSI',
    'Bo mạch chủ Micro-ATX kinh tế cho Intel Gen 12/13/14 LGA1700, hỗ trợ 4 khe RAM DDR4 dung lượng tối đa 128GB, 2 khe M.2 NVMe PCIe 4.0.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700'), 'form_factor', 'Micro-ATX', 'supported_memory_types', JSON_ARRAY('DDR4'), 'ram_slots', 4, 'max_ram_gb', 128, 'm2_slots', 2, 'max_pcie_gen', 4.0, 'chipset', 'B760'),
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2890000, 25, 76.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000002', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000033',
    'Bo mạch chủ ASUS TUF GAMING B650-PLUS WIFI ATX',
    'ASUS',
    'Bo mạch chủ chuẩn độ bền quân đội TUF cho socket AM5, PCIe 5.0 M.2, Wi-Fi 6, tản nhiệt VRM lớn, hỗ trợ RAM DDR5 bus cao.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('AM5'), 'form_factor', 'ATX', 'supported_memory_types', JSON_ARRAY('DDR5'), 'ram_slots', 4, 'max_ram_gb', 192, 'm2_slots', 3, 'max_pcie_gen', 5.0, 'chipset', 'B650'),
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    5490000, 15, 87.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000002', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000034',
    'Bo mạch chủ MSI PRO B650M-A WIFI Micro-ATX',
    'MSI',
    'Bo mạch chủ Micro-ATX socket AM5 trang bị sẵn Wi-Fi 6E, tản nhiệt M.2 Shield Frozr, kết nối mạng LAN 2.5G tốc độ cao.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('AM5'), 'form_factor', 'Micro-ATX', 'supported_memory_types', JSON_ARRAY('DDR5'), 'ram_slots', 4, 'max_ram_gb', 192, 'm2_slots', 2, 'max_pcie_gen', 4.0, 'chipset', 'B650'),
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3990000, 18, 80.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000002', 0, NOW(), NOW()
),

-- ============================================================================
-- 3. Bổ sung RAM (Đủ cặp 16GB, 32GB cho cả DDR4 và DDR5)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000035',
    'Bộ nhớ RAM Kingston FURY Beast Black 16GB (2x8GB) DDR4 3200MHz',
    'KINGSTON',
    'Kit 2 thanh RAM 8GB DDR4 bus 3200MHz tản nhiệt nhôm đen nguyên khối, hỗ trợ Intel XMP 2.0 tự động nhận cấu hình tối ưu.',
    JSON_OBJECT('memory_type', 'DDR4', 'capacity_gb', 16, 'bus_speed_mhz', 3200, 'modules_per_kit', 2),
    'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    990000, 60, 75.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000003', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000036',
    'Bộ nhớ RAM Corsair Vengeance RGB RS 32GB (2x16GB) DDR4 3600MHz',
    'CORSAIR',
    'Kit RAM DDR4 32GB hiệu năng cao bus 3600MHz, dải LED RGB rực rỡ đồng bộ phần mềm iCUE, tản nhiệt nhôm anodized đen bóng bẩy.',
    JSON_OBJECT('memory_type', 'DDR4', 'capacity_gb', 32, 'bus_speed_mhz', 3600, 'modules_per_kit', 2),
    'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1990000, 40, 84.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000003', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000037',
    'Bộ nhớ RAM Kingston FURY Beast RGB 32GB (2x16GB) DDR5 5600MHz',
    'KINGSTON',
    'Kit RAM DDR5 thế hệ mới tích hợp công nghệ FURY Infrared Sync, bus 5600MHz CL36 hỗ trợ cả Intel XMP 3.0 và AMD EXPO.',
    JSON_OBJECT('memory_type', 'DDR5', 'capacity_gb', 32, 'bus_speed_mhz', 5600, 'modules_per_kit', 2),
    'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2890000, 30, 89.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000003', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000038',
    'Bộ nhớ RAM Corsair Dominator Titanium RGB 64GB (2x32GB) DDR5 6000MHz',
    'CORSAIR',
    'Kit RAM DDR5 cao cấp bậc nhất với linh kiện chọn lọc tỉ mỉ, công nghệ làm mát DHX đã được cấp bằng sáng chế, bus 6000MHz.',
    JSON_OBJECT('memory_type', 'DDR5', 'capacity_gb', 64, 'bus_speed_mhz', 6000, 'modules_per_kit', 2),
    'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    6490000, 10, 97.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000003', 0, NOW(), NOW()
),

-- ============================================================================
-- 4. Bổ sung GPU (Đủ cặp 12GB VRAM và 16GB VRAM)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000039',
    'Card màn hình GIGABYTE GeForce RTX 4070 WINDFORCE OC 12GB',
    'GIGABYTE',
    'Card đồ họa kiến trúc Ada Lovelace với hệ thống tản nhiệt 3 quạt WINDFORCE độc quyền, 12GB GDDR6X, cân mượt game 2K Ray Tracing và DLSS 3.',
    JSON_OBJECT('vram_gb', 12, 'length_mm', 261.0, 'tdp_w', 200.0, 'recommended_psu_w', 650, 'pcie_gen', 4.0, 'vram_type', 'GDDR6X'),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    15990000, 14, 91.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000004', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000040',
    'Card màn hình MSI GeForce RTX 4080 SUPER 16GB GAMING X SLIM',
    'MSI',
    'Siêu card đồ họa 16GB VRAM thiết kế GAMING X SLIM nhỏ gọn hơn, quạt TORX FAN 5.0, sức mạnh vượt trội cho Gaming 4K và tác vụ AI tạo sinh.',
    JSON_OBJECT('vram_gb', 16, 'length_mm', 322.0, 'tdp_w', 320.0, 'recommended_psu_w', 750, 'pcie_gen', 4.0, 'vram_type', 'GDDR6X'),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    28990000, 8, 98.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000004', 0, NOW(), NOW()
),

-- ============================================================================
-- 5. Bổ sung SSD_M2 (Đủ cặp 500GB, 1000GB và 2000GB)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000041',
    'Ổ cứng SSD Kingston KC3000 1TB M.2 PCIe 4.0 NVMe',
    'KINGSTON',
    'Ổ cứng SSD chuẩn PCIe 4.0 NVMe tốc độ cao 7000MB/s, trang bị miếng tản nhiệt nhôm graphene mỏng nhẹ, tối ưu cho PC Gaming và PS5.',
    JSON_OBJECT('interface_type', 'NVMe PCIe 4.0', 'capacity_gb', 1000, 'read_speed_mbps', 7000, 'tdp_w', 8.0),
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2390000, 45, 93.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000005', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000042',
    'Ổ cứng SSD Samsung 990 PRO 2TB M.2 PCIe 4.0 NVMe',
    'SAMSUNG',
    'Ông vua tốc độ SSD Gen 4 với tốc độ đọc tuần tự 7450MB/s, dung lượng khủng 2TB, độ bền ghi TBW vượt trội cho Render video 4K/8K.',
    JSON_OBJECT('interface_type', 'NVMe PCIe 4.0', 'capacity_gb', 2000, 'read_speed_mbps', 7450, 'tdp_w', 8.5),
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    4990000, 20, 99.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000005', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000043',
    'Ổ cứng SSD Kingston NV2 500GB M.2 PCIe 4.0 NVMe',
    'KINGSTON',
    'SSD PCIe 4.0 dung lượng 500GB giá phổ thông, tốc độ đọc 3500MB/s, giải pháp nâng cấp dung lượng và cài đặt hệ điều hành mượt mà.',
    JSON_OBJECT('interface_type', 'NVMe PCIe 4.0', 'capacity_gb', 500, 'read_speed_mbps', 3500, 'tdp_w', 5.0),
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1090000, 50, 78.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000005', 0, NOW(), NOW()
),

-- ============================================================================
-- 6. Bổ sung PSU (Đủ cặp 650W, 750W và 850W)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000044',
    'Nguồn máy tính Corsair CV650 650W 80 Plus Bronze',
    'CORSAIR',
    'Nguồn máy tính công suất thực 650W chuẩn 80 Plus Bronze, quạt 120mm điều khiển thông minh giữ nhiệt độ và độ ồn ở mức tối thiểu.',
    JSON_OBJECT('rated_wattage_w', 650, 'efficiency_rating', '80 Plus Bronze', 'form_factor', 'ATX'),
    'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1450000, 35, 78.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000006', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000045',
    'Nguồn máy tính GIGABYTE UD750GM 750W 80 Plus Gold Full Modular',
    'GIGABYTE',
    'Nguồn công suất 750W 80 Plus Gold, dây rời Full Modular gọn gàng, tụ điện 100% Nhật Bản đảm bảo độ tin cậy và bền bỉ tối đa.',
    JSON_OBJECT('rated_wattage_w', 750, 'efficiency_rating', '80 Plus Gold', 'form_factor', 'ATX'),
    'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2290000, 22, 88.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000006', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000046',
    'Nguồn máy tính Corsair RM850e 850W 80 Plus Gold ATX 3.0',
    'CORSAIR',
    'Nguồn máy tính 850W chuẩn ATX 3.0 và PCIe 5.0 với dây 12VHPWR cấp nguồn trực tiếp cho VGA dòng RTX 40 series không cần đầu chuyển.',
    JSON_OBJECT('rated_wattage_w', 850, 'efficiency_rating', '80 Plus Gold', 'form_factor', 'ATX'),
    'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3290000, 18, 93.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000006', 0, NOW(), NOW()
),

-- ============================================================================
-- 7. Bổ sung CASE (Đủ cặp Micro-ATX nhỏ gọn & ATX rộng rãi)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000047',
    'Vỏ Case Montech AIR 100 ARGB Black Micro-ATX',
    'MONTECH',
    'Vỏ máy tính Micro-ATX nhỏ gọn trang bị sẵn 4 quạt ARGB, mặt lưới trước siêu thoáng khí, hỗ trợ GPU dài tới 330mm.',
    JSON_OBJECT('supported_form_factors', JSON_ARRAY('Micro-ATX', 'Mini-ITX'), 'max_gpu_length_mm', 330.0, 'max_cooler_height_mm', 161.0),
    'https://images.unsplash.com/photo-1587202372195-e669cb486718?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1190000, 25, 82.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000007', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000048',
    'Vỏ Case Lian Li O11 Dynamic EVO Black ATX',
    'LIAN LI',
    'Vỏ case bể cá 2 mặt kính cường lực trong suốt đẳng cấp, không gian rộng rãi lắp đặt linh hoạt, hỗ trợ tản nhiệt nước AIO 360mm nóc và cạnh.',
    JSON_OBJECT('supported_form_factors', JSON_ARRAY('ATX', 'Micro-ATX', 'Mini-ITX'), 'max_gpu_length_mm', 422.0, 'max_cooler_height_mm', 167.0),
    'https://images.unsplash.com/photo-1587202372195-e669cb486718?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3890000, 12, 95.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000007', 0, NOW(), NOW()
),

-- ============================================================================
-- 8. Bổ sung CPU_COOLER (Đủ cặp Tản khí AIR, AIO 240mm, AIO 360mm)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000049',
    'Tản nhiệt khí Deepcool AK620 Digital Black',
    'DEEPCOOL',
    'Tản nhiệt khí tháp đôi 6 ống đồng hiệu năng đỉnh cao tích hợp màn hình số hiển thị nhiệt độ CPU theo thời gian thực, tản nhiệt tốt tới 260W TDP.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700', 'AM5'), 'cooler_type', 'AIR', 'height_mm', 162.0, 'tdp_w', 260.0),
    'https://images.unsplash.com/photo-1587202372574-63338569c027?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1490000, 20, 89.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000008', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000050',
    'Tản nhiệt nước Deepcool LS520 SE 240mm ARGB',
    'DEEPCOOL',
    'Tản nhiệt nước AIO 240mm máy bơm thế hệ thứ 4 êm ái, mặt gương vô cực ARGB huyền ảo, công nghệ chống rò rỉ Anti-Leak độc quyền.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700', 'AM5'), 'cooler_type', 'AIO_240', 'height_mm', 52.0, 'tdp_w', 280.0),
    'https://images.unsplash.com/photo-1587202372574-63338569c027?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1950000, 18, 88.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000008', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000051',
    'Tản nhiệt nước NZXT Kraken 360 RGB Black',
    'NZXT',
    'Tản nhiệt nước AIO 360mm trang bị màn hình LCD 1.54 inch hiển thị ảnh GIF và thông số hệ thống, 3 quạt F120 RGB Core làm mát cực êm.',
    JSON_OBJECT('supported_sockets', JSON_ARRAY('LGA1700', 'AM5'), 'cooler_type', 'AIO_360', 'height_mm', 53.0, 'tdp_w', 350.0),
    'https://images.unsplash.com/photo-1587202372574-63338569c027?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    4990000, 10, 96.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000008', 0, NOW(), NOW()
),

-- ============================================================================
-- 9. Danh mục MỚI: MONITOR (Màn hình máy tính) - 6 Sản phẩm (24", 27", 32")
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000052',
    'Màn hình Gaming LG UltraGear 24GN65R-B 24 inch FHD IPS 144Hz 1ms',
    'LG',
    'Màn hình gaming quốc dân 24 inch độ phân giải FHD tấm nền IPS màu sắc chuẩn xác, tần số quét 144Hz, thời gian phản hồi 1ms MBR, hỗ trợ AMD FreeSync Premium.',
    JSON_OBJECT('screen_size_inch', 24.0, 'resolution', 'FHD (1920x1080)', 'refresh_rate_hz', 144, 'panel_type', 'IPS', 'response_time_ms', 1.0),
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3390000, 30, 85.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000009', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000053',
    'Màn hình Gaming ASUS TUF Gaming VG249Q3A 24 inch FHD Fast IPS 180Hz 1ms',
    'ASUS',
    'Màn hình eSports 24 inch FHD sử dụng tấm nền Fast IPS tần số quét siêu mượt 180Hz, công nghệ ELMB chống nhòe chuyển động và DisplayWidget Center tiện lợi.',
    JSON_OBJECT('screen_size_inch', 24.0, 'resolution', 'FHD (1920x1080)', 'refresh_rate_hz', 180, 'panel_type', 'Fast IPS', 'response_time_ms', 1.0),
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3590000, 25, 87.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000009', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000054',
    'Màn hình Gaming LG UltraGear 27GP850-B 27 inch 2K QHD Nano IPS 165Hz',
    'LG',
    'Màn hình đồ họa và gaming cao cấp 27 inch 2K QHD tấm nền Nano IPS 1ms, độ phủ màu 98% DCI-P3, tương thích NVIDIA G-Sync Compatible và VESA DisplayHDR 400.',
    JSON_OBJECT('screen_size_inch', 27.0, 'resolution', '2K QHD (2560x1440)', 'refresh_rate_hz', 165, 'panel_type', 'IPS', 'response_time_ms', 1.0),
    'https://images.unsplash.com/photo-1585792180666-f7547c690e7d?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    7890000, 20, 93.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000009', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000055',
    'Màn hình Gaming ASUS ROG Strix XG27ACS 27 inch 2K QHD Fast IPS 180Hz Type-C',
    'ASUS',
    'Màn hình ROG Strix 27 inch 2K QHD tấm nền Fast IPS 180Hz 1ms, cổng USB Type-C hỗ trợ sạc và xuất hình, tích hợp khe cắm giá đỡ điện thoại trên chân đế.',
    JSON_OBJECT('screen_size_inch', 27.0, 'resolution', '2K QHD (2560x1440)', 'refresh_rate_hz', 180, 'panel_type', 'Fast IPS', 'response_time_ms', 1.0),
    'https://images.unsplash.com/photo-1585792180666-f7547c690e7d?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    7490000, 18, 92.5, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000009', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000056',
    'Màn hình Đồ họa Dell UltraSharp U3223QE 31.5 inch 4K UHD IPS Black Type-C Hub',
    'DELL',
    'Màn hình chuyên nghiệp 32 inch 4K UHD công nghệ IPS Black cho tỷ lệ tương phản 2000:1, độ bao phủ 100% sRGB và 98% DCI-P3, cổng kết nối RJ45 và sạc 90W PD.',
    JSON_OBJECT('screen_size_inch', 32.0, 'resolution', '4K UHD (3840x2160)', 'refresh_rate_hz', 60, 'panel_type', 'IPS', 'response_time_ms', 5.0),
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    18990000, 10, 96.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000009', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000057',
    'Màn hình Gaming Samsung Odyssey Neo G7 32 inch 4K UHD 165Hz Mini-LED',
    'SAMSUNG',
    'Màn hình cong 1000R 32 inch 4K UHD công nghệ đèn nền Quantum Mini-LED siêu thực, độ sáng đỉnh 2000 nits, tần số quét 165Hz, trải nghiệm gaming đỉnh cao.',
    JSON_OBJECT('screen_size_inch', 32.0, 'resolution', '4K UHD (3840x2160)', 'refresh_rate_hz', 165, 'panel_type', 'VA', 'response_time_ms', 1.0),
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    19990000, 8, 97.5, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000009', 0, NOW(), NOW()
),

-- ============================================================================
-- 10. Danh mục MỚI: KEYBOARD (Bàn phím cơ) - 6 Sản phẩm (Wireless, Wired, TKL, 75%, Fullsize)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000058',
    'Bàn phím cơ không dây Akko 5075B Plus Dracula Castle RGB',
    'AKKO',
    'Bàn phím cơ layout 75% núm xoay kim loại, cấu trúc Gasket Mount êm ái, switch Akko CS Cream Yellow mượt mà, 3 chế độ kết nối Bluetooth 5.0, 2.4GHz và Type-C.',
    JSON_OBJECT('connection_type', 'Wireless', 'switch_type', 'Mechanical Red', 'layout', 'Compact 75%', 'led_type', 'RGB'),
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2190000, 35, 86.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000059',
    'Bàn phím cơ không dây Keychron K2 Pro QMK/VIA Red Switch RGB',
    'KEYCHRON',
    'Bàn phím cơ 75% tùy biến QMK/VIA chuyên nghiệp, Keycap PBT Double-shot OSA profile, switch cơ học Keychron K Pro Red gõ đầm tay, hỗ trợ cả Mac và Windows.',
    JSON_OBJECT('connection_type', 'Wireless', 'switch_type', 'Mechanical Red', 'layout', 'Compact 75%', 'led_type', 'RGB'),
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2490000, 25, 88.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000060',
    'Bàn phím cơ có dây Corsair K70 RGB PRO Cherry MX Red Fullsize 104',
    'CORSAIR',
    'Bàn phím gaming Fullsize khung nhôm phay xước cao cấp, switch cơ Cherry MX Red bền bỉ 100 triệu lần nhấn, công nghệ siêu xử lý AXON tần số phản hồi 8000Hz.',
    JSON_OBJECT('connection_type', 'Wired', 'switch_type', 'Mechanical Red', 'layout', 'Fullsize 104', 'led_type', 'RGB'),
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3690000, 20, 92.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000061',
    'Bàn phím cơ có dây Logitech G512 Carbon Lightsync RGB Brown Switch Fullsize',
    'LOGITECH',
    'Bàn phím hợp kim nhôm-magiê 5052 siêu bền, switch tactile GX Brown đem lại cảm giác phản hồi xúc giác rõ ràng khi gõ văn bản và chơi game.',
    JSON_OBJECT('connection_type', 'Wired', 'switch_type', 'Mechanical Brown', 'layout', 'Fullsize 104', 'led_type', 'RGB'),
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1990000, 30, 84.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000062',
    'Bàn phím cơ SteelSeries Apex Pro TKL OmniPoint Switch Có dây',
    'STEELSERIES',
    'Bàn phím gaming TKL số 1 thế giới với switch quang từ OmniPoint 2.0 tùy chỉnh điểm kích hoạt từ 0.2mm đến 3.8mm, màn hình OLED thông minh hiển thị profile.',
    JSON_OBJECT('connection_type', 'Wired', 'switch_type', 'Optical Switch', 'layout', 'Tenkeyless (TKL)', 'led_type', 'RGB'),
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    4890000, 15, 96.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000063',
    'Bàn phím cơ không dây ASUS ROG Strix Scope II 96 Wireless ROG NX Snow',
    'ASUS',
    'Bàn phím không dây layout 96% đầy đủ phím số mà gọn gàng như TKL, switch cơ ROG NX Snow được bôi trơn sẵn cực êm, đệm tiêu âm silicon cao cấp.',
    JSON_OBJECT('connection_type', 'Wireless', 'switch_type', 'Mechanical Red', 'layout', 'Tenkeyless (TKL)', 'led_type', 'RGB'),
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3990000, 14, 93.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),

-- ============================================================================
-- 11. Danh mục MỚI: MOUSE (Chuột máy tính) - 6 Sản phẩm (Wireless, Wired, Siêu nhẹ)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000064',
    'Chuột gaming không dây Logitech G Pro X Superlight 2 Lightspeed Black',
    'LOGITECH',
    'Chuột thi đấu eSports đỉnh cao trọng lượng siêu nhẹ 60g, cảm biến HERO 2 độ phân giải 32000 DPI, switch quang cơ học LIGHTFORCE lai không bao giờ double-click.',
    JSON_OBJECT('connection_type', 'Wireless', 'dpi', 32000, 'sensor', 'Optical', 'weight_g', 60),
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3490000, 25, 98.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000011', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000065',
    'Chuột gaming không dây Razer Viper V2 Pro Ultra-lightweight White',
    'RAZER',
    'Chuột gaming không dây đối xứng chỉ 58g, cảm biến quang học Focus Pro 30K DPI, switch quang Gen-3 độ trễ 0.2ms, pin hoạt động liên tục 80 giờ.',
    JSON_OBJECT('connection_type', 'Wireless', 'dpi', 30000, 'sensor', 'Optical', 'weight_g', 58),
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    3190000, 20, 96.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000011', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000066',
    'Chuột gaming không dây Pulsar X2V2 Wireless Black Size 2',
    'PULSAR',
    'Chuột không dây siêu nhẹ 53g không lỗ, cảm biến PixArt PAW3395 26000 DPI, cuộn chuột Pulsar Blue Encoder nảy giòn, hỗ trợ Polling Rate lên đến 4K Hz.',
    JSON_OBJECT('connection_type', 'Wireless', 'dpi', 26000, 'sensor', 'Optical', 'weight_g', 53),
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    2390000, 22, 90.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000011', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000067',
    'Chuột gaming có dây Razer DeathAdder V3 Ultra-lightweight Black',
    'RAZER',
    'Huyền thoại công thái học DeathAdder V3 chỉ 59g, cảm biến quang học Focus Pro 30K DPI, tần số lấy mẫu thực 8000Hz phản xạ tức thì trong từng pha vẩy tâm.',
    JSON_OBJECT('connection_type', 'Wired', 'dpi', 30000, 'sensor', 'Optical', 'weight_g', 59),
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1590000, 35, 91.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000011', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000068',
    'Chuột gaming có dây Logitech G502 HERO High Performance 25600 DPI',
    'LOGITECH',
    'Biểu tượng gaming với 11 nút bấm có thể lập trình, cảm biến HERO 25K DPI, tạ điều chỉnh trọng lượng linh hoạt và con lăn siêu tốc 2 chế độ độc quyền.',
    JSON_OBJECT('connection_type', 'Wired', 'dpi', 25600, 'sensor', 'Optical', 'weight_g', 121),
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    1090000, 45, 87.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000011', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000069',
    'Chuột gaming có dây SteelSeries Rival 3 RGB Prism Lighting',
    'STEELSERIES',
    'Chuột gaming form cầm đối xứng chất liệu polymer siêu bền, cảm biến TrueMove Core 8500 DPI, switch cơ học độ bền 60 triệu lần nhấn và viền LED Prism RGB.',
    JSON_OBJECT('connection_type', 'Wired', 'dpi', 8500, 'sensor', 'Optical', 'weight_g', 77),
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY(),
    790000, 50, 81.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000011', 0, NOW(), NOW()
);
