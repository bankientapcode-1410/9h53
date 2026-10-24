package com.smartpc.modules.product.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.product.entity.ProductSyncStatus;
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
public class AdminProductDTO {

    @JsonProperty("product_id")
    private String productId;

    private String name;

    private String brand;

    private CategorySummaryDTO category;

    private String description;

    private Integer price;

    @JsonProperty("stock_quantity")
    private Integer stockQuantity;

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

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("sync_status")
    private ProductSyncStatus syncStatus;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonProperty("sync_requested_at")
    private LocalDateTime syncRequestedAt;

    private Long version;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonProperty("deleted_at")
    private LocalDateTime deletedAt;
}
