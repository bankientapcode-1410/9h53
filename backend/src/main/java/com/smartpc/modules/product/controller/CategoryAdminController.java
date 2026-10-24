package com.smartpc.modules.product.controller;

import com.smartpc.common.response.ApiResponse;
import com.smartpc.modules.product.dto.request.CreateCategoryRequest;
import com.smartpc.modules.product.dto.request.UpdateCategoryRequest;
import com.smartpc.modules.product.dto.response.CategoryTreeDTO;
import com.smartpc.modules.product.service.CategoryAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class CategoryAdminController {

    private final CategoryAdminService categoryAdminService;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryTreeDTO>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        CategoryTreeDTO treeDTO = categoryAdminService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.created(treeDTO, "Tạo danh mục thành công")
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryTreeDTO> updateCategory(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        CategoryTreeDTO treeDTO = categoryAdminService.updateCategory(id, request);
        return ApiResponse.success(treeDTO, "Cập nhật danh mục thành công");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable("id") String id) {
        categoryAdminService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
