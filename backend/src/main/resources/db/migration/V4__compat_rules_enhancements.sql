-- ============================================================================
-- V4__compat_rules_enhancements.sql
-- Nâng cấp bảng compat_rules phục vụ Core Rule Engine (UC6 & WBS 7.4)
-- ============================================================================

-- 1. Gỡ FK cứng trên source_category để cho phép lưu hằng số đặc biệt '_SYSTEM'
--    và đổi FK trên target_category từ ON DELETE CASCADE sang ON DELETE RESTRICT
ALTER TABLE compat_rules
    DROP FOREIGN KEY fk_compat_rules_source,
    DROP FOREIGN KEY fk_compat_rules_target;

ALTER TABLE compat_rules
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE compat_rules
    ADD CONSTRAINT fk_compat_rules_target
        FOREIGN KEY (target_category) REFERENCES categories (category_code)
        ON UPDATE CASCADE ON DELETE RESTRICT;

-- 2. Chỉ mục tối ưu cho RuleCacheManager nạp toàn bộ luật đang active theo priority ASC
CREATE INDEX idx_compat_rules_active_priority
    ON compat_rules (is_active, priority ASC);

-- 3. Chỉ mục Unique chống tạo trùng định nghĩa quy tắc tương thích
CREATE UNIQUE INDEX uk_compat_rules_definition
    ON compat_rules (
        source_category,
        target_category,
        source_spec_key,
        target_spec_key,
        operator
    );
