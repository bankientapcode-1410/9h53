package com.smartpc.modules.product.service;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.product.dto.request.CreateCategoryRequest;
import com.smartpc.modules.product.dto.request.UpdateCategoryRequest;
import com.smartpc.modules.product.dto.response.CategoryTreeDTO;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.mapper.CategoryMapper;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.validator.CategoryValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryAdminService {

    private final CategoryRepository categoryRepository;
    private final CategoryValidator categoryValidator;
    private final CategoryMapper categoryMapper;

    @Transactional
    @CacheEvict(cacheNames = "category", allEntries = true)
    public CategoryTreeDTO createCategory(CreateCategoryRequest request) {
        categoryValidator.validateCreate(request);

        Category parent = null;
        if (request.getParentCategoryId() != null && !request.getParentCategoryId().isBlank()) {
            parent = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND,
                            "Không tìm thấy danh mục cha"));
        }

        Category category = Category.builder()
                .categoryCode(request.getCategoryCode().trim().toUpperCase())
                .categoryName(request.getCategoryName().trim())
                .description(request.getDescription())
                .parentCategory(parent)
                .build();

        Category saved = categoryRepository.save(category);
        return categoryMapper.toTreeDto(saved);
    }

    @Transactional
    @CacheEvict(cacheNames = "category", allEntries = true)
    public CategoryTreeDTO updateCategory(String categoryId, UpdateCategoryRequest request) {
        Category existing = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND,
                        "Không tìm thấy danh mục với ID: " + categoryId));

        categoryValidator.validateUpdate(existing, request);

        Category parent = null;
        if (request.getParentCategoryId() != null && !request.getParentCategoryId().isBlank()) {
            parent = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND,
                            "Không tìm thấy danh mục cha"));
        }

        existing.setCategoryName(request.getCategoryName().trim());
        existing.setDescription(request.getDescription());
        existing.setParentCategory(parent);

        Category saved = categoryRepository.save(existing);
        return categoryMapper.toTreeDto(saved);
    }

    @Transactional
    @CacheEvict(cacheNames = "category", allEntries = true)
    public void deleteCategory(String categoryId) {
        Category existing = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND,
                        "Không tìm thấy danh mục với ID: " + categoryId));

        categoryValidator.validateDelete(existing);
        categoryRepository.delete(existing);
    }
}
