package com.smartpc.modules.product.mapper;

import com.smartpc.modules.product.dto.response.*;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.schema.FieldDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final CategorySpecSchemaRegistry schemaRegistry;

    public ProductSummaryDTO toSummaryDto(Product product) {
        if (product == null) {
            return null;
        }

        String categoryCode = product.getCategory() != null ? product.getCategory().getCategoryCode() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getCategoryName() : null;
        boolean inStock = product.getStockQuantity() != null && product.getStockQuantity() > 0;

        Map<String, Object> keySpecs = extractKeySpecs(categoryCode, product.getSpecs());

        return ProductSummaryDTO.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .brand(product.getBrand())
                .categoryCode(categoryCode)
                .categoryName(categoryName)
                .imageUrl(product.getImageUrl())
                .price(product.getPrice())
                .inStock(inStock)
                .benchmarkScore(product.getBenchmarkScore())
                .keySpecs(keySpecs)
                .build();
    }

    public ProductDetailDTO toDetailDto(Product product) {
        if (product == null) {
            return null;
        }

        Category category = product.getCategory();
        CategorySummaryDTO categorySummary = null;
        String categoryCode = null;
        if (category != null) {
            categoryCode = category.getCategoryCode();
            categorySummary = CategorySummaryDTO.builder()
                    .categoryId(category.getCategoryId())
                    .categoryCode(category.getCategoryCode())
                    .categoryName(category.getCategoryName())
                    .build();
        }

        boolean inStock = product.getStockQuantity() != null && product.getStockQuantity() > 0;
        Map<String, SpecFieldLabelDTO> specLabels = extractSpecLabels(categoryCode);

        return ProductDetailDTO.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .brand(product.getBrand())
                .category(categorySummary)
                .description(product.getDescription())
                .price(product.getPrice())
                .inStock(inStock)
                .benchmarkScore(product.getBenchmarkScore())
                .imageUrl(product.getImageUrl())
                .galleryUrls(product.getGalleryUrls() != null ? product.getGalleryUrls() : new ArrayList<>())
                .specs(product.getSpecs() != null ? product.getSpecs() : new LinkedHashMap<>())
                .specLabels(specLabels)
                .createdAt(product.getCreatedAt())
                .build();
    }

    public AdminProductDTO toAdminDto(Product product) {
        if (product == null) {
            return null;
        }

        Category category = product.getCategory();
        CategorySummaryDTO categorySummary = null;
        if (category != null) {
            categorySummary = CategorySummaryDTO.builder()
                    .categoryId(category.getCategoryId())
                    .categoryCode(category.getCategoryCode())
                    .categoryName(category.getCategoryName())
                    .build();
        }

        boolean inStock = product.getStockQuantity() != null && product.getStockQuantity() > 0;

        return AdminProductDTO.builder()
                .productId(product.getProductId())
                .name(product.getName())
                .brand(product.getBrand())
                .category(categorySummary)
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .inStock(inStock)
                .benchmarkScore(product.getBenchmarkScore())
                .imageUrl(product.getImageUrl())
                .galleryUrls(product.getGalleryUrls() != null ? product.getGalleryUrls() : new ArrayList<>())
                .specs(product.getSpecs() != null ? product.getSpecs() : new LinkedHashMap<>())
                .isActive(product.getIsActive())
                .syncStatus(product.getSyncStatus())
                .syncRequestedAt(product.getSyncRequestedAt())
                .version(product.getVersion())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .deletedAt(product.getDeletedAt())
                .build();
    }

    private Map<String, Object> extractKeySpecs(String categoryCode, Map<String, Object> specs) {
        if (specs == null || specs.isEmpty() || categoryCode == null) {
            return Collections.emptyMap();
        }

        Set<String> filterableKeys = schemaRegistry.getFilterableKeys(categoryCode);
        Map<String, Object> keySpecs = new LinkedHashMap<>();
        for (String key : filterableKeys) {
            if (specs.containsKey(key) && keySpecs.size() < 4) {
                keySpecs.put(key, specs.get(key));
            }
        }

        if (keySpecs.size() < 4) {
            for (FieldDefinition def : schemaRegistry.getSchema(categoryCode)) {
                String key = def.getKey();
                if (!keySpecs.containsKey(key) && specs.containsKey(key)) {
                    keySpecs.put(key, specs.get(key));
                    if (keySpecs.size() >= 4) {
                        break;
                    }
                }
            }
        }

        return keySpecs;
    }

    private Map<String, SpecFieldLabelDTO> extractSpecLabels(String categoryCode) {
        if (categoryCode == null) {
            return Collections.emptyMap();
        }

        Map<String, FieldDefinition> defs = schemaRegistry.getSchemaAsMap(categoryCode);
        Map<String, SpecFieldLabelDTO> labels = new LinkedHashMap<>();
        defs.forEach((key, def) -> labels.put(key, SpecFieldLabelDTO.builder()
                .label(def.getLabel())
                .unit(def.getUnit())
                .build()));
        return labels;
    }
}
