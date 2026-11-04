package com.smartpc.modules.ruleengine.controller;

import com.smartpc.common.response.ApiResponse;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.ruleengine.dto.request.*;
import com.smartpc.modules.ruleengine.dto.response.*;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.service.CompatRuleAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/rules")
@RequiredArgsConstructor
public class CompatRuleAdminController {

    private final CompatRuleAdminService ruleAdminService;

    @GetMapping
    public ApiResponse<PageResponse<CompatRuleDTO>> getAllRules(
            @RequestParam(value = "source_category", required = false) String sourceCategory,
            @RequestParam(value = "target_category", required = false) String targetCategory,
            @RequestParam(value = "severity", required = false) RuleSeverity severity,
            @RequestParam(value = "is_active", required = false) Boolean isActive,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(value = "size", required = false, defaultValue = "20") Integer size
    ) {
        RuleFilterCriteria criteria = RuleFilterCriteria.builder()
                .sourceCategory(sourceCategory)
                .targetCategory(targetCategory)
                .severity(severity)
                .isActive(isActive)
                .keyword(keyword)
                .build();

        int safePage = Math.max(0, page != null ? page : 0);
        int safeSize = Math.min(100, Math.max(1, size != null ? size : 20));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "priority").and(Sort.by(Sort.Direction.ASC, "createdAt")));
        return ApiResponse.success(ruleAdminService.getRules(criteria, pageable));
    }

    @GetMapping("/metadata")
    public ApiResponse<RuleSchemaMetadataDTO> getMetadataSchema() {
        return ApiResponse.success(ruleAdminService.getMetadataSchema());
    }

    @GetMapping("/{ruleId}")
    public ApiResponse<CompatRuleDTO> getRuleById(@PathVariable("ruleId") String ruleId) {
        return ApiResponse.success(ruleAdminService.getRuleById(ruleId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompatRuleDTO>> createRule(
            @Valid @RequestBody CreateCompatRuleRequest request
    ) {
        CompatRuleDTO dto = ruleAdminService.createRule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(dto, "Tạo quy tắc tương thích thành công"));
    }

    @PutMapping("/{ruleId}")
    public ApiResponse<CompatRuleDTO> updateRule(
            @PathVariable("ruleId") String ruleId,
            @Valid @RequestBody UpdateCompatRuleRequest request
    ) {
        CompatRuleDTO dto = ruleAdminService.updateRule(ruleId, request);
        return ApiResponse.success(dto, "Cập nhật quy tắc tương thích thành công");
    }

    @PatchMapping("/{ruleId}/status")
    public ApiResponse<CompatRuleDTO> updateRuleStatus(
            @PathVariable("ruleId") String ruleId,
            @Valid @RequestBody UpdateRuleStatusRequest request
    ) {
        CompatRuleDTO dto = ruleAdminService.updateRuleStatus(ruleId, request.getIsActive());
        return ApiResponse.success(dto, "Cập nhật trạng thái quy tắc thành công");
    }

    @DeleteMapping("/{ruleId}")
    public ResponseEntity<Void> deleteRule(@PathVariable("ruleId") String ruleId) {
        ruleAdminService.deleteRule(ruleId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/dry-run")
    public ApiResponse<DryRunResultDTO> dryRunRule(
            @Valid @RequestBody DryRunRuleRequest request
    ) {
        return ApiResponse.success(ruleAdminService.dryRun(request), "Chạy thử quy tắc hoàn tất");
    }
}
