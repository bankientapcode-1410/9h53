package com.smartpc.modules.product.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.product.entity.ProductSyncStatus;
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
public class ProductFilterCriteria {

    private String category;

    @Builder.Default
    private List<String> brand = new ArrayList<>();

    @JsonProperty("min_price")
    private Integer minPrice;

    @JsonProperty("max_price")
    private Integer maxPrice;

    @Builder.Default
    private Map<String, String> specs = new LinkedHashMap<>();

    @Builder.Default
    private String sort = "newest";

    @Builder.Default
    private Integer page = 0;

    @Builder.Default
    private Integer size = 12;

    @JsonProperty("include_deleted")
    @Builder.Default
    private Boolean includeDeleted = false;

    @JsonProperty("sync_status")
    private ProductSyncStatus syncStatus;

    @JsonProperty("is_active")
    private Boolean isActive;
}
