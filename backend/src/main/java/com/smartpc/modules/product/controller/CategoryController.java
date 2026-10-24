package com.smartpc.modules.product.controller;

import com.smartpc.common.response.ApiResponse;
import com.smartpc.modules.product.dto.response.CategoryTreeDTO;
import com.smartpc.modules.product.dto.response.SpecMetadataDTO;
import com.smartpc.modules.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryTreeDTO>> getCategoryTree() {
        List<CategoryTreeDTO> tree = categoryService.getTree();
        return ApiResponse.success(tree, "Lấy cây danh mục thành công");
    }

    @GetMapping("/{categoryCode}/specs-schema")
    public ApiResponse<SpecMetadataDTO> getCategorySpecsSchema(
            @PathVariable("categoryCode") String categoryCode
    ) {
        SpecMetadataDTO schema = categoryService.getSpecsSchema(categoryCode);
        return ApiResponse.success(schema, "Lấy schema thông số kỹ thuật thành công");
    }
}
