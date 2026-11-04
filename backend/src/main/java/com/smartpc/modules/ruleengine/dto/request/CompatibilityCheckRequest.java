package com.smartpc.modules.ruleengine.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class CompatibilityCheckRequest {

    @Builder.Default
    @JsonProperty("product_ids")
    private List<String> productIds = new ArrayList<>();

    @Builder.Default
    @JsonProperty("items")
    private List<CompatibilityItemRequest> items = new ArrayList<>();
}
