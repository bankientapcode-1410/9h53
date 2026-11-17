package com.smartpc.modules.pcbuilder;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.pcbuilder.dto.request.SlotCandidateSearchRequest;
import com.smartpc.modules.pcbuilder.dto.response.CandidateProductDTO;
import com.smartpc.modules.pcbuilder.model.BuilderSlotCode;
import com.smartpc.modules.pcbuilder.model.SlotStatusLevel;
import com.smartpc.modules.pcbuilder.service.PCBuilderCandidateService;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.mapper.ProductMapper;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.validator.ProductFilterValidator;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PCBuilderCandidateServiceTest {

    @Mock
    private ProductRepository productRepository;

    private PCBuilderCandidateService candidateService;

    @BeforeEach
    void setUp() {
        CategorySpecSchemaRegistry schemaRegistry = new CategorySpecSchemaRegistry();
        ProductMapper productMapper = new ProductMapper(schemaRegistry);
        ProductFilterValidator filterValidator = new ProductFilterValidator(schemaRegistry);
        candidateService = new PCBuilderCandidateService(productRepository, productMapper, filterValidator);
    }

    @Test
    @DisplayName("TC-UC2-01: Từ chối slot không hợp lệ bằng BusinessException(BUILDER_INVALID_SLOT)")
    void testRejectInvalidSlotCode() {
        SlotCandidateSearchRequest request = SlotCandidateSearchRequest.builder()
                .search("RTX")
                .build();

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> candidateService.findCandidates("INVALID_PART", request)
        );
        assertEquals(ErrorCode.BUILDER_INVALID_SLOT.getCode(), ex.getErrorCode());
        assertEquals(400, ex.getHttpStatus().value());
        verifyNoInteractions(productRepository);
    }

    @Test
    @DisplayName("TC-UC2-01b: Từ chối slot rỗng/null nhưng chấp nhận slot ngoại vi MONITOR")
    void testBlankSlotRejectedAndPeripheralAccepted() {
        assertThrows(
                BusinessException.class,
                () -> candidateService.findCandidates("   ", null)
        );

        Category monitorCategory = Category.builder()
                .categoryId("c-mon")
                .categoryCode("MONITOR")
                .categoryName("Màn hình máy tính (Monitor)")
                .build();
        Product monitor = Product.builder()
                .productId("mon-001")
                .name("LG UltraGear 27GP850")
                .brand("LG")
                .category(monitorCategory)
                .price(8990000)
                .stockQuantity(10)
                .benchmarkScore(85.0)
                .isActive(true)
                .specs(Map.of("screen_size_inch", 27, "resolution", "2K QHD (2560x1440)", "refresh_rate_hz", 165, "panel_type", "IPS"))
                .build();

        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(monitor)));

        PageResponse<CandidateProductDTO> result = candidateService.findCandidates("monitor", null);
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("MONITOR", result.getContent().get(0).getProduct().getCategoryCode());
        assertEquals(SlotStatusLevel.COMPATIBLE, result.getContent().get(0).getCompatStatus());
    }

    @Test
    @DisplayName("TC-UC2-02: Lọc ứng viên theo từ khóa 'B760', thông số form_factor='ATX', active & chưa xóa mềm")
    @SuppressWarnings("unchecked")
    void testFilterCandidatesByKeywordAndSpecs() {
        Category mbCategory = Category.builder()
                .categoryId("c0000001-0000-0000-0000-000000000002")
                .categoryCode("MOTHERBOARD")
                .categoryName("Bo mạch chủ (Mainboard)")
                .build();

        Product b760Atx = Product.builder()
                .productId("e0000001-0000-0000-0000-000000000005")
                .name("Bo mạch chủ ASUS ROG STRIX B760-A GAMING WIFI D4")
                .brand("ASUS")
                .category(mbCategory)
                .price(5490000)
                .stockQuantity(8)
                .benchmarkScore(82.0)
                .isActive(true)
                .deletedAt(null)
                .specs(Map.of(
                        "supported_sockets", List.of("LGA1700"),
                        "form_factor", "ATX",
                        "supported_memory_types", List.of("DDR4"),
                        "ram_slots", 4,
                        "max_ram_gb", 128,
                        "m2_slots", 3
                ))
                .build();

        Page<Product> mockedPage = new PageImpl<>(List.of(b760Atx));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockedPage);

        SlotCandidateSearchRequest request = SlotCandidateSearchRequest.builder()
                .search("B760")
                .specs(Map.of("form_factor", "ATX"))
                .inStockOnly(true)
                .sort("price_asc")
                .page(-2)
                .size(999)
                .build();

        PageResponse<CandidateProductDTO> response = candidateService.findCandidates("MOTHERBOARD", request);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        CandidateProductDTO dto = response.getContent().get(0);
        assertEquals("e0000001-0000-0000-0000-000000000005", dto.getProduct().getProductId());
        assertEquals("ASUS", dto.getProduct().getBrand());
        assertEquals("ATX", dto.getProduct().getKeySpecs().get("form_factor"));
        assertTrue(dto.getProduct().getInStock());
        assertEquals(SlotStatusLevel.COMPATIBLE, dto.getCompatStatus());

        // Verify clamped pagination, price_asc sorting, and Specification predicates
        ArgumentCaptor<Specification<Product>> specCaptor = ArgumentCaptor.forClass(Specification.class);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).findAll(specCaptor.capture(), pageableCaptor.capture());

        Pageable capturedPageable = pageableCaptor.getValue();
        assertEquals(0, capturedPageable.getPageNumber(), "page âm phải được kẹp về 0");
        assertEquals(48, capturedPageable.getPageSize(), "size vượt quá 48 phải được kẹp về 48");
        Sort.Order firstSort = capturedPageable.getSort().iterator().next();
        assertEquals("price", firstSort.getProperty());
        assertTrue(firstSort.isAscending());

        // Exercise the generated JPA Specification to assert deletedAt IS NULL, isActive = true,
        // categoryCode = MOTHERBOARD, vFormFactor = ATX, search LIKE '%b760%', stockQuantity > 0
        Root<Product> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> deletedAtPath = mock(Path.class);
        Path<Object> isActivePath = mock(Path.class);
        Path<Object> categoryPath = mock(Path.class);
        Path<Object> categoryCodePath = mock(Path.class);
        Path<Object> vFormFactorPath = mock(Path.class);
        Path<Object> namePath = mock(Path.class);
        Path<Object> brandPath = mock(Path.class);
        Path<Object> stockPath = mock(Path.class);
        Expression<String> upperCategoryExpr = mock(Expression.class);
        Expression<String> lowerNameExpr = mock(Expression.class);

        lenient().when(root.get("deletedAt")).thenReturn(deletedAtPath);
        lenient().when(root.get("isActive")).thenReturn(isActivePath);
        lenient().when(root.get("category")).thenReturn(categoryPath);
        lenient().when(categoryPath.get("categoryCode")).thenReturn(categoryCodePath);
        lenient().when(root.get("vFormFactor")).thenReturn(vFormFactorPath);
        lenient().when(root.get("name")).thenReturn(namePath);
        lenient().when(root.get("brand")).thenReturn(brandPath);
        lenient().when(root.get("stockQuantity")).thenReturn(stockPath);

        lenient().when(cb.upper(any())).thenReturn(upperCategoryExpr);
        lenient().when(cb.lower(any())).thenReturn(lowerNameExpr);
        lenient().when(cb.isNull(any())).thenReturn(mock(Predicate.class));
        lenient().when(cb.equal(any(), any())).thenReturn(mock(Predicate.class));
        lenient().when(cb.like(any(), anyString())).thenReturn(mock(Predicate.class));
        lenient().when(cb.greaterThan(any(Expression.class), eq(0))).thenReturn(mock(Predicate.class));
        lenient().when(cb.or(any(Predicate[].class))).thenReturn(mock(Predicate.class));
        lenient().when(cb.and(any(Predicate.class), any(Predicate.class))).thenReturn(mock(Predicate.class));
        lenient().when(cb.and(any(Predicate[].class))).thenReturn(mock(Predicate.class));

        Predicate combined = specCaptor.getValue().toPredicate(root, query, cb);
        assertNotNull(combined);

        verify(cb).isNull(deletedAtPath);
        verify(cb).equal(isActivePath, true);
        verify(cb).equal(upperCategoryExpr, "MOTHERBOARD");
        verify(cb).equal(vFormFactorPath, "ATX");
        verify(cb, times(2)).like(any(), eq("%b760%"));
        verify(cb).greaterThan(any(Expression.class), eq(0));
    }

    @Test
    @DisplayName("TC-UC2-02b: Chỉ chấp nhận 4 giá trị sort (newest, oldest, price_asc, price_desc) và từ chối benchmark_desc")
    @SuppressWarnings("unchecked")
    void testSortWhitelistAndOrder() {
        for (String invalidSort : List.of("benchmark_desc", "popular_desc")) {
            SlotCandidateSearchRequest invalidReq = SlotCandidateSearchRequest.builder()
                    .sort(invalidSort)
                    .build();
            BusinessException ex = assertThrows(
                    BusinessException.class,
                    () -> candidateService.findCandidates("CPU", invalidReq)
            );
            assertEquals(ErrorCode.PROD_INVALID_FILTER.getCode(), ex.getErrorCode());
            assertEquals(400, ex.getHttpStatus().value());
        }
        verifyNoInteractions(productRepository);

        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        candidateService.findCandidates("CPU", SlotCandidateSearchRequest.builder().sort("newest").build());
        candidateService.findCandidates("CPU", SlotCandidateSearchRequest.builder().sort("oldest").build());
        candidateService.findCandidates("CPU", SlotCandidateSearchRequest.builder().sort("price_asc").build());
        candidateService.findCandidates("CPU", SlotCandidateSearchRequest.builder().sort("price_desc").build());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository, times(4)).findAll(any(Specification.class), pageableCaptor.capture());

        List<Pageable> calls = pageableCaptor.getAllValues();
        assertEquals(Sort.Order.desc("createdAt"), calls.get(0).getSort().getOrderFor("createdAt"));
        assertEquals(Sort.Order.asc("createdAt"), calls.get(1).getSort().getOrderFor("createdAt"));
        assertEquals(Sort.Order.asc("price"), calls.get(2).getSort().getOrderFor("price"));
        assertEquals(Sort.Order.desc("price"), calls.get(3).getSort().getOrderFor("price"));
    }

    @Test
    @DisplayName("TC-UC2-31: Chấp nhận slot nội bộ tùy chọn SSD_SATA (2.5\") nhưng giữ nguyên 8 core slots")
    @SuppressWarnings("unchecked")
    void testOptionalSsdSataSlotAcceptedWithoutMutatingCoreSlots() {
        assertEquals(8, BuilderSlotCode.values().length);
        assertTrue(BuilderSlotCode.fromCode("SSD_SATA").isEmpty());
        assertTrue(BuilderSlotCode.isOptionalInternalSlot("SSD_SATA"));
        assertFalse(BuilderSlotCode.isKnownPeripheral("SSD_SATA"));
        assertTrue(BuilderSlotCode.isValidBuilderSlotOrPeripheral("SSD_SATA"));

        Category ssdSataCategory = Category.builder()
                .categoryId("c0000001-0000-0000-0000-000000000012")
                .categoryCode("SSD_SATA")
                .categoryName("Ổ cứng SSD SATA 2.5\"")
                .build();
        Product samsung870Evo = Product.builder()
                .productId("e0000001-0000-0000-0000-000000000095")
                .name("SSD Samsung 870 EVO 1TB 2.5\" SATA III")
                .brand("SAMSUNG")
                .category(ssdSataCategory)
                .price(2_590_000)
                .stockQuantity(20)
                .benchmarkScore(84.0)
                .isActive(true)
                .specs(Map.of(
                        "interface_type", "SATA III 6Gb/s",
                        "form_factor", "2.5 inch",
                        "capacity_gb", 1000,
                        "read_speed_mbps", 560,
                        "tdp_w", 2
                ))
                .build();

        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(samsung870Evo)));

        PageResponse<CandidateProductDTO> result = candidateService.findCandidates(
                "ssd_sata",
                SlotCandidateSearchRequest.builder().brand(List.of("SAMSUNG")).build()
        );
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("SSD_SATA", result.getContent().get(0).getProduct().getCategoryCode());
        assertEquals(SlotStatusLevel.COMPATIBLE, result.getContent().get(0).getCompatStatus());
    }
}
