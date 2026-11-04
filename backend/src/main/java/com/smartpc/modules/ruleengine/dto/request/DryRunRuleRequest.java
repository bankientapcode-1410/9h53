package com.smartpc.modules.ruleengine.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
public class DryRunRuleRequest {

    @NotNull(message = "Định nghĩa quy tắc không được để trống")
    @Valid
    @JsonProperty("rule_definition")
    private CreateCompatRuleRequest ruleDefinition;

    @Builder.Default
    @JsonProperty("test_items")
    private List<CompatibilityItemRequest> testItems = new ArrayList<>();

    @Builder.Default
    @JsonProperty("test_product_ids")
    private List<String> testProductIds = new ArrayList<>();
}
