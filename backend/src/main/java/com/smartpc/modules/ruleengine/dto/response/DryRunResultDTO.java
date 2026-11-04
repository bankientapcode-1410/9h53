package com.smartpc.modules.ruleengine.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ViolationDetail;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DryRunResultDTO {

    @JsonProperty("is_compatible")
    private boolean isCompatible;

    @JsonProperty("extracted_source_value")
    private Object extractedSourceValue;

    @JsonProperty("extracted_target_value")
    private Object extractedTargetValue;

    @JsonProperty("rendered_violation_message")
    private String renderedViolationMessage;

    @Builder.Default
    @JsonProperty("violations")
    private List<ViolationDetail> violations = new ArrayList<>();

    @Builder.Default
    @JsonProperty("missing_spec_warnings")
    private List<String> missingSpecWarnings = new ArrayList<>();

    @JsonProperty("execution_time_ms")
    private Double executionTimeMs;
}
