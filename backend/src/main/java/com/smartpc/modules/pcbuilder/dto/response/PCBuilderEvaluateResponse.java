package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.pcbuilder.model.BuilderGateStatus;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Kết quả đánh giá cấu hình PC Builder toàn diện (Tương thích UC6, Telemetry, Slot Statuses, Gatekeeper).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PCBuilderEvaluateResponse {

    private CompatibilityResult compatibility;

    private BuildTelemetryDTO telemetry;

    @Builder.Default
    @JsonProperty("slot_statuses")
    private Map<String, SlotDiagnosticDTO> slotStatuses = new LinkedHashMap<>();

    @JsonProperty("gate_status")
    private BuilderGateStatus gateStatus;

    @Builder.Default
    @JsonProperty("stock_issues")
    private List<StockIssueDTO> stockIssues = new ArrayList<>();

    @Builder.Default
    @JsonProperty("missing_recommended_slots")
    private List<String> missingRecommendedSlots = new ArrayList<>();
}
