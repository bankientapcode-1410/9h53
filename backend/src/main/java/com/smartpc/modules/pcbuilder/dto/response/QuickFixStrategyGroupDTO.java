package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Nhóm gợi ý thay thế theo một khe linh kiện cụ thể (VD: đổi Mainboard hoặc đổi CPU).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickFixStrategyGroupDTO {

    @JsonProperty("replace_slot")
    private String replaceSlot;

    @JsonProperty("current_product_id")
    private String currentProductId;

    @JsonProperty("current_product_name")
    private String currentProductName;

    @JsonProperty("strategy_label")
    private String strategyLabel;

    @Builder.Default
    private List<QuickFixOptionDTO> options = new ArrayList<>();
}
