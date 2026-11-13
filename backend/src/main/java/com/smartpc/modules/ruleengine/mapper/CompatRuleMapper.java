package com.smartpc.modules.ruleengine.mapper;

import com.smartpc.modules.ruleengine.dto.request.CreateCompatRuleRequest;
import com.smartpc.modules.ruleengine.dto.request.UpdateCompatRuleRequest;
import com.smartpc.modules.ruleengine.dto.response.CompatRuleDTO;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class CompatRuleMapper {

    public CompatRuleDTO toDTO(CompatRule entity) {
        if (entity == null) return null;
        return CompatRuleDTO.builder()
                .ruleId(entity.getRuleId())
                .ruleName(entity.getRuleName())
                .sourceCategory(entity.getSourceCategory())
                .targetCategory(entity.getTargetCategory())
                .sourceSpecKey(entity.getSourceSpecKey())
                .targetSpecKey(entity.getTargetSpecKey())
                .operator(entity.getOperator())
                .severity(entity.getSeverity())
                .errorMessageTemplate(entity.getErrorMessageTemplate())
                .isActive(entity.getIsActive())
                .priority(entity.getPriority())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<CompatRuleDTO> toDTOList(List<CompatRule> entities) {
        if (entities == null) return Collections.emptyList();
        List<CompatRuleDTO> dtos = new ArrayList<>();
        for (CompatRule entity : entities) {
            dtos.add(toDTO(entity));
        }
        return dtos;
    }

    public CompatRule toEntity(CreateCompatRuleRequest request) {
        if (request == null) return null;
        return CompatRule.builder()
                .ruleName(request.getRuleName().trim())
                .sourceCategory(request.getSourceCategory().trim().toUpperCase())
                .targetCategory(request.getTargetCategory().trim().toUpperCase())
                .sourceSpecKey(request.getSourceSpecKey().trim().toLowerCase())
                .targetSpecKey(request.getTargetSpecKey().trim().toLowerCase())
                .operator(request.getOperator())
                .severity(request.getSeverity())
                .errorMessageTemplate(request.getErrorMessageTemplate().trim())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .build();
    }

    public void updateEntity(CompatRule entity, UpdateCompatRuleRequest request) {
        if (entity == null || request == null) return;
        entity.setRuleName(request.getRuleName().trim());
        entity.setSourceCategory(request.getSourceCategory().trim().toUpperCase());
        entity.setTargetCategory(request.getTargetCategory().trim().toUpperCase());
        entity.setSourceSpecKey(request.getSourceSpecKey().trim().toLowerCase());
        entity.setTargetSpecKey(request.getTargetSpecKey().trim().toLowerCase());
        entity.setOperator(request.getOperator());
        entity.setSeverity(request.getSeverity());
        entity.setErrorMessageTemplate(request.getErrorMessageTemplate().trim());
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        if (request.getPriority() != null) {
            entity.setPriority(request.getPriority());
        }
    }
}
