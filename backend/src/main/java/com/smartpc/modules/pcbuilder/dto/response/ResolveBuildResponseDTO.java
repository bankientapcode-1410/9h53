package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.product.dto.response.ProductSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Kết quả khôi phục cấu hình PC từ Share URL kèm đánh giá tương thích mới nhất (WBS 7.5.6).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveBuildResponseDTO {

    @Builder.Default
    @JsonProperty("resolved_items")
    private List<ResolvedSlotItemDTO> resolvedItems = new ArrayList<>();

    @Builder.Default
    @JsonProperty("dropped_product_ids")
    private List<String> droppedProductIds = new ArrayList<>();

    private PCBuilderEvaluateResponse evaluation;

    /**
     * Linh kiện đã khôi phục tương ứng với khe cắm trên PC Builder.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolvedSlotItemDTO {

        @JsonProperty("slot_code")
        private String slotCode;

        private int quantity;

        private ProductSummaryDTO product;
    }
}
