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
        if (criteria.getIsActive() == null) {
            criteria.setIsActive(true);
        }
        if (criteria.getIncludeDeleted() == null) {
            criteria.setIncludeDeleted(false);
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
                .options(buildDynamicPriceOptions(products))
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

    private record PriceBucket(int min, int max, String label, String value, long count) {
    }

    private static final int UNBOUNDED_MAX_PRICE = 999_999_999;

    private static final List<PriceBucket> BASE_PRICE_BUCKETS = List.of(
            new PriceBucket(0, 2_000_000, "Dưới 2 triệu", "0-2000000", 0),
            new PriceBucket(2_000_000, 5_000_000, "2 - 5 triệu", "2000000-5000000", 0),
            new PriceBucket(5_000_000, 10_000_000, "5 - 10 triệu", "5000000-10000000", 0),
            new PriceBucket(10_000_000, 15_000_000, "10 - 15 triệu", "10000000-15000000", 0),
            new PriceBucket(15_000_000, 25_000_000, "15 - 25 triệu", "15000000-25000000", 0),
            new PriceBucket(25_000_000, UNBOUNDED_MAX_PRICE, "Trên 25 triệu", "25000000-999999999", 0)
    );

    /**
     * Build non-empty price range options and promote the outer bounds when lower/upper buckets are empty.
     */
    public static List<FacetOptionDTO> buildDynamicPriceOptions(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return List.of();
        }

        List<PriceBucket> nonEmpty = new ArrayList<>();
        for (PriceBucket bucket : BASE_PRICE_BUCKETS) {
            long count = products.stream()
                    .map(Product::getPrice)
                    .filter(p -> p != null
                            && (bucket.min() == 0 || p >= bucket.min())
                            && (bucket.max() >= UNBOUNDED_MAX_PRICE || p <= bucket.max()))
                    .count();
            if (count > 0) {
                nonEmpty.add(new PriceBucket(bucket.min(), bucket.max(), bucket.label(), bucket.value(), count));
            }
        }

        if (nonEmpty.isEmpty()) {
            return List.of();
        }

        PriceBucket first = nonEmpty.get(0);
        if (first.min() > 0 && first.max() < UNBOUNDED_MAX_PRICE) {
            int maxMillions = first.max() / 1_000_000;
            nonEmpty.set(0, new PriceBucket(
                    0,
                    first.max(),
                    "Dưới " + maxMillions + " triệu",
                    "0-" + first.max(),
                    first.count()
            ));
        }

        if (nonEmpty.size() >= 2) {
            int lastIdx = nonEmpty.size() - 1;
            PriceBucket last = nonEmpty.get(lastIdx);
            if (last.max() < UNBOUNDED_MAX_PRICE && last.min() > 0) {
                int minMillions = last.min() / 1_000_000;
                nonEmpty.set(lastIdx, new PriceBucket(
                        last.min(),
                        UNBOUNDED_MAX_PRICE,
                        "Trên " + minMillions + " triệu",
                        last.min() + "-" + UNBOUNDED_MAX_PRICE,
                        last.count()
                ));
            }
        }

        return nonEmpty.stream()
                .map(b -> FacetOptionDTO.builder()
                        .value(b.value())
                        .label(b.label())
                        .count(b.count())
                        .build())
                .toList();
    }

    private Sort buildSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("productId"));
        }

        return switch (sortParam.trim().toLowerCase()) {
            case "oldest" -> Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("productId"));
            case "price_asc" -> Sort.by(Sort.Order.asc("price"), Sort.Order.asc("productId"));
            case "price_desc" -> Sort.by(Sort.Order.desc("price"), Sort.Order.asc("productId"));
            default -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("productId"));
        };
    }
}
