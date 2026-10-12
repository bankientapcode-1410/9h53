-- ====================================================================
-- SmartPC Seed Data: Categories and Core Hardware Compatibility Rules
-- Based on prj1.md Section 3 & Section 4
-- ====================================================================

-- 1. Base Categories
INSERT INTO categories (category_id, category_code, category_name, description, parent_category_id)
VALUES 
    ('c0000001-0000-0000-0000-000000000001', 'CPU', 'Bộ vi xử lý (CPU)', 'Vi xử lý trung tâm Intel, AMD', NULL),
    ('c0000001-0000-0000-0000-000000000002', 'MOTHERBOARD', 'Bo mạch chủ (Mainboard)', 'Bo mạch chủ ASUS, MSI, Gigabyte, ASRock', NULL),
    ('c0000001-0000-0000-0000-000000000003', 'RAM', 'Bộ nhớ trong (RAM)', 'Bộ nhớ DDR4, DDR5 Kingston, Corsair, G.Skill', NULL),
    ('c0000001-0000-0000-0000-000000000004', 'GPU', 'Card màn hình (VGA)', 'Card đồ họa NVIDIA GeForce, AMD Radeon', NULL),
    ('c0000001-0000-0000-0000-000000000005', 'SSD_M2', 'Ổ cứng SSD M.2 NVMe', 'Ổ cứng tốc độ cao M.2 PCIe Gen 3, Gen 4, Gen 5', NULL),
    ('c0000001-0000-0000-0000-000000000006', 'PSU', 'Nguồn máy tính (PSU)', 'Nguồn công suất thực Corsair, Cooler Master, Seasonic', NULL),
    ('c0000001-0000-0000-0000-000000000007', 'CASE', 'Vỏ máy tính (Case)', 'Vỏ case ATX, Micro-ATX, Mini-ITX', NULL),
    ('c0000001-0000-0000-0000-000000000008', 'CPU_COOLER', 'Tản nhiệt CPU', 'Tản nhiệt khí, tản nhiệt nước AIO', NULL)
ON CONFLICT (category_code) DO NOTHING;

-- 2. Hardware Compatibility Rules (Compat_Rule)
INSERT INTO compat_rules (
    rule_id, rule_name, source_category, target_category, 
    source_spec_key, operator, target_spec_key, 
    severity, error_message_template, is_active, priority, created_at
)
VALUES
(
    'r0000001-0000-0000-0000-000000000001',
    'CPU-Motherboard Socket Match',
    'CPU',
    'MOTHERBOARD',
    'socket_type',
    'IN',
    'supported_sockets',
    'ERROR',
    'CPU socket {source_value} không tương thích với Mainboard (hỗ trợ: {target_value}). Vui lòng chọn Mainboard có socket phù hợp.',
    true,
    1,
    NOW()
),
(
    'r0000001-0000-0000-0000-000000000002',
    'RAM Type Compatibility',
    'RAM',
    'MOTHERBOARD',
    'memory_type',
    'IN',
    'supported_memory_types',
    'ERROR',
    'Chuẩn RAM {source_value} không lắp vừa khe cắm của Mainboard (hỗ trợ: {target_value}).',
    true,
    2,
    NOW()
),
(
    'r0000001-0000-0000-0000-000000000003',
    'RAM Slot Count',
    'RAM',
    'MOTHERBOARD',
    '_count',
    'LTE',
    'ram_slots',
    'ERROR',
    'Số lượng thanh RAM ({source_value}) vượt quá số khe cắm khả dụng trên Mainboard ({target_value} khe).',
    true,
    3,
    NOW()
),
(
    'r0000001-0000-0000-0000-000000000004',
    'Max RAM Capacity',
    'RAM',
    'MOTHERBOARD',
    '_sum_capacity_gb',
    'LTE',
    'max_ram_gb',
    'ERROR',
    'Tổng dung lượng RAM ({source_value} GB) vượt quá giới hạn tối đa mà Mainboard hỗ trợ ({target_value} GB).',
    true,
    4,
    NOW()
),
(
    'r0000001-0000-0000-0000-000000000005',
    'GPU Length vs Case',
    'GPU',
    'CASE',
    'length_mm',
    'LTE',
    'max_gpu_length_mm',
    'ERROR',
    'Chiều dài Card đồ họa ({source_value} mm) vượt quá kích thước khoang lắp GPU của Vỏ Case ({target_value} mm).',
    true,
    5,
    NOW()
),
(
    'r0000001-0000-0000-0000-000000000006',
    'CPU Cooler Socket Support',
    'CPU',
    'CPU_COOLER',
    'socket_type',
    'IN',
    'supported_sockets',
    'ERROR',
    'Tản nhiệt CPU không hỗ trợ gông cắm socket {source_value} của CPU hiện tại.',
    true,
    6,
    NOW()
),
(
    'r0000001-0000-0000-0000-000000000007',
    'PSU Wattage Sufficiency',
    'CPU', -- evaluated against aggregated system TDP
    'PSU',
    '_total_tdp_w',
    'LTE',
    'rated_wattage_w',
    'WARNING',
    'Tổng công suất tiêu thụ ước tính của hệ thống ({source_value}W) tiệm cận hoặc vượt quá công suất định mức của bộ nguồn ({target_value}W). Khuyến nghị nâng cấp nguồn để tránh sập nguồn khi tải nặng.',
    true,
    7,
    NOW()
),
(
    'r0000001-0000-0000-0000-000000000008',
    'Mainboard Form Factor vs Case',
    'MOTHERBOARD',
    'CASE',
    'form_factor',
    'IN',
    'supported_form_factors',
    'ERROR',
    'Kích thước bo mạch chủ {source_value} không lắp vừa vỏ Case (hỗ trợ chuẩn: {target_value}).',
    true,
    8,
    NOW()
),
(
    'r0000001-0000-0000-0000-000000000009',
    'M.2 Slot Count',
    'SSD_M2',
    'MOTHERBOARD',
    '_count',
    'LTE',
    'm2_slots',
    'WARNING',
    'Số lượng ổ cứng SSD M.2 ({source_value}) vượt quá số khe cắm M.2 trực tiếp trên bo mạch chủ ({target_value} khe). Bạn có thể cần thẻ mở rộng PCIe.',
    true,
    9,
    NOW()
),
(
    'r0000001-0000-0000-0000-000000000010',
    'PCIe Generation',
    'GPU',
    'MOTHERBOARD',
    'pcie_gen',
    'LTE',
    'max_pcie_gen',
    'INFO',
    'Card đồ họa chạy chuẩn PCIe {source_value} trong khi khe cắm Mainboard hỗ trợ tối đa PCIe {target_value}. Linh kiện vẫn hoạt động bình thường nhờ tính tương thích ngược, nhưng băng thông có thể giảm nhẹ.',
    true,
    10,
    NOW()
)
ON CONFLICT (rule_id) DO NOTHING;
