package com.smartpc.modules.ruleengine.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
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
public class CompatibilityResult {

    @JsonProperty("is_compatible")
    private boolean isCompatible;

    @Builder.Default
    private List<ViolationDetail> errors = new ArrayList<>();

    @Builder.Default
    private List<ViolationDetail> warnings = new ArrayList<>();

    @Builder.Default
    private List<ViolationDetail> info = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViolationDetail {
        @JsonProperty("rule_id")
        private String ruleId;

        @JsonProperty("rule_name")
        private String ruleName;

        private RuleSeverity severity;
        private String message;

        @JsonProperty("source_product")
        private ProductReference sourceProduct;

        @JsonProperty("target_product")
        private ProductReference targetProduct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductReference {
        private String id;
        private String name;

        @JsonProperty("category_code")
        private String categoryCode;
    }
}
