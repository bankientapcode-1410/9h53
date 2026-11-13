package com.smartpc.modules.product.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchRejectedItem {

    @JsonProperty("product_id")
    private String productId;

    private String reason;
}
