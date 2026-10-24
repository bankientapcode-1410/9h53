package com.smartpc.modules.product.validator;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.product.dto.request.CreateCategoryRequest;
import com.smartpc.modules.product.dto.request.UpdateCategoryRequest;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class CategoryValidator {

    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Z][A-Z0-9_]{1,49}$");

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public void validateCreate(CreateCategoryRequest request) {
        if (request.getCategoryCode() == null || !CODE_PATTERN.matcher(request.getCategoryCode()).matches()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Mã danh mục phải viết hoa, bắt đầu bằng chữ cái, từ 2 đến 50 ký tự (chỉ gồm A-Z, 0-9, _)");
        }

        // C1: Unique category_code
        if (categoryRepository.existsByCategoryCode(request.getCategoryCode())) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_CODE_EXISTS,
                    "Mã danh mục '" + request.getCategoryCode() + "' đã tồn tại trong hệ thống");
        }

        // Parent validation if set
        if (request.getParentCategoryId() != null && !request.getParentCategoryId().isBlank()) {
            validateParent(null, request.getParentCategoryId());
        }
    }

    public void validateUpdate(Category existing, UpdateCategoryRequest request) {
        // C2: Immutable category_code
        if (request.getCategoryCode() != null && !request.getCategoryCode().isBlank()) {
            if (!request.getCategoryCode().equals(existing.getCategoryCode())) {
                throw new BusinessException(ErrorCode.PROD_CATEGORY_CODE_IMMUTABLE,
                        "Mã danh mục là bất biến, không được phép thay đổi từ '" + existing.getCategoryCode() + "' thành '" + request.getCategoryCode() + "'");
            }
        }

        // Parent validation if set
        if (request.getParentCategoryId() != null && !request.getParentCategoryId().isBlank()) {
            validateParent(existing.getCategoryId(), request.getParentCategoryId());
        }
    }

    public void validateParent(String currentCategoryId, String newParentId) {
        if (newParentId == null || newParentId.isBlank()) {
            return;
        }

        // C3: Cannot set parent to self
        if (currentCategoryId != null && currentCategoryId.equals(newParentId)) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_CIRCULAR_REF,
                    "Không thể chọn chính danh mục này làm danh mục cha");
        }

        Category parent = categoryRepository.findById(newParentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_CATEGORY_NOT_FOUND,
                        "Danh mục cha với ID '" + newParentId + "' không tồn tại"));

        // C3: Circular reference check up to 10 steps
        if (currentCategoryId != null) {
            Category currentAncestor = parent;
            Set<String> visited = new HashSet<>();
            int steps = 0;
            while (currentAncestor != null && steps < 10) {
                if (currentCategoryId.equals(currentAncestor.getCategoryId())) {
                    throw new BusinessException(ErrorCode.PROD_CATEGORY_CIRCULAR_REF,
                            "Không thể chọn danh mục này làm cha vì sẽ tạo vòng lặp quan hệ phân cấp");
                }
                if (!visited.add(currentAncestor.getCategoryId())) {
                    break;
                }
                currentAncestor = currentAncestor.getParentCategory();
                steps++;
            }
        }

        // C4: Max depth 2 levels -> parent must be root
        if (parent.getParentCategory() != null) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_INVALID_PARENT,
                    "Cây danh mục tối đa 2 cấp. Danh mục cha phải là danh mục gốc (không có cha)");
        }

        // C4: Parent must not contain products
        long productCount = productRepository.countByCategoryId(newParentId);
        if (productCount > 0) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_INVALID_PARENT,
                    "Danh mục cha '" + parent.getCategoryName() + "' đang chứa " + productCount + " sản phẩm, không thể làm nhóm phân cấp");
        }
    }

    public void validateDelete(Category category) {
        String categoryId = category.getCategoryId();

        // C5: Cannot delete if has subcategories
        long childrenCount = categoryRepository.countByParentCategoryCategoryId(categoryId);
        if (childrenCount > 0) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_HAS_CHILDREN,
                    "Không thể xóa danh mục đang chứa " + childrenCount + " danh mục con");
        }

        // C6: Cannot delete if has products
        long productCount = productRepository.countByCategoryId(categoryId);
        if (productCount > 0) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_HAS_PRODUCTS,
                    "Không thể xóa danh mục đang có " + productCount + " sản phẩm liên kết");
        }

        // C7: Cannot delete if in use by compat_rules
        long ruleCount = productRepository.countCompatRulesByCode(category.getCategoryCode());
        if (ruleCount > 0) {
            throw new BusinessException(ErrorCode.PROD_CATEGORY_IN_USE_BY_RULES,
                    "Không thể xóa danh mục đang được tham chiếu bởi " + ruleCount + " luật tương thích phần cứng");
        }
    }
}
