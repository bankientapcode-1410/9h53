package com.smartpc.modules.ruleengine.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
    @Valid
    @Size(max = CompatibilityCheckRequest.MAX_REQUEST_ENTRIES, message = "Danh sách test_items tối đa 100 phần tử")
    @JsonProperty("test_items")
    private List<CompatibilityItemRequest> testItems = new ArrayList<>();

    @Builder.Default
    @Size(max = CompatibilityCheckRequest.MAX_REQUEST_ENTRIES, message = "Danh sách test_product_ids tối đa 100 phần tử")
    @JsonProperty("test_product_ids")
    private List<String> testProductIds = new ArrayList<>();
}
