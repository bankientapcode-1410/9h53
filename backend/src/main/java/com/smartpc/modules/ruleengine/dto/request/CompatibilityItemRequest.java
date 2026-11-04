package com.smartpc.modules.ruleengine.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompatibilityItemRequest {

    @NotBlank(message = "Mã sản phẩm không được để trống")
    @JsonProperty("product_id")
    private String productId;

    @Min(value = 1, message = "Số lượng linh kiện tối thiểu là 1")
    @Max(value = 16, message = "Số lượng linh kiện tối đa là 16")
    @Builder.Default
    @JsonProperty("quantity")
    private Integer quantity = 1;
}
