package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Chỉ số đo lường tổng hợp của cấu hình PC (Giá, TDP, PSU khuyến nghị, độ cân bằng).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildTelemetryDTO {

    @JsonProperty("total_price")
    private long totalPrice;

    @JsonProperty("estimated_tdp_w")
    private double estimatedTdpW;

    @JsonProperty("recommended_psu_w")
    private int recommendedPsuW;

    @JsonProperty("selected_psu_wattage_w")
    private Integer selectedPsuWattageW;

    @JsonProperty("psu_load_percent")
    private Double psuLoadPercent;

    @JsonProperty("balance_index")
    private Integer balanceIndex;

    @JsonProperty("balance_label")
    private String balanceLabel;

    @JsonProperty("selected_core_slots")
    private int selectedCoreSlots;

    @JsonProperty("total_core_slots")
    private int totalCoreSlots;

    @JsonProperty("evaluation_time_ms")
    private double evaluationTimeMs;
}
