package com.smartpc.modules.ruleengine.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompatRuleDTO {

    @JsonProperty("rule_id")
    private String ruleId;

    @JsonProperty("rule_name")
    private String ruleName;

    @JsonProperty("source_category")
    private String sourceCategory;

    @JsonProperty("target_category")
    private String targetCategory;

    @JsonProperty("source_spec_key")
    private String sourceSpecKey;

    @JsonProperty("target_spec_key")
    private String targetSpecKey;

    @JsonProperty("operator")
    private RuleOperator operator;

    @JsonProperty("severity")
    private RuleSeverity severity;

    @JsonProperty("error_message_template")
    private String errorMessageTemplate;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("priority")
    private Integer priority;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}
