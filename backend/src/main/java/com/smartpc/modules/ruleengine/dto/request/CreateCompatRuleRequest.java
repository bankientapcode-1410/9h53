package com.smartpc.modules.ruleengine.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCompatRuleRequest {

    @NotBlank(message = "Tên quy tắc không được để trống")
    @Size(max = 255, message = "Tên quy tắc tối đa 255 ký tự")
    @JsonProperty("rule_name")
    private String ruleName;

    @NotBlank(message = "Danh mục nguồn không được để trống")
    @JsonProperty("source_category")
    private String sourceCategory;

    @NotBlank(message = "Danh mục đích không được để trống")
    @JsonProperty("target_category")
    private String targetCategory;

    @NotBlank(message = "Khóa thông số nguồn không được để trống")
    @JsonProperty("source_spec_key")
    private String sourceSpecKey;

    @NotBlank(message = "Khóa thông số đích không được để trống")
    @JsonProperty("target_spec_key")
    private String targetSpecKey;

    @NotNull(message = "Toán tử so sánh không được để trống")
    @JsonProperty("operator")
    private RuleOperator operator;

    @NotNull(message = "Mức độ nghiêm trọng không được để trống")
    @JsonProperty("severity")
    private RuleSeverity severity;

    @NotBlank(message = "Mẫu thông báo lỗi không được để trống")
    @Size(min = 10, max = 500, message = "Mẫu thông báo lỗi phải từ 10 đến 500 ký tự")
    @JsonProperty("error_message_template")
    private String errorMessageTemplate;

    @JsonProperty("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @JsonProperty("priority")
    @Builder.Default
    private Integer priority = 0;
}
