package com.smartpc.modules.product.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.product.dto.response.CategoryTreeDTO;
import com.smartpc.modules.product.dto.response.FieldDefinitionDTO;
import com.smartpc.modules.product.dto.response.SpecMetadataDTO;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.mapper.CategoryMapper;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.schema.FieldDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final CategorySpecSchemaRegistry schemaRegistry;

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "category", key = "'tree'")
    public List<CategoryTreeDTO> getTree() {
        List<Category> allCategories = categoryRepository.findAllByOrderByCategoryNameAsc();
        return buildHierarchy(allCategories);
    }

    public List<CategoryTreeDTO> buildHierarchy(List<Category> allCategories) {
        Map<String, CategoryTreeDTO> dtoMap = new LinkedHashMap<>();
        List<CategoryTreeDTO> rootNodes = new ArrayList<>();

        // Step 1: Initialize all DTO nodes
        for (Category cat : allCategories) {
            dtoMap.put(cat.getCategoryId(), categoryMapper.toTreeDto(cat));
        }

        // Step 2: Link parent-child relationships
        for (Category cat : allCategories) {
            CategoryTreeDTO current = dtoMap.get(cat.getCategoryId());
            String parentId = cat.getParentCategoryId();
            CategoryTreeDTO parent = (parentId == null) ? null : dtoMap.get(parentId);

            if (parent == null) {
                rootNodes.add(current);
            } else {
                parent.getChildren().add(current);
            }
        }

        return rootNodes;
    }

    @Transactional(readOnly = true)
    public SpecMetadataDTO getSpecsSchema(String categoryCode) {
        if (categoryCode == null || !schemaRegistry.hasCategory(categoryCode)) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND,
                    "Danh mục không tồn tại hoặc chưa có schema thông số kỹ thuật: " + categoryCode);
        }

        String normalizedCode = categoryCode.trim().toUpperCase();
        Category category = categoryRepository.findByCategoryCode(normalizedCode).orElse(null);
        String categoryName = (category != null) ? category.getCategoryName() : normalizedCode;

        List<FieldDefinition> definitions = schemaRegistry.getSchema(normalizedCode);
        List<FieldDefinitionDTO> fieldDtos = definitions.stream()
                .map(d -> FieldDefinitionDTO.builder()
                        .key(d.getKey())
                        .label(d.getLabel())
                        .type(d.getType())
                        .required(d.isRequired())
                        .filterable(d.isFilterable())
                        .unit(d.getUnit())
                        .minValue(d.getMinValue())
                        .allowedValues(d.getAllowedValues())
                        .build())
                .toList();

        return SpecMetadataDTO.builder()
                .categoryCode(normalizedCode)
                .categoryName(categoryName)
                .hasSchema(true)
                .fields(fieldDtos)
                .build();
    }
}
