package com.smartpc.modules.product;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.product.dto.request.UpdateCategoryRequest;
import com.smartpc.modules.product.dto.response.CategoryTreeDTO;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.mapper.CategoryMapper;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.service.CategoryService;
import com.smartpc.modules.product.validator.CategoryValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    private CategorySpecSchemaRegistry schemaRegistry;
    private CategoryMapper categoryMapper;
    private CategoryService categoryService;
    private CategoryValidator categoryValidator;

    @BeforeEach
    void setUp() {
        schemaRegistry = new CategorySpecSchemaRegistry();
        categoryMapper = new CategoryMapper(schemaRegistry);
        categoryService = new CategoryService(categoryRepository, categoryMapper, schemaRegistry);
        categoryValidator = new CategoryValidator(categoryRepository, productRepository);
    }

    @Test
    @DisplayName("TC-CAT-01: Dựng cây danh mục phân cấp từ danh sách phẳng (11 categories: 3 nhóm, 8 lá)")
    void testBuildHierarchy_Success() {
        // 3 root groups
        Category g1 = Category.builder().categoryId("g1").categoryCode("PC_CORE").categoryName("Linh kiện cốt lõi").build();
        Category g2 = Category.builder().categoryId("g2").categoryCode("STORAGE_DEVICES").categoryName("Thiết bị lưu trữ").build();
        Category g3 = Category.builder().categoryId("g3").categoryCode("POWER_COOLING_CASE").categoryName("Nguồn, Tản nhiệt & Vỏ máy").build();

        // 8 leaf categories
        Category c1 = Category.builder().categoryId("c1").categoryCode("CPU").categoryName("Bộ vi xử lý (CPU)").parentCategory(g1).build();
        Category c2 = Category.builder().categoryId("c2").categoryCode("MOTHERBOARD").categoryName("Bo mạch chủ (Mainboard)").parentCategory(g1).build();
        Category c3 = Category.builder().categoryId("c3").categoryCode("RAM").categoryName("Bộ nhớ trong (RAM)").parentCategory(g1).build();
        Category c4 = Category.builder().categoryId("c4").categoryCode("GPU").categoryName("Card màn hình (VGA)").parentCategory(g1).build();

        Category c5 = Category.builder().categoryId("c5").categoryCode("SSD_M2").categoryName("Ổ cứng SSD M.2 NVMe").parentCategory(g2).build();

        Category c6 = Category.builder().categoryId("c6").categoryCode("PSU").categoryName("Nguồn máy tính (PSU)").parentCategory(g3).build();
        Category c7 = Category.builder().categoryId("c7").categoryCode("CASE").categoryName("Vỏ máy tính (Case)").parentCategory(g3).build();
        Category c8 = Category.builder().categoryId("c8").categoryCode("CPU_COOLER").categoryName("Tản nhiệt CPU").parentCategory(g3).build();

        List<Category> allCategories = List.of(g1, g2, g3, c1, c2, c3, c4, c5, c6, c7, c8);

        List<CategoryTreeDTO> tree = categoryService.buildHierarchy(allCategories);

        assertNotNull(tree);
        assertEquals(3, tree.size(), "Cây phải có 3 danh mục gốc");

        CategoryTreeDTO root1 = tree.stream().filter(t -> t.getCategoryCode().equals("PC_CORE")).findFirst().orElseThrow();
        assertEquals(4, root1.getChildren().size(), "PC_CORE phải chứa 4 danh mục con");

        CategoryTreeDTO root2 = tree.stream().filter(t -> t.getCategoryCode().equals("STORAGE_DEVICES")).findFirst().orElseThrow();
        assertEquals(1, root2.getChildren().size(), "STORAGE_DEVICES phải chứa 1 danh mục con");

        CategoryTreeDTO root3 = tree.stream().filter(t -> t.getCategoryCode().equals("POWER_COOLING_CASE")).findFirst().orElseThrow();
        assertEquals(3, root3.getChildren().size(), "POWER_COOLING_CASE phải chứa 3 danh mục con");
    }

    @Test
    @DisplayName("TC-CAT-02: Chặn vòng lặp cha-con (A là cha của B, cập nhật cha của A = B)")
    void testValidateParent_CircularReference() {
        Category catA = Category.builder().categoryId("cat-a").categoryCode("GROUP_A").categoryName("Nhóm A").build();
        Category catB = Category.builder().categoryId("cat-b").categoryCode("GROUP_B").categoryName("Nhóm B").parentCategory(catA).build();

        when(categoryRepository.findById("cat-b")).thenReturn(Optional.of(catB));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                categoryValidator.validateParent(catA.getCategoryId(), catB.getCategoryId()));

        assertEquals(ErrorCode.PROD_CATEGORY_CIRCULAR_REF.getCode(), ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-CAT-03: Chặn đổi category_code bất biến khi cập nhật danh mục")
    void testValidateUpdate_ImmutableCode() {
        Category existing = Category.builder()
                .categoryId("cat-cpu")
                .categoryCode("CPU")
                .categoryName("Bộ vi xử lý")
                .build();

        UpdateCategoryRequest request = UpdateCategoryRequest.builder()
                .categoryCode("CPU_X") // Attempt to change immutable code
                .categoryName("Bộ vi xử lý mới")
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () ->
                categoryValidator.validateUpdate(existing, request));

        assertEquals(ErrorCode.PROD_CATEGORY_CODE_IMMUTABLE.getCode(), ex.getErrorCode());
    }
}
