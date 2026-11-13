package com.smartpc.modules.product.controller;

import com.smartpc.common.response.ApiResponse;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.product.dto.request.ProductFilterCriteria;
import com.smartpc.modules.product.dto.response.FacetFilterGroupDTO;
import com.smartpc.modules.product.dto.response.ProductDetailDTO;
import com.smartpc.modules.product.dto.response.ProductSummaryDTO;
import com.smartpc.modules.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductSummaryDTO>> getProducts(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "brand", required = false) List<String> brand,
            @RequestParam(value = "min_price", required = false) Integer minPrice,
            @RequestParam(value = "max_price", required = false) Integer maxPrice,
            @RequestParam(value = "sort", required = false, defaultValue = "newest") String sort,
            @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(value = "size", required = false, defaultValue = "12") Integer size,
            @RequestParam Map<String, String> allParams
    ) {
        Map<String, String> specs = new LinkedHashMap<>();
        allParams.forEach((k, v) -> {
            if (k.startsWith("specs[") && k.endsWith("]")) {
                String specKey = k.substring(6, k.length() - 1);
                specs.put(specKey, v);
            }
        });

        // If brand was passed as comma-separated in a single string, e.g. "ASUS,MSI"
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
                .specs(specs)
                .sort(sort)
                .page(page)
                .size(size)
                .isActive(true)
                .includeDeleted(false)
                .build();

        PageResponse<ProductSummaryDTO> pageResponse = productService.getFilteredProducts(
                criteria, PageRequest.of(page, size));

        return ApiResponse.success(pageResponse, "Lấy danh sách sản phẩm thành công");
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductDetailDTO> getProductById(@PathVariable("id") String id) {
        ProductDetailDTO detail = productService.getProductDetails(id);
        return ApiResponse.success(detail, "Thành công");
    }

    @GetMapping("/facets")
    public ApiResponse<List<FacetFilterGroupDTO>> getFacets(
            @RequestParam("category") String categoryCode
    ) {
        List<FacetFilterGroupDTO> facets = productService.getFilterFacets(categoryCode);
        return ApiResponse.success(facets, "Lấy danh sách facets thành công");
    }
}
