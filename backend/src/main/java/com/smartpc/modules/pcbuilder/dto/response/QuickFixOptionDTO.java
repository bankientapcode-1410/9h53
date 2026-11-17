package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.pcbuilder.model.SlotStatusLevel;
import com.smartpc.modules.product.dto.response.ProductSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Một phương án linh kiện thay thế khả thi giúp xóa bỏ xung đột phần cứng (WBS 7.5.5).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickFixOptionDTO {

    private ProductSummaryDTO product;

    @JsonProperty("price_delta")
    private long priceDelta;

    @JsonProperty("resulting_status")
    private SlotStatusLevel resultingStatus;

    @JsonProperty("remaining_warnings_count")
    private int remainingWarningsCount;

    @JsonProperty("cleared_violation_count")
    private int clearedViolationCount;
}
