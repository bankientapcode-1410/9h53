package com.smartpc.modules.product.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.product.entity.ProductSyncStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VectorSyncResultDTO {

    @JsonProperty("product_id")
    private String productId;

    @JsonProperty("sync_status")
    private ProductSyncStatus syncStatus;

    @JsonProperty("embedding_model")
    private String embeddingModel;

    @JsonProperty("vector_dimensions")
    private Integer vectorDimensions;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonProperty("synced_at")
    private LocalDateTime syncedAt;
}
