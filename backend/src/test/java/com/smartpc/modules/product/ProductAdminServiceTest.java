package com.smartpc.modules.product;

import com.smartpc.modules.product.cache.ProductListCacheManager;
import com.smartpc.modules.product.dto.request.UpdateProductRequest;
import com.smartpc.modules.product.dto.response.AdminProductDTO;
import com.smartpc.modules.product.dto.response.ProductDetailDTO;
import com.smartpc.modules.product.dto.response.ProductSummaryDTO;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.entity.ProductSyncStatus;
import com.smartpc.modules.product.event.ProductSavedEvent;
import com.smartpc.modules.product.mapper.ProductMapper;
import com.smartpc.modules.product.repository.CategoryRepository;
import com.smartpc.modules.product.repository.ProductEmbeddingRepository;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.service.ProductAdminService;
import com.smartpc.modules.product.service.ProductVectorSyncService;
import com.smartpc.modules.product.validator.SpecSchemaValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductAdminServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductEmbeddingRepository embeddingRepository;

    @Mock
    private SpecSchemaValidator specValidator;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ProductVectorSyncService syncService;

    @Mock
    private ProductListCacheManager listCache;

    private CategorySpecSchemaRegistry schemaRegistry;
    private ProductMapper productMapper;
    private ProductAdminService productAdminService;

    @BeforeEach
    void setUp() {
        schemaRegistry = new CategorySpecSchemaRegistry();
        productMapper = new ProductMapper(schemaRegistry);
        productAdminService = new ProductAdminService(
                productRepository,
                categoryRepository,
                embeddingRepository,
                specValidator,
                productMapper,
                eventPublisher,
                syncService,
                listCache,
                schemaRegistry
        );
    }

    @Test
    @DisplayName("TC-PROD-11: Không re-embed khi chỉ đổi giá hoặc tồn kho")
    void testUpdateProduct_OnlyPriceOrStockChanged_NoReEmbed() {
        String productId = "prod-cpu-1";
        Category cpuCategory = Category.builder()
                .categoryId("cat-cpu")
                .categoryCode("CPU")
                .categoryName("Bộ vi xử lý (CPU)")
                .build();

        Map<String, Object> currentSpecs = new LinkedHashMap<>();
        currentSpecs.put("socket_type", "LGA1700");
        currentSpecs.put("tdp_w", 125);
        currentSpecs.put("core_count", 14);

        Product existing = Product.builder()
                .productId(productId)
                .name("Intel Core i5-13600K")
                .brand("INTEL")
                .category(cpuCategory)
                .description("Vi xử lý Raptor Lake thế hệ 13")
                .price(7500000)
                .stockQuantity(20)
                .benchmarkScore(88.0)
                .specs(new LinkedHashMap<>(currentSpecs))
                .syncStatus(ProductSyncStatus.SYNCED)
                .version(1L)
                .build();

        // Admin updates ONLY price from 7,500,000 to 7,200,000 and stock from 20 to 18
        UpdateProductRequest request = UpdateProductRequest.builder()
                .version(1L)
                .name("Intel Core i5-13600K")
                .brand("INTEL")
                .categoryCode("CPU")
                .description("Vi xử lý Raptor Lake thế hệ 13")
                .price(7200000) // changed
                .stockQuantity(18) // changed
                .benchmarkScore(88.0)
                .specs(new LinkedHashMap<>(currentSpecs))
                .build();

        when(productRepository.findById(productId)).thenReturn(Optional.of(existing));
        when(categoryRepository.findByCategoryCode("CPU")).thenReturn(Optional.of(cpuCategory));
        when(specValidator.validateSpecs("CPU", request.getSpecs())).thenReturn(new LinkedHashMap<>(currentSpecs));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminProductDTO updated = productAdminService.updateProduct(productId, request);

        assertNotNull(updated);
        assertEquals(7200000, updated.getPrice());
        assertEquals(18, updated.getStockQuantity());
        assertEquals(ProductSyncStatus.SYNCED, updated.getSyncStatus(), "sync_status phải giữ nguyên SYNCED");

        // Verify that no ProductSavedEvent was published
        verify(eventPublisher, never()).publishEvent(any(ProductSavedEvent.class));
        // Verify list cache was evicted
        verify(listCache, times(1)).evictAll();
    }

    @Test
    @DisplayName("TC-PROD-19: Public DTO chỉ trả in_stock (ẩn stock_quantity), Admin DTO trả đầy đủ stock_quantity")
    void testStockVisibilityAndInStockMapping() {
        Category gpuCategory = Category.builder()
                .categoryId("cat-gpu")
                .categoryCode("GPU")
                .categoryName("Card màn hình (VGA)")
                .build();

        Product inStockProduct = Product.builder()
                .productId("prod-gpu-1")
                .name("ASUS Dual GeForce RTX 4060")
                .brand("ASUS")
                .category(gpuCategory)
                .price(7990000)
                .stockQuantity(15)
                .benchmarkScore(78.5)
                .build();

        Product outOfStockProduct = Product.builder()
                .productId("prod-gpu-2")
                .name("AMD Ryzen 7 7800X3D")
                .brand("AMD")
                .category(gpuCategory)
                .price(10490000)
                .stockQuantity(0)
                .benchmarkScore(96.5)
                .build();

        ProductSummaryDTO summaryIn = productMapper.toSummaryDto(inStockProduct);
        ProductDetailDTO detailIn = productMapper.toDetailDto(inStockProduct);
        AdminProductDTO adminIn = productMapper.toAdminDto(inStockProduct);

        assertTrue(summaryIn.getInStock());
        assertTrue(detailIn.getInStock());
        assertEquals(15, adminIn.getStockQuantity());
        assertTrue(adminIn.getInStock());

        ProductSummaryDTO summaryOut = productMapper.toSummaryDto(outOfStockProduct);
        ProductDetailDTO detailOut = productMapper.toDetailDto(outOfStockProduct);
        AdminProductDTO adminOut = productMapper.toAdminDto(outOfStockProduct);

        assertFalse(summaryOut.getInStock());
        assertFalse(detailOut.getInStock());
        assertEquals(0, adminOut.getStockQuantity());
        assertFalse(adminOut.getInStock());
    }

    @Test
    @DisplayName("TC-PROD-28: Hiển thị linh kiện ngưng kinh doanh trong Quản trị Kho Linh Kiện và sắp xếp xuống cuối bảng")
    void testAdminProductListing_InactiveProductsSortedToEnd() {
        com.smartpc.modules.product.dto.request.ProductFilterCriteria criteria =
                com.smartpc.modules.product.dto.request.ProductFilterCriteria.builder().build();

        org.springframework.data.domain.PageRequest pageRequest = org.springframework.data.domain.PageRequest.of(0, 20);

        Category cat = Category.builder().categoryCode("CPU").categoryName("CPU").build();
        Product activeProduct = Product.builder()
                .productId("p-active")
                .name("Intel Core i5-13600K")
                .brand("INTEL")
                .category(cat)
                .isActive(true)
                .price(7000000)
                .stockQuantity(10)
                .build();

        Product inactiveProduct = Product.builder()
                .productId("p-inactive")
                .name("Intel Core i3-10100")
                .brand("INTEL")
                .category(cat)
                .isActive(false)
                .price(2000000)
                .stockQuantity(5)
                .build();

        org.springframework.data.domain.Page<Product> mockPage = new org.springframework.data.domain.PageImpl<>(
                java.util.List.of(activeProduct, inactiveProduct),
                pageRequest,
                2
        );

        when(productRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenAnswer(invocation -> {
                    org.springframework.data.domain.Pageable p = invocation.getArgument(1);
                    org.springframework.data.domain.Sort.Order firstOrder = p.getSort().iterator().next();
                    assertEquals("isActive", firstOrder.getProperty());
                    assertTrue(firstOrder.isDescending(), "Sort đầu tiên phải là isActive DESC để đưa SP ngưng kinh doanh xuống cuối");
                    return mockPage;
                });

        var response = productAdminService.getAdminProducts(criteria, pageRequest);

        assertNotNull(response);
        assertEquals(2, response.getContent().size());
        assertTrue(response.getContent().get(0).getIsActive(), "Sản phẩm đầu tiên đang kinh doanh (is_active=true)");
        assertFalse(response.getContent().get(1).getIsActive(), "Sản phẩm thứ hai ngưng kinh doanh (is_active=false) được xếp sau");
    }
}
