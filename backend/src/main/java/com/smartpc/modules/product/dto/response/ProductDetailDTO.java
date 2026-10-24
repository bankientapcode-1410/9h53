package com.smartpc.modules.product.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailDTO {

    @JsonProperty("product_id")
    private String productId;

    private String name;

    private String brand;

    private CategorySummaryDTO category;

    private String description;

    private Integer price;

    @JsonProperty("in_stock")
    private Boolean inStock;

    @JsonProperty("benchmark_score")
    private Double benchmarkScore;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("gallery_urls")
    @Builder.Default
    private List<String> galleryUrls = new ArrayList<>();

    @Builder.Default
    private Map<String, Object> specs = new LinkedHashMap<>();

    @JsonProperty("spec_labels")
    @Builder.Default
    private Map<String, SpecFieldLabelDTO> specLabels = new LinkedHashMap<>();

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
