package com.smartpc.modules.product.mapper;

import com.smartpc.modules.product.dto.response.CategoryTreeDTO;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class CategoryMapper {

    private final CategorySpecSchemaRegistry schemaRegistry;

    public CategoryTreeDTO toTreeDto(Category category) {
        if (category == null) {
            return null;
        }

        boolean hasSchema = schemaRegistry.hasCategory(category.getCategoryCode());
        String parentId = category.getParentCategoryId();

        return CategoryTreeDTO.builder()
                .categoryId(category.getCategoryId())
                .categoryCode(category.getCategoryCode())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .parentCategoryId(parentId)
                .hasSchema(hasSchema)
                .children(new ArrayList<>())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
