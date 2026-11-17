package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.pcbuilder.model.SlotStatusLevel;
import com.smartpc.modules.product.dto.response.ProductSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO sản phẩm ứng viên trong modal chọn linh kiện PC Builder kèm trạng thái tương thích (WBS 7.5.1 / 7.5.5).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProductDTO {

    private ProductSummaryDTO product;

    @JsonProperty("compat_status")
    @Builder.Default
    private SlotStatusLevel compatStatus = SlotStatusLevel.COMPATIBLE;

    @JsonProperty("compat_summary")
    @Builder.Default
    private String compatSummary = "Tương thích với cấu hình hiện tại";

    @JsonProperty("blocking_errors")
    @Builder.Default
    private List<String> blockingErrors = new ArrayList<>();

    @Builder.Default
    private List<String> warnings = new ArrayList<>();
}
