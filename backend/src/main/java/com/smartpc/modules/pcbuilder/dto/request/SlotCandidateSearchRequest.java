package com.smartpc.modules.pcbuilder.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Request body cho API lọc ứng viên linh kiện theo slot trong PC Builder (WBS 7.5.1).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotCandidateSearchRequest {

    @JsonProperty("current_items")
    @Builder.Default
    private List<BuildItemInput> currentItems = new ArrayList<>();

    private String search;

    @Builder.Default
    private List<String> brand = new ArrayList<>();

    @JsonProperty("min_price")
    private Integer minPrice;

    @JsonProperty("max_price")
    private Integer maxPrice;

    @Builder.Default
    private Map<String, String> specs = new LinkedHashMap<>();

    @JsonProperty("compatible_only")
    @Builder.Default
    private Boolean compatibleOnly = false;

    @JsonProperty("evaluate_compatibility")
    @Builder.Default
    private Boolean evaluateCompatibility = false;

    @JsonProperty("in_stock_only")
    @Builder.Default
    private Boolean inStockOnly = false;

    @Builder.Default
    private String sort = "newest";

    @Builder.Default
    private Integer page = 0;

    @Builder.Default
    private Integer size = 12;
}
