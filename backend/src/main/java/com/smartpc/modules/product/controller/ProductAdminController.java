package com.smartpc.modules.product.controller;

import com.smartpc.common.response.ApiResponse;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.product.dto.request.*;
import com.smartpc.modules.product.dto.response.AdminProductDTO;
import com.smartpc.modules.product.dto.response.BatchSyncAcceptedDTO;
import com.smartpc.modules.product.dto.response.VectorSyncResultDTO;
import com.smartpc.modules.product.entity.ProductSyncStatus;
import com.smartpc.modules.product.service.ProductAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class ProductAdminController {

    private final ProductAdminService productAdminService;

    @GetMapping
    public ApiResponse<PageResponse<AdminProductDTO>> getAdminProducts(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "brand", required = false) List<String> brand,
            @RequestParam(value = "min_price", required = false) Integer minPrice,
            @RequestParam(value = "max_price", required = false) Integer maxPrice,
            @RequestParam(value = "is_active", required = false) Boolean isActive,
            @RequestParam(value = "include_deleted", required = false, defaultValue = "false") Boolean includeDeleted,
            @RequestParam(value = "sync_status", required = false) ProductSyncStatus syncStatus,
            @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(value = "size", required = false, defaultValue = "20") Integer size
    ) {
        List<String> normalizedBrands = new ArrayList<>();
        if (brand != null) {
            for (String b : brand) {
                if (b != null) {
                    for (String part : b.split(",")) {
                        String trimPart = part.trim();
                        if (!trimPart.isBlank()) {
                            normalizedBrands.add(trimPart);
                        }
                    }
                }
            }
        }

        ProductFilterCriteria criteria = ProductFilterCriteria.builder()
                .category(category)
                .brand(normalizedBrands)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .isActive(isActive)
                .includeDeleted(includeDeleted)
                .syncStatus(syncStatus)
                .page(page)
                .size(size)
                .build();

        PageResponse<AdminProductDTO> res = productAdminService.getAdminProducts(
                criteria, PageRequest.of(page, size));

        return ApiResponse.success(res, "Lấy danh sách quản trị sản phẩm thành công");
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminProductDTO>> createProduct(
            @Valid @RequestBody CreateProductRequest request
    ) {
        AdminProductDTO product = productAdminService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.created(product, "Thêm sản phẩm thành công. Đang đồng bộ Vector AI ngầm.")
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminProductDTO> updateProduct(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        AdminProductDTO product = productAdminService.updateProduct(id, request);
        return ApiResponse.success(product, "Cập nhật sản phẩm thành công");
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Void> updateProductStatus(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateProductStatusRequest request
    ) {
        productAdminService.updateStatus(id, request.getIsActive());
        return ApiResponse.success(null, "Cập nhật trạng thái sản phẩm thành công");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") String id) {
        productAdminService.softDeleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sync-vector")
    public ApiResponse<VectorSyncResultDTO> retryVectorSync(@PathVariable("id") String id) {
        VectorSyncResultDTO result = productAdminService.triggerManualSync(id);
        return ApiResponse.success(result, "Đã hoàn thành đồng bộ Vector Embedding");
    }

    @PostMapping("/batch-sync-vectors")
    public ResponseEntity<ApiResponse<BatchSyncAcceptedDTO>> batchRetryVectorSync(
            @Valid @RequestBody BatchResyncRequest request
    ) {
        BatchSyncAcceptedDTO result = productAdminService.triggerBatchSync(request.getProductIds());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(
                ApiResponse.builder()
                        .success(true)
                        .statusCode(HttpStatus.ACCEPTED.value())
                        .message("Đã tiếp nhận yêu cầu đồng bộ lại " + result.getAccepted() + " sản phẩm")
                        .data(result)
                        .timestamp(java.time.LocalDateTime.now())
                        .build()
        );
    }
}
