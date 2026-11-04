package com.smartpc.modules.ruleengine.controller;

import com.smartpc.common.response.ApiResponse;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult;
import com.smartpc.modules.ruleengine.dto.request.CompatibilityCheckRequest;
import com.smartpc.modules.ruleengine.dto.request.CompatibilityItemRequest;
import com.smartpc.modules.ruleengine.service.CompatibilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/compatibility")
@RequiredArgsConstructor
public class CompatibilityController {

    private final CompatibilityService compatibilityService;

    @PostMapping("/check")
    public ApiResponse<CompatibilityResult> checkCompatibility(
            @Valid @RequestBody CompatibilityCheckRequest request
    ) {
        if (request == null) {
            return ApiResponse.success(CompatibilityResult.builder().isCompatible(true).build());
        }

        Map<String, Integer> productQuantities = new LinkedHashMap<>();

        // Handle simple product_ids list
        if (request.getProductIds() != null) {
            for (String pid : request.getProductIds()) {
                if (pid != null && !pid.isBlank()) {
                    String cleanId = pid.trim();
                    long current = productQuantities.getOrDefault(cleanId, 0);
                    long updated = Math.min((long) CompatibilityService.MAX_QUANTITY_PER_PRODUCT + 1, current + 1);
                    productQuantities.put(cleanId, (int) updated);
                }
            }
        }

        // Handle items list with explicit quantity
        if (request.getItems() != null) {
            for (CompatibilityItemRequest item : request.getItems()) {
                if (item != null && item.getProductId() != null && !item.getProductId().isBlank()) {
                    String cleanId = item.getProductId().trim();
                    int qty = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;
                    long current = productQuantities.getOrDefault(cleanId, 0);
                    long updated = Math.min((long) CompatibilityService.MAX_QUANTITY_PER_PRODUCT + 1, current + qty);
                    productQuantities.put(cleanId, (int) updated);
                }
            }
        }

        CompatibilityResult result = compatibilityService.checkCompatibilityWithQuantities(productQuantities);
        return ApiResponse.success(result, "Kiểm tra tương thích thành công");
    }
}
