package com.smartpc.modules.ruleengine.dto.request;

import com.smartpc.modules.ruleengine.model.RuleSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleFilterCriteria {
    private String sourceCategory;
    private String targetCategory;
    private RuleSeverity severity;
    private Boolean isActive;
    private String keyword;
}
