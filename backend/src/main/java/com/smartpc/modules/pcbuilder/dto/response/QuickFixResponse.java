package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Kết quả tổng hợp các chiến lược gợi ý thay thế linh kiện từ mô phỏng Rule Engine (WBS 7.5.5).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuickFixResponse {

    @JsonProperty("violation_rule_id")
    private String violationRuleId;

    @Builder.Default
    private List<QuickFixStrategyGroupDTO> strategies = new ArrayList<>();

    @JsonProperty("evaluation_time_ms")
    private double evaluationTimeMs;

    @JsonProperty("guidance_message")
    private String guidanceMessage;
}
