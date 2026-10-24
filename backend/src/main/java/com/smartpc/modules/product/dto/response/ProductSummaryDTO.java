package com.smartpc.modules.product.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSummaryDTO {

    @JsonProperty("product_id")
    private String productId;

    private String name;

    private String brand;

    @JsonProperty("category_code")
    private String categoryCode;

    @JsonProperty("category_name")
    private String categoryName;

    @JsonProperty("image_url")
    private String imageUrl;

    private Integer price;

    @JsonProperty("in_stock")
    private Boolean inStock;

    @JsonProperty("benchmark_score")
    private Double benchmarkScore;

    @JsonProperty("key_specs")
    @Builder.Default
    private Map<String, Object> keySpecs = new LinkedHashMap<>();
}
