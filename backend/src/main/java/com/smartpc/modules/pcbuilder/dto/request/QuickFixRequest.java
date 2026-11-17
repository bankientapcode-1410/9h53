package com.smartpc.modules.pcbuilder.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request body cho API mô phỏng gợi ý linh kiện thay thế tương thích (WBS 7.5.5).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickFixRequest {

    @NotEmpty(message = "Danh sách linh kiện hiện tại (current_items) không được để trống")
    @JsonProperty("current_items")
    @Builder.Default
    private List<BuildItemInput> currentItems = new ArrayList<>();

    @NotBlank(message = "Mã quy tắc vi phạm (violation_rule_id) không được để trống")
    @JsonProperty("violation_rule_id")
    private String violationRuleId;

    @JsonProperty("source_product_id")
    private String sourceProductId;

    @JsonProperty("target_product_id")
    private String targetProductId;

    @JsonProperty("preferred_replace_slot")
    private String preferredReplaceSlot;

    @JsonProperty("limit_per_strategy")
    @Builder.Default
    private Integer limitPerStrategy = 3;
}
