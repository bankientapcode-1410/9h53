-- ============================================================================
-- V11__expand_keyboard_led_types_and_products.sql
-- Bổ sung đa dạng loại đèn LED cho danh mục KEYBOARD:
-- 1. Monochrome (LED Đơn sắc / White LED)
-- 2. Rainbow (LED Đa sắc Phân vùng / Fixed Multi-color)
-- 3. None (Không LED / No Backlight)
-- Đảm bảo mỗi lựa chọn lọc của Đèn LED đều có ít nhất 2 sản phẩm thỏa mãn
-- ============================================================================

INSERT IGNORE INTO products (
    product_id, name, brand, description, specs, image_url, gallery_urls,
    price, stock_quantity, benchmark_score, sync_status, is_active, category_id,
    version, created_at, updated_at
) VALUES
-- ============================================================================
-- 1. ĐÈN LED ĐƠN SẮC (MONOCHROME / WHITE LED BACKLIGHT)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000080',
    'Bàn phím cơ không dây Keychron K2 V2 Hot-swap Gateron G Pro Brown Switch (White LED)',
    'KEYCHRON',
    'Bàn phím cơ không dây layout 75% phiên bản LED Đơn sắc trắng (White Backlight) thanh lịch, Hot-swap switch Gateron G Pro Brown tactile êm ái, pin 4000mAh dùng 240 giờ, hỗ trợ Bluetooth 5.1 và Type-C tương thích Mac & Windows.',
    JSON_OBJECT('connection_type', 'Wireless', 'switch_type', 'Mechanical Brown', 'layout', '75%', 'led_type', 'Monochrome'),
    'https://assets.msy.com.au/newsite/images/202302/source_img/Keyboards-Keychron-K2-Pro-75-QMK-VIA-RGB-Wireless-Aluminium-Frame-Mechanical-Keyboard-Red-Switch-3.jpg',
    JSON_ARRAY('https://assets.msy.com.au/newsite/images/202302/source_img/Keyboards-Keychron-K2-Pro-75-QMK-VIA-RGB-Wireless-Aluminium-Frame-Mechanical-Keyboard-Red-Switch-3.jpg'),
    1890000, 25, 86.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000081',
    'Bàn phím cơ có dây Logitech G413 SE Mechanical Gaming Keyboard White LED',
    'LOGITECH',
    'Bàn phím cơ Fullsize 104 phím mặt vỏ hợp kim nhôm-magiê 5052 cao cấp, switch cơ Tactile nhạy bén bền bỉ, keycap PBT chống mài mòn, hệ thống đèn LED đơn sắc trắng sang trọng tinh tế.',
    JSON_OBJECT('connection_type', 'Wired', 'switch_type', 'Mechanical Brown', 'layout', 'Fullsize 104', 'led_type', 'Monochrome'),
    'https://d3mk240zzrnosz.cloudfront.net/assets/XC8040_logitech-g512-carbon-lightsync-rgb-mechanical-gaming-keyboard-with-gx-brown-switches_124960.jpg',
    JSON_ARRAY('https://d3mk240zzrnosz.cloudfront.net/assets/XC8040_logitech-g512-carbon-lightsync-rgb-mechanical-gaming-keyboard-with-gx-brown-switches_124960.jpg'),
    1590000, 30, 84.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),

-- ============================================================================
-- 2. ĐÈN LED RAINBOW (ĐA SẮC PHÂN VÙNG / FIXED MULTI-COLOR)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000082',
    'Bàn phím cơ có dây E-Dra EK387 Rainbow Huano Red Switch (Tenkeyless)',
    'E-DRA',
    'Bàn phím cơ Tenkeyless TKL quốc dân cho học sinh sinh viên, trang bị switch Huano Red siêu mượt tuổi thọ 50 triệu lần bấm, hệ thống LED Rainbow phân vùng nhiều màu rực rỡ với nhiều chế độ nhấp nháy chuyển động.',
    JSON_OBJECT('connection_type', 'Wired', 'switch_type', 'Mechanical Red', 'layout', 'Tenkeyless (TKL)', 'led_type', 'Rainbow'),
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY('https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80'),
    650000, 50, 80.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000083',
    'Bàn phím cơ có dây DareU EK87 Multi-LED Rainbow Brown Switch',
    'DAREU',
    'Bàn phím cơ layout TKL 87 phím nhỏ gọn, sử dụng switch cơ học DareU D-Switch Brown bền bỉ có khấc tactile, hệ thống đèn Multi-LED Rainbow cố định từng hàng sống động, keycap ABS Double-shot bền màu.',
    JSON_OBJECT('connection_type', 'Wired', 'switch_type', 'Mechanical Brown', 'layout', 'Tenkeyless (TKL)', 'led_type', 'Rainbow'),
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY('https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80'),
    590000, 45, 79.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),

-- ============================================================================
-- 3. KHÔNG ĐÈN LED (NONE / NO BACKLIGHT)
-- ============================================================================
(
    'e0000001-0000-0000-0000-000000000084',
    'Bàn phím cơ cao cấp Leopold FC750R PD White Grey Cherry MX Blue',
    'LEOPOLD',
    'Bàn phím cơ Tenkeyless TKL tiêu chuẩn cao cấp đến từ Hàn Quốc, keycap PBT Double-shot dầy 1.5mm chống bóng tuyệt đối, switch Cherry MX Blue clicky giòn tan, vải đệm tiêu âm Sound Absorbing Pad dày dặn, hoàn toàn Không LED tập trung tối đa cảm giác gõ.',
    JSON_OBJECT('connection_type', 'Wired', 'switch_type', 'Mechanical Blue', 'layout', 'Tenkeyless (TKL)', 'led_type', 'None'),
    'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY('https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80'),
    3250000, 15, 95.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
),
(
    'e0000001-0000-0000-0000-000000000085',
    'Bàn phím cơ không dây Leopold FC900RBT Charcoal Blue Bluetooth Cherry MX Brown',
    'LEOPOLD',
    'Bàn phím cơ Fullsize 104 phím kết nối không dây Bluetooth 5.1 và Type-C, switch cơ cao cấp Cherry MX Brown tactile, thiết kế Không LED tiết kiệm pin sử dụng tới 3-4 tháng với 2 viên pin AAA, cảm giác gõ đỉnh cao.',
    JSON_OBJECT('connection_type', 'Wireless', 'switch_type', 'Mechanical Brown', 'layout', 'Fullsize 104', 'led_type', 'None'),
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    JSON_ARRAY('https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80'),
    3890000, 12, 96.0, 'SYNCED', true, 'c0000001-0000-0000-0000-000000000010', 0, NOW(), NOW()
);
