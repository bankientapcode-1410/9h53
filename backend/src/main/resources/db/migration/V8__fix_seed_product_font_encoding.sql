-- ============================================================================
-- V8__fix_seed_product_font_encoding.sql
-- Khắc phục lỗi font tiếng Việt và chuẩn hóa bảng mã UTF-8 cho các sản phẩm seed V7
-- ============================================================================

UPDATE products
SET 
    name = 'Card màn hình MSI GeForce RTX 4060 Ventus 2X Black 8GB GDDR6',
    description = 'Card màn hình 8GB VRAM tối ưu cho Gaming Full HD 1080p, kiến trúc Ada Lovelace tiết kiệm điện năng chỉ 115W, tản nhiệt quạt TORX 4.0.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000070';

UPDATE products
SET 
    name = 'Card màn hình ASUS Dual GeForce RTX 4070 White OC Edition 12GB GDDR6X',
    description = 'Card đồ họa tone màu trắng tuyết sang trọng, 12GB GDDR6X băng thông cao, 2 quạt công nghệ Axial-tech với vòng bi quạt kép siêu bền.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000071';

UPDATE products
SET 
    name = 'Màn hình Gaming AOC 24G2SE 24 inch FHD VA 165Hz 1ms Cong',
    description = 'Màn hình gaming 24 inch FHD tấm nền VA độ tương phản 3500:1 sâu thẳm, tần số quét 165Hz, thời gian phản hồi 1ms MPRT, hỗ trợ HDR Mode.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000072';

UPDATE products
SET 
    name = 'Màn hình Gaming Samsung Odyssey G3 24 inch FHD VA 144Hz 1ms Chân xoay',
    description = 'Màn hình gaming 24 inch FHD 144Hz viền siêu mỏng 3 cạnh, chân đế công thái học nâng hạ và xoay 90 độ linh hoạt, bảo vệ mắt Eye Saver.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000073';

UPDATE products
SET 
    name = 'Bàn phím cơ không dây Akko 3084B Plus Black & Cyan Brown Switch',
    description = 'Bàn phím cơ layout 84 phím nhỏ gọn, switch Akko CS Jelly Brown xúc giác êm ái, pin dung lượng 3000mAh, kết nối Bluetooth 5.0 và 2.4GHz.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000074';

UPDATE products
SET 
    name = 'Bàn phím cơ có dây Razer Huntsman V2 Tenkeyless Optical Red Switch',
    description = 'Bàn phím gaming TKL sử dụng switch quang học tuyến tính Linear Optical thế hệ 2 siêu nhạy không độ trễ, foam tiêu âm tích hợp sẵn.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000075';

UPDATE products
SET 
    name = 'Chuột gaming không dây Razer Basilisk V3 Pro 30000 DPI RGB',
    description = 'Chuột công thái học cao cấp với con lăn nghiêng tự do HyperScroll, cảm biến quang Focus Pro 30K DPI, 13 vùng sáng Chroma RGB độc lập.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000076';

UPDATE products
SET 
    name = 'Chuột gaming không dây ASUS ROG Harpe Ace Aim Lab Edition 32000 DPI',
    description = 'Chuột thi đấu hợp tác cùng Aim Lab, trọng lượng chỉ 54g, cảm biến ROG AimPoint 36000 DPI, kết nối ROG SpeedNova 2.4GHz siêu tốc.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000077';

UPDATE products
SET 
    name = 'Chuột gaming có dây Razer Viper Mini 8500 DPI Siêu nhẹ 61g',
    description = 'Chuột gaming form nhỏ đối xứng siêu nhẹ 61g, switch quang học bền 50 triệu lần nhấn, cảm biến quang 8500 DPI, cáp bọc dù Speedflex.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000078';

UPDATE products
SET 
    name = 'Bo mạch chủ GIGABYTE Z790 AORUS ELITE AX DDR5 ATX',
    description = 'Bo mạch chủ cao cấp cho CPU Intel Gen 12/13/14 LGA1700, dàn nguồn 16+1+2 phase VRM, 4 khe M.2 PCIe 4.0 tản nhiệt Thermal Guard, Wi-Fi 6E.',
    updated_at = NOW()
WHERE product_id = 'e0000001-0000-0000-0000-000000000079';
