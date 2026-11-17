package com.smartpc.modules.pcbuilder.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Mục linh kiện đầu vào dùng chung cho các endpoint PC Builder (evaluate, candidates, quick-fix, add-to-cart).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildItemInput {

    @JsonProperty("product_id")
    private String productId;

    @Builder.Default
    @JsonProperty("quantity")
    private Integer quantity = 1;

    @JsonProperty("slot_code")
    private String slotCode;
}
