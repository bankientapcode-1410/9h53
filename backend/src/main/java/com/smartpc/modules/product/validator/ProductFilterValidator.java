package com.smartpc.modules.product.validator;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.FieldErrorDTO;
import com.smartpc.modules.product.dto.request.ProductFilterCriteria;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.schema.FieldDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class ProductFilterValidator {

    private static final Set<String> ALLOWED_SORTS = Set.of(
            "newest",
            "price_asc",
            "price_desc",
            "benchmark_desc"
    );

    private final CategorySpecSchemaRegistry schemaRegistry;

    public void validate(ProductFilterCriteria criteria) {
        if (criteria == null) {
            return;
        }

        List<FieldErrorDTO> errors = new ArrayList<>();

        // F1: category is required when specs filter is present
        boolean hasSpecs = criteria.getSpecs() != null && !criteria.getSpecs().isEmpty();
        String category = criteria.getCategory();

        if (hasSpecs && (category == null || category.isBlank())) {
            errors.add(new FieldErrorDTO("category", "Danh mục (category) là bắt buộc khi sử dụng bộ lọc thông số specs."));
        }

        // F2 & F3: Whitelist filterable keys and type check
        if (category != null && !category.isBlank() && hasSpecs) {
            Set<String> filterableKeys = schemaRegistry.getFilterableKeys(category);
            Map<String, FieldDefinition> defMap = schemaRegistry.getSchemaAsMap(category);

            for (Map.Entry<String, String> entry : criteria.getSpecs().entrySet()) {
                String specKey = entry.getKey();
                String specVal = entry.getValue();

                if (!filterableKeys.contains(specKey)) {
                    errors.add(new FieldErrorDTO("specs." + specKey,
                            "Thuộc tính '" + specKey + "' không được hỗ trợ lọc cho danh mục " + category + "."));
                    continue;
                }

                // F3: Validate type for each comma-separated value
                FieldDefinition def = defMap.get(specKey);
                if (def != null && specVal != null && !specVal.isBlank()) {
                    String[] values = specVal.split(",");
                    for (String v : values) {
                        String trimVal = v.trim();
                        if (trimVal.isBlank()) continue;
                        switch (def.getType()) {
                            case INTEGER -> {
                                try {
                                    Long.parseLong(trimVal);
                                } catch (NumberFormatException e) {
                                    errors.add(new FieldErrorDTO("specs." + specKey,
                                            "Giá trị '" + trimVal + "' của thuộc tính '" + specKey + "' phải là số nguyên."));
                                }
                            }
                            case NUMBER -> {
                                try {
                                    Double.parseDouble(trimVal);
                                } catch (NumberFormatException e) {
                                    errors.add(new FieldErrorDTO("specs." + specKey,
                                            "Giá trị '" + trimVal + "' của thuộc tính '" + specKey + "' phải là số."));
                                }
                            }
                            case BOOLEAN -> {
                                if (!"true".equalsIgnoreCase(trimVal) && !"false".equalsIgnoreCase(trimVal)) {
                                    errors.add(new FieldErrorDTO("specs." + specKey,
                                            "Giá trị '" + trimVal + "' của thuộc tính '" + specKey + "' phải là boolean (true/false)."));
                                }
                            }
                            default -> {}
                        }
                    }
                }
            }
        }

        // F4: 0 <= min_price <= max_price
        Integer minPrice = criteria.getMinPrice();
        Integer maxPrice = criteria.getMaxPrice();
        if (minPrice != null && minPrice < 0) {
            errors.add(new FieldErrorDTO("min_price", "min_price không được nhỏ hơn 0."));
        }
        if (maxPrice != null && maxPrice < 0) {
            errors.add(new FieldErrorDTO("max_price", "max_price không được nhỏ hơn 0."));
        }
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            errors.add(new FieldErrorDTO("min_price", "min_price không được lớn hơn max_price."));
        }

        // F5: sort in whitelist
        String sort = criteria.getSort();
        if (sort != null && !sort.isBlank() && !ALLOWED_SORTS.contains(sort.trim().toLowerCase())) {
            errors.add(new FieldErrorDTO("sort", "Tiêu chí sắp xếp không hợp lệ: " + sort + ". Chỉ chấp nhận: " + String.join(", ", ALLOWED_SORTS)));
        }

        // F6: page >= 0, size in [1, 48], brand max 10
        if (criteria.getPage() != null && criteria.getPage() < 0) {
            errors.add(new FieldErrorDTO("page", "Số trang (page) không được nhỏ hơn 0."));
        }
        if (criteria.getSize() != null && (criteria.getSize() < 1 || criteria.getSize() > 48)) {
            errors.add(new FieldErrorDTO("size", "Kích thước trang (size) phải nằm trong khoảng [1, 48]."));
        }
        if (criteria.getBrand() != null && criteria.getBrand().size() > 10) {
            errors.add(new FieldErrorDTO("brand", "Danh sách thương hiệu (brand) không được vượt quá 10 giá trị."));
        }

        if (!errors.isEmpty()) {
            throw new BusinessException(ErrorCode.PROD_INVALID_FILTER, "Tham số lọc không hợp lệ", errors);
        }
    }
}
