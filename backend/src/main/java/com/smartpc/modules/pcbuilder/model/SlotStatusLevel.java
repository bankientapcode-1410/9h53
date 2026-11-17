package com.smartpc.modules.pcbuilder.model;

import lombok.Getter;

/**
 * Mức độ trạng thái tương thích của từng khe linh kiện trong PC Builder.
 * Độ ưu tiên: ERROR > WARNING > INFO > COMPATIBLE > EMPTY.
 */
@Getter
public enum SlotStatusLevel {

    EMPTY(0),
    COMPATIBLE(1),
    INFO(2),
    WARNING(3),
    ERROR(4);

    private final int priority;

    SlotStatusLevel(int priority) {
        this.priority = priority;
    }

    public SlotStatusLevel max(SlotStatusLevel candidate) {
        if (candidate == null) {
            return this;
        }
        return candidate.priority > this.priority ? candidate : this;
    }
}
