package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thông tin sản phẩm gặp vấn đề tồn kho trong cấu hình PC Builder.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockIssueDTO {

    @JsonProperty("product_id")
    private String productId;

    private String name;

    @JsonProperty("slot_code")
    private String slotCode;

    @JsonProperty("requested_quantity")
    private int requestedQuantity;

    @JsonProperty("available_stock")
    private int availableStock;

    private String reason;
}
