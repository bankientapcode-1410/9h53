package com.smartpc.modules.pcbuilder.controller;

import com.smartpc.common.response.ApiResponse;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.pcbuilder.dto.request.AddBuildToCartRequest;
import com.smartpc.modules.pcbuilder.dto.request.BuildItemInput;
import com.smartpc.modules.pcbuilder.dto.request.PCBuilderEvaluateRequest;
import com.smartpc.modules.pcbuilder.dto.request.QuickFixRequest;
import com.smartpc.modules.pcbuilder.dto.request.ResolveBuildRequest;
import com.smartpc.modules.pcbuilder.dto.request.SlotCandidateSearchRequest;
import com.smartpc.modules.pcbuilder.dto.response.AddBuildToCartResponseDTO;
import com.smartpc.modules.pcbuilder.dto.response.CandidateProductDTO;
import com.smartpc.modules.pcbuilder.dto.response.PCBuilderEvaluateResponse;
import com.smartpc.modules.pcbuilder.dto.response.QuickFixResponse;
import com.smartpc.modules.pcbuilder.dto.response.ResolveBuildResponseDTO;
import com.smartpc.modules.pcbuilder.service.PCBuilderCandidateService;
import com.smartpc.modules.pcbuilder.service.PCBuilderCartService;
import com.smartpc.modules.pcbuilder.service.PCBuilderEvaluationService;
import com.smartpc.modules.pcbuilder.service.PCBuilderQuickFixService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

/**
 * REST Controller cho phân hệ PC Builder & Kiểm tra tương thích real-time (UC2).
 */
@RestController
@RequestMapping("/api/v1/pc-builder")
@RequiredArgsConstructor
public class PCBuilderController {

    private final PCBuilderEvaluationService evaluationService;
    private final PCBuilderCandidateService candidateService;
    private final PCBuilderQuickFixService quickFixService;
    private final PCBuilderCartService cartService;

    /**
     * WBS 7.5.1: Lọc danh sách linh kiện ứng viên theo slot kèm tìm kiếm, thông số và phân trang.
     */
    @PostMapping("/slots/{categoryCode}/candidates")
    public ResponseEntity<ApiResponse<PageResponse<CandidateProductDTO>>> searchSlotCandidates(
            @PathVariable("categoryCode") String categoryCode,
            @RequestBody(required = false) SlotCandidateSearchRequest request
    ) {
        PageResponse<CandidateProductDTO> response = candidateService.findCandidates(categoryCode, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách linh kiện ứng viên thành công"));
    }

    /**
     * WBS 7.5.2: Đánh giá tương thích phần cứng, tính Telemetry & trạng thái Gatekeeper real-time.
     */
    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<PCBuilderEvaluateResponse>> evaluateBuild(
            @Valid @RequestBody(required = false) PCBuilderEvaluateRequest request
    ) {
        List<BuildItemInput> items = (request != null && request.getItems() != null)
                ? request.getItems()
                : Collections.emptyList();
        PCBuilderEvaluateResponse response = evaluationService.evaluateBuild(items);
        return ResponseEntity.ok(ApiResponse.success(response, "Đánh giá cấu hình PC thành công"));
    }

    /**
     * WBS 7.5.5: Mô phỏng Rule Engine gợi ý linh kiện thay thế xóa xung đột tương thích (Quick Fix).
     */
    @PostMapping("/quick-fix")
    public ResponseEntity<ApiResponse<QuickFixResponse>> quickFix(
            @Valid @RequestBody QuickFixRequest request
    ) {
        QuickFixResponse response = quickFixService.suggestFixes(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tạo gợi ý thay thế linh kiện thành công"));
    }

    /**
     * WBS 7.5.6: Xác thực Gatekeeper lần cuối và đẩy trọn bộ cấu hình PC Builder vào giỏ hàng.
     */
    @PostMapping("/add-to-cart")
    public ResponseEntity<ApiResponse<AddBuildToCartResponseDTO>> addBuildToCart(
            @Valid @RequestBody(required = false) AddBuildToCartRequest request,
            Authentication authentication
    ) {
        String userId = resolveAuthenticatedUserId(authentication);
        AddBuildToCartResponseDTO response = cartService.addBuildToCart(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã xác thực và thêm cấu hình PC vào giỏ hàng"));
    }

    /**
     * WBS 7.5.6: Khôi phục danh sách linh kiện và kết quả đánh giá tương thích từ liên kết chia sẻ (?items=...).
     */
    @PostMapping("/resolve")
    public ResponseEntity<ApiResponse<ResolveBuildResponseDTO>> resolveShareBuild(
            @Valid @RequestBody(required = false) ResolveBuildRequest request
    ) {
        ResolveBuildResponseDTO response = cartService.resolveShareBuild(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Khôi phục cấu hình PC chia sẻ thành công"));
    }

    private String resolveAuthenticatedUserId(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        String principalName = authentication.getName();
        if (principalName == null || principalName.isBlank() || "anonymousUser".equalsIgnoreCase(principalName)) {
            return null;
        }
        return principalName;
    }
}
