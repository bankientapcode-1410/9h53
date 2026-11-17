package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.pcbuilder.model.BuilderGateStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Kết quả sau khi Gatekeeper xác thực và chuẩn hóa trọn bộ cấu hình PC vào giỏ hàng (WBS 7.5.6).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddBuildToCartResponseDTO {

    @JsonProperty("cart_persisted")
    private boolean cartPersisted;

    @JsonProperty("cart_id")
    private String cartId;

    @JsonProperty("gate_status")
    private BuilderGateStatus gateStatus;

    @JsonProperty("added_items_count")
    private int addedItemsCount;

    @JsonProperty("subtotal_price")
    private long subtotalPrice;

    @Builder.Default
    private List<ValidatedCartItemDTO> items = new ArrayList<>();
}
