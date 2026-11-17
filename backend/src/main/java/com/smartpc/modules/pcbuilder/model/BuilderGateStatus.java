package com.smartpc.modules.pcbuilder.model;

/**
 * Trạng thái cổng kiểm soát an toàn (Risk Gatekeeper) của PC Builder (UC2).
 */
public enum BuilderGateStatus {
    BLOCKED_EMPTY,
    BLOCKED_OUT_OF_STOCK,
    BLOCKED_COMPATIBILITY_ERROR,
    WARNING_CONFIRM_REQUIRED,
    READY_SAFE
}
