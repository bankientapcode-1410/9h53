package com.smartpc.modules.pcbuilder.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.pcbuilder.model.SlotStatusLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Trạng thái chẩn đoán vi phạm quy tắc tương thích theo từng khe linh kiện.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotDiagnosticDTO {

    @JsonProperty("slot_code")
    private String slotCode;

    private SlotStatusLevel status;

    @JsonProperty("error_count")
    private int errorCount;

    @JsonProperty("warning_count")
    private int warningCount;

    @JsonProperty("info_count")
    private int infoCount;

    @Builder.Default
    @JsonProperty("violation_rule_ids")
    private List<String> violationRuleIds = new ArrayList<>();
}
