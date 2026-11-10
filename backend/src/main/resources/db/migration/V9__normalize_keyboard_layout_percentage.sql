-- ============================================================================
-- V9__normalize_keyboard_layout_percentage.sql
-- Chuẩn hóa layout bàn phím: chuyển các cụm như 'Compact 75%' -> '75%', 'Compact 68%' -> '68%'
-- Phù hợp với cách dùng thông dụng chỉ ghi số %
-- ============================================================================

UPDATE products
SET specs = JSON_SET(
        specs,
        '$.layout',
        REGEXP_REPLACE(JSON_UNQUOTE(JSON_EXTRACT(specs, '$.layout')), '(?i)compact\\s+', '')
    ),
    updated_at = NOW()
WHERE category_id = 'c0000001-0000-0000-0000-000000000010'
  AND JSON_UNQUOTE(JSON_EXTRACT(specs, '$.layout')) LIKE 'Compact %';
