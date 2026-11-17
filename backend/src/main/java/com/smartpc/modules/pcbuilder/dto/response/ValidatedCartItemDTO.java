package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thông tin từng linh kiện trong cấu hình đã được máy chủ xác thực giá và tồn kho (WBS 7.5.6).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidatedCartItemDTO {

    @JsonProperty("product_id")
    private String productId;

    @JsonProperty("slot_code")
    private String slotCode;

    private String name;

    @JsonProperty("category_code")
    private String categoryCode;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("unit_price")
    private long unitPrice;

    private int quantity;

    @JsonProperty("line_total")
    private long lineTotal;

    @JsonProperty("available_stock")
    private int availableStock;
}
