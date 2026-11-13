package com.smartpc.modules.ruleengine.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRuleStatusRequest {

    @NotNull(message = "Trạng thái is_active không được để trống")
    @JsonProperty("is_active")
    private Boolean isActive;
}
