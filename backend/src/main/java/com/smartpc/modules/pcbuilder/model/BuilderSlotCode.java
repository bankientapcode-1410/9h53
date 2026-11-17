package com.smartpc.modules.pcbuilder.model;

import lombok.Getter;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Danh mục 8 khe linh kiện cốt lõi của PC Builder (UC2).
 * Khe lưu trữ nội bộ tùy chọn (SSD_SATA) được quản lý qua OPTIONAL_INTERNAL_CODES
 * và 3 thiết bị ngoại vi tùy chọn (MONITOR, KEYBOARD, MOUSE) được quản lý qua
 * PERIPHERAL_CODES, giúp giữ nguyên total_core_slots = 8 và Rule 9 (M.2 Slot Count)
 * chỉ áp dụng cho SSD_M2.
 */
@Getter
public enum BuilderSlotCode {

    CPU(1, true, 1, true),
    MOTHERBOARD(2, true, 1, true),
    RAM(3, false, 16, true),
    GPU(4, true, 1, false),
    SSD_M2(5, false, 16, true),
    PSU(6, true, 1, true),
    CASE(7, true, 1, true),
    CPU_COOLER(8, true, 1, false);

    public static final Set<String> OPTIONAL_INTERNAL_CODES = Set.of("SSD_SATA");

    public static final Set<String> PERIPHERAL_CODES = Set.of("MONITOR", "KEYBOARD", "MOUSE");

    private final int displayOrder;
    private final boolean singleSlot;
    private final int maxQuantity;
    private final boolean recommended;

    BuilderSlotCode(int displayOrder, boolean singleSlot, int maxQuantity, boolean recommended) {
        this.displayOrder = displayOrder;
        this.singleSlot = singleSlot;
        this.maxQuantity = maxQuantity;
        this.recommended = recommended;
    }

    public static Optional<BuilderSlotCode> fromCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        String normalized = code.trim().toUpperCase(Locale.ROOT);
        for (BuilderSlotCode slot : values()) {
            if (slot.name().equals(normalized)) {
                return Optional.of(slot);
            }
        }
        return Optional.empty();
    }

    public static boolean isOptionalInternalSlot(String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        return OPTIONAL_INTERNAL_CODES.contains(code.trim().toUpperCase(Locale.ROOT));
    }

    public static boolean isKnownPeripheral(String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        return PERIPHERAL_CODES.contains(code.trim().toUpperCase(Locale.ROOT));
    }

    public static boolean isValidBuilderSlotOrPeripheral(String code) {
        return fromCode(code).isPresent() || isOptionalInternalSlot(code) || isKnownPeripheral(code);
    }
}
