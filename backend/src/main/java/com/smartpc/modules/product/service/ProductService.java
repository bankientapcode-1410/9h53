package com.smartpc.modules.product.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.product.cache.ProductListCacheManager;
import com.smartpc.modules.product.dto.request.ProductFilterCriteria;
import com.smartpc.modules.product.dto.response.FacetFilterGroupDTO;
import com.smartpc.modules.product.dto.response.FacetOptionDTO;
import com.smartpc.modules.product.dto.response.ProductDetailDTO;
import com.smartpc.modules.product.dto.response.ProductSummaryDTO;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.mapper.ProductMapper;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.repository.ProductSpecifications;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.schema.FieldDefinition;
import com.smartpc.modules.product.validator.ProductFilterValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductFilterValidator filterValidator;
    private final ProductListCacheManager listCache;
    private final ProductMapper productMapper;
    private final CategorySpecSchemaRegistry schemaRegistry;

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryDTO> getFilteredProducts(ProductFilterCriteria criteria, Pageable pageable) {
        if (criteria == null) {
            criteria = new ProductFilterCriteria();
        }

        // Apply pageable overrides if criteria fields are not explicitly set
        if (pageable != null) {
            if (criteria.getPage() == null || criteria.getPage() == 0) {
                criteria.setPage(pageable.getPageNumber());
            }
            if (criteria.getSize() == null || criteria.getSize() == 12) {
                criteria.setSize(Math.min(pageable.getPageSize(), 48));
            }
        }

        filterValidator.validate(criteria);

        int pageNum = criteria.getPage() != null ? criteria.getPage() : 0;
        int pageSize = criteria.getSize() != null ? criteria.getSize() : 12;

        Sort sort = buildSort(criteria.getSort());
        PageRequest pageRequest = PageRequest.of(pageNum, pageSize, sort);

        // Check cache for page 0
        if (pageNum == 0) {
            Optional<PageResponse<ProductSummaryDTO>> cached = listCache.get(criteria);
            if (cached.isPresent()) {
                return cached.get();
            }
        }

        Page<Product> page = productRepository.findAll(ProductSpecifications.of(criteria), pageRequest);
        PageResponse<ProductSummaryDTO> response = PageResponse.from(page, productMapper::toSummaryDto);

        // Cache page 0
        if (pageNum == 0) {
            listCache.put(criteria, response);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public ProductDetailDTO getProductDetails(String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NOT_FOUND,
                        "Không tìm thấy thông tin sản phẩm"));

        if (product.getDeletedAt() != null || !Boolean.TRUE.equals(product.getIsActive())) {
            throw new BusinessException(ErrorCode.PROD_NOT_FOUND,
                    "Không tìm thấy thông tin sản phẩm hoặc sản phẩm đã ngừng kinh doanh");
        }

        return productMapper.toDetailDto(product);
    }

    @Transactional(readOnly = true)
    public List<FacetFilterGroupDTO> getFilterFacets(String categoryCode) {
        if (categoryCode == null || categoryCode.isBlank()) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND, "category là bắt buộc để lấy thông tin facets");
        }

        String normalizedCode = categoryCode.trim().toUpperCase();
        Category category = categoryRepository.findByCategoryCode(normalizedCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND,
                        "Danh mục '" + categoryCode + "' không tồn tại"));

        ProductFilterCriteria criteria = ProductFilterCriteria.builder()
                .category(normalizedCode)
                .isActive(true)
                .includeDeleted(false)
                .build();

        List<Product> products = productRepository.findAll(ProductSpecifications.of(criteria));
        List<FacetFilterGroupDTO> facetGroups = new ArrayList<>();

        if (products.isEmpty()) {
            return facetGroups;
        }

        // 1. Brand Facets
        Map<String, Long> brandCounts = products.stream()
                .filter(p -> p.getBrand() != null && !p.getBrand().isBlank())
                .collect(Collectors.groupingBy(Product::getBrand, TreeMap::new, Collectors.counting()));

        List<FacetOptionDTO> brandOptions = brandCounts.entrySet().stream()
                .map(e -> FacetOptionDTO.builder().value(e.getKey()).label(e.getKey()).count(e.getValue()).build())
                .toList();

        facetGroups.add(FacetFilterGroupDTO.builder()
                .groupKey("brand")
                .groupLabel("Thương hiệu")
                .options(brandOptions)
                .build());

        // 2. Price Facets
        int minPrice = products.stream().mapToInt(Product::getPrice).min().orElse(0);
        int maxPrice = products.stream().mapToInt(Product::getPrice).max().orElse(0);
        facetGroups.add(FacetFilterGroupDTO.builder()
                .groupKey("price")
                .groupLabel("Khoảng giá")
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .build());

        // 3. Dynamic Spec Facets (for filterable keys in schema)
        Set<String> filterableKeys = schemaRegistry.getFilterableKeys(normalizedCode);
        Map<String, FieldDefinition> defMap = schemaRegistry.getSchemaAsMap(normalizedCode);

        for (String key : filterableKeys) {
            FieldDefinition def = defMap.get(key);
            Map<String, Long> specCounts = new TreeMap<>();

            for (Product p : products) {
                if (p.getSpecs() == null || !p.getSpecs().containsKey(key)) {
                    continue;
                }
                Object val = p.getSpecs().get(key);
                if (val instanceof Collection<?> col) {
                    for (Object item : col) {
                        if (item != null) {
                            String s = item.toString().trim();
                            if (!s.isBlank()) {
                                specCounts.put(s, specCounts.getOrDefault(s, 0L) + 1);
                            }
                        }
                    }
                } else if (val != null) {
                    String s = val.toString().trim();
                    if (!s.isBlank()) {
                        specCounts.put(s, specCounts.getOrDefault(s, 0L) + 1);
                    }
                }
            }

            if (!specCounts.isEmpty()) {
                String unit = (def != null && def.getUnit() != null) ? " " + def.getUnit() : "";
                List<FacetOptionDTO> options = specCounts.entrySet().stream()
                        .map(e -> FacetOptionDTO.builder()
                                .value(e.getKey())
                                .label(e.getKey() + unit)
                                .count(e.getValue())
                                .build())
                        .toList();

                facetGroups.add(FacetFilterGroupDTO.builder()
                        .groupKey(key)
                        .groupLabel(def != null ? def.getLabel() : key)
                        .options(options)
                        .build());
            }
        }

        return facetGroups;
    }

    private Sort buildSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("productId"));
        }

        return switch (sortParam.trim().toLowerCase()) {
            case "price_asc" -> Sort.by(Sort.Order.asc("price"), Sort.Order.asc("productId"));
            case "price_desc" -> Sort.by(Sort.Order.desc("price"), Sort.Order.asc("productId"));
            case "benchmark_desc" -> Sort.by(Sort.Order.desc("benchmarkScore"), Sort.Order.asc("productId"));
            default -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("productId"));
        };
    }
}
