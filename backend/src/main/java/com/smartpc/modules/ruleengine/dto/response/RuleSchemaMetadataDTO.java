package com.smartpc.modules.ruleengine.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleSchemaMetadataDTO {

    @Builder.Default
    @JsonProperty("categories")
    private List<CategoryItemDTO> categories = new ArrayList<>();

    @Builder.Default
    @JsonProperty("spec_keys_by_category")
    private Map<String, List<SpecKeyItemDTO>> specKeysByCategory = new LinkedHashMap<>();

    @Builder.Default
    @JsonProperty("builtin_aggregate_keys")
    private List<AggregateKeyItemDTO> builtinAggregateKeys = new ArrayList<>();

    @Builder.Default
    @JsonProperty("operators")
    private List<RuleOperator> operators = new ArrayList<>();

    @Builder.Default
    @JsonProperty("severities")
    private List<RuleSeverity> severities = new ArrayList<>();

    @Builder.Default
    @JsonProperty("allowed_placeholders")
    private List<String> allowedPlaceholders = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryItemDTO {
        @JsonProperty("category_code")
        private String categoryCode;

        @JsonProperty("category_name")
        private String categoryName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecKeyItemDTO {
        private String key;
        private String label;
        private String type;
        private boolean required;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AggregateKeyItemDTO {
        private String key;
        private String label;

        @JsonProperty("supported_operators")
        private List<RuleOperator> supportedOperators;
    }
}
