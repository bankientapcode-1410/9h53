package com.smartpc.modules.pcbuilder;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.exception.GlobalExceptionHandler;
import com.smartpc.modules.pcbuilder.controller.PCBuilderController;
import com.smartpc.modules.pcbuilder.dto.request.AddBuildToCartRequest;
import com.smartpc.modules.pcbuilder.dto.request.BuildItemInput;
import com.smartpc.modules.pcbuilder.dto.request.ResolveBuildRequest;
import com.smartpc.modules.pcbuilder.dto.response.AddBuildToCartResponseDTO;
import com.smartpc.modules.pcbuilder.dto.response.ResolveBuildResponseDTO;
import com.smartpc.modules.pcbuilder.dto.response.ValidatedCartItemDTO;
import com.smartpc.modules.pcbuilder.model.BuilderGateStatus;
import com.smartpc.modules.pcbuilder.service.PCBuilderCandidateService;
import com.smartpc.modules.pcbuilder.service.PCBuilderCartService;
import com.smartpc.modules.pcbuilder.service.PCBuilderEvaluationService;
import com.smartpc.modules.pcbuilder.service.PCBuilderQuickFixService;
import com.smartpc.modules.pcbuilder.validator.PCBuilderRequestValidator;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.mapper.ProductMapper;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.evaluator.RuleEvaluator;
import com.smartpc.modules.ruleengine.model.PreIndexedRuleCache;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.service.CompatibilityService;
import com.smartpc.modules.ruleengine.service.RuleCacheManager;
import com.smartpc.modules.ruleengine.strategy.EqualsOperatorStrategy;
import com.smartpc.modules.ruleengine.strategy.GteOperatorStrategy;
import com.smartpc.modules.ruleengine.strategy.InOperatorStrategy;
import com.smartpc.modules.ruleengine.strategy.LteOperatorStrategy;
import com.smartpc.modules.ruleengine.strategy.NotInOperatorStrategy;
import com.smartpc.modules.ruleengine.strategy.RangeOperatorStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PCBuilderCartServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RuleCacheManager ruleCacheManager;

    @Mock
    private PCBuilderCandidateService candidateService;

    @Mock
    private PCBuilderQuickFixService quickFixService;

    private PCBuilderCartService cartService;
    private MockMvc mockMvc;

    private CompatRule psuWarningRule;

    @BeforeEach
    void setUp() {
        AggregateCalculator aggregateCalculator = new AggregateCalculator();
        EqualsOperatorStrategy equalsStrategy = new EqualsOperatorStrategy();
        InOperatorStrategy inStrategy = new InOperatorStrategy(equalsStrategy);
        NotInOperatorStrategy notInStrategy = new NotInOperatorStrategy(inStrategy);
        LteOperatorStrategy lteStrategy = new LteOperatorStrategy();
        GteOperatorStrategy gteStrategy = new GteOperatorStrategy();
        RangeOperatorStrategy rangeStrategy = new RangeOperatorStrategy();

        RuleEvaluator ruleEvaluator = new RuleEvaluator(List.of(
                equalsStrategy,
                inStrategy,
                notInStrategy,
                lteStrategy,
                gteStrategy,
                rangeStrategy
        ));

        CompatibilityService compatibilityService = new CompatibilityService(
                productRepository,
                ruleCacheManager,
                aggregateCalculator,
                ruleEvaluator
        );

        PCBuilderRequestValidator requestValidator = new PCBuilderRequestValidator();
        PCBuilderEvaluationService evaluationService = new PCBuilderEvaluationService(
                productRepository,
                compatibilityService,
                aggregateCalculator,
                requestValidator
        );
        CategorySpecSchemaRegistry schemaRegistry = new CategorySpecSchemaRegistry();
        ProductMapper productMapper = new ProductMapper(schemaRegistry);

        cartService = new PCBuilderCartService(
                productRepository,
                evaluationService,
                requestValidator,
                productMapper
        );

        PCBuilderController controller = new PCBuilderController(
                evaluationService,
                candidateService,
                quickFixService,
                cartService
        );
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        psuWarningRule = CompatRule.builder()
                .ruleId("r0000001-0000-0000-0000-000000000007")
                .ruleName("Công suất nguồn PSU sát ngưỡng tải")
                .sourceCategory("CPU")
                .targetCategory("PSU")
                .sourceSpecKey("_total_tdp_w")
                .targetSpecKey("rated_wattage_w")
                .operator(RuleOperator.LTE)
                .severity(RuleSeverity.WARNING)
                .errorMessageTemplate("Tổng TDP {source_value}W vượt công suất định mức nguồn {target_value}W")
                .isActive(true)
                .priority(7)
                .build();
    }

    @Test
    @DisplayName("TC-UC2-25: Cấu hình rỗng trả 400 BUILDER_EMPTY_CONFIG; sản phẩm không tồn tại/ngừng bán trả 409 BUILDER_PRODUCT_UNAVAILABLE")
    void testEmptyConfigAndUnavailableProductRejection() throws Exception {
        // 1. Service: /add-to-cart rỗng -> 400 BUILDER_EMPTY_CONFIG
        AddBuildToCartRequest emptyRequest = AddBuildToCartRequest.builder()
                .items(Collections.emptyList())
                .acknowledgedWarnings(false)
                .build();
        BusinessException emptyEx = assertThrows(BusinessException.class,
                () -> cartService.addBuildToCart(emptyRequest, null));
        assertEquals(HttpStatus.BAD_REQUEST, emptyEx.getHttpStatus());
        assertEquals(ErrorCode.BUILDER_EMPTY_CONFIG.getCode(), emptyEx.getErrorCode());

        // Service: /resolve rỗng -> 400 BUILDER_EMPTY_CONFIG
        ResolveBuildRequest emptyResolve = ResolveBuildRequest.builder()
                .items(Collections.emptyList())
                .build();
        BusinessException emptyResolveEx = assertThrows(BusinessException.class,
                () -> cartService.resolveShareBuild(emptyResolve));
        assertEquals(HttpStatus.BAD_REQUEST, emptyResolveEx.getHttpStatus());
        assertEquals(ErrorCode.BUILDER_EMPTY_CONFIG.getCode(), emptyResolveEx.getErrorCode());

        verifyNoInteractions(productRepository);

        // Controller MockMvc: empty items -> HTTP 400 BUILDER_EMPTY_CONFIG
        mockMvc.perform(post("/api/v1/pc-builder/add-to-cart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[],\"acknowledged_warnings\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("BUILDER_EMPTY_CONFIG"));

        // 2. Product không tồn tại / is_active=false -> 409 BUILDER_PRODUCT_UNAVAILABLE
        Product activeCpu = Product.builder()
                .productId("e0000001-0000-0000-0000-000000000001")
                .name("Intel Core i5-14600K")
                .category(Category.builder().categoryCode("CPU").categoryName("CPU").build())
                .price(7_990_000)
                .stockQuantity(12)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 125))
                .build();
        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(activeCpu));

        AddBuildToCartRequest unavailableRequest = AddBuildToCartRequest.builder()
                .items(List.of(
                        BuildItemInput.builder().productId(activeCpu.getProductId()).quantity(1).slotCode("CPU").build(),
                        BuildItemInput.builder().productId("inactive-or-deleted-ram").quantity(1).slotCode("RAM").build()
                ))
                .acknowledgedWarnings(true)
                .build();

        BusinessException unavailEx = assertThrows(BusinessException.class,
                () -> cartService.addBuildToCart(unavailableRequest, null));
        assertEquals(HttpStatus.CONFLICT, unavailEx.getHttpStatus());
        assertEquals(ErrorCode.BUILDER_PRODUCT_UNAVAILABLE.getCode(), unavailEx.getErrorCode());
        assertFalse(unavailEx.getErrors().isEmpty());
        assertEquals("inactive-or-deleted-ram", unavailEx.getErrors().get(0).getField());

        mockMvc.perform(post("/api/v1/pc-builder/add-to-cart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"product_id\":\"inactive-or-deleted-ram\",\"quantity\":1}],\"acknowledged_warnings\":false}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("BUILDER_PRODUCT_UNAVAILABLE"));
    }

    @Test
    @DisplayName("TC-UC2-26: Server-Authoritative Price, tính long an toàn chống tràn 32-bit và Guest Mode (cart_persisted=false)")
    void testServerAuthoritativePriceAndGuestMode() throws Exception {
        PreIndexedRuleCache emptyCache = new PreIndexedRuleCache(Collections.emptyMap(), Collections.emptyList());
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(emptyCache);

        Product cpu = Product.builder()
                .productId("e0000001-0000-0000-0000-000000000001")
                .name("Intel Core i5-14600K")
                .imageUrl("/images/cpu-14600k.jpg")
                .category(Category.builder().categoryCode("CPU").categoryName("Bộ vi xử lý").build())
                .price(7_990_000)
                .stockQuantity(12)
                .benchmarkScore(88.0)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 125))
                .build();

        Product ram = Product.builder()
                .productId("e0000003-0000-0000-0000-000000000001")
                .name("Corsair Vengeance 32GB DDR5")
                .imageUrl("/images/ram-corsair.jpg")
                .category(Category.builder().categoryCode("RAM").categoryName("Bộ nhớ trong").build())
                .price(3_290_000)
                .stockQuantity(20)
                .benchmarkScore(80.0)
                .specs(Map.of("memory_type", "DDR5", "capacity_gb", 32, "modules_per_kit", 2))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(ram, cpu)); // Trả ngược thứ tự để test bảo toàn thứ tự request

        AddBuildToCartRequest request = AddBuildToCartRequest.builder()
                .items(List.of(
                        BuildItemInput.builder().productId(cpu.getProductId()).quantity(1).slotCode("CPU").build(),
                        BuildItemInput.builder().productId(ram.getProductId()).quantity(2).slotCode("RAM").build()
                ))
                .acknowledgedWarnings(false)
                .build();

        AddBuildToCartResponseDTO response = cartService.addBuildToCart(request, null);

        assertFalse(response.isCartPersisted());
        assertNull(response.getCartId());
        assertEquals(BuilderGateStatus.READY_SAFE, response.getGateStatus());
        assertEquals(3, response.getAddedItemsCount());
        assertEquals(14_570_000L, response.getSubtotalPrice());
        assertEquals(2, response.getItems().size());

        ValidatedCartItemDTO first = response.getItems().get(0);
        assertEquals(cpu.getProductId(), first.getProductId());
        assertEquals("CPU", first.getSlotCode());
        assertEquals(7_990_000L, first.getUnitPrice());
        assertEquals(1, first.getQuantity());
        assertEquals(7_990_000L, first.getLineTotal());
        assertEquals(12, first.getAvailableStock());

        ValidatedCartItemDTO second = response.getItems().get(1);
        assertEquals(ram.getProductId(), second.getProductId());
        assertEquals("RAM", second.getSlotCode());
        assertEquals(3_290_000L, second.getUnitPrice());
        assertEquals(2, second.getQuantity());
        assertEquals(6_580_000L, second.getLineTotal());
        assertEquals(20, second.getAvailableStock());

        // Controller MockMvc với AnonymousAuthenticationToken -> vẫn là Guest Mode (cart_persisted=false, cart_id=null)
        AnonymousAuthenticationToken anonymousAuth = new AnonymousAuthenticationToken(
                "key",
                "anonymousUser",
                AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")
        );
        mockMvc.perform(post("/api/v1/pc-builder/add-to-cart")
                        .principal(anonymousAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "items": [
                                    { "product_id": "e0000001-0000-0000-0000-000000000001", "quantity": 1, "slot_code": "CPU" },
                                    { "product_id": "e0000003-0000-0000-0000-000000000001", "quantity": 2, "slot_code": "RAM" }
                                  ],
                                  "acknowledged_warnings": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cart_persisted").value(false))
                .andExpect(jsonPath("$.data.cart_id").value(nullValue()))
                .andExpect(jsonPath("$.data.gate_status").value("READY_SAFE"))
                .andExpect(jsonPath("$.data.added_items_count").value(3))
                .andExpect(jsonPath("$.data.subtotal_price").value(14570000L))
                .andExpect(jsonPath("$.data.items[1].line_total").value(6580000L));

        // Kiểm tra chống tràn số 32-bit int cho cấu hình giá trị lớn (> 2.147 tỷ VNĐ)
        Product highEndRam = Product.builder()
                .productId("ram-ecc-enterprise")
                .name("Enterprise DDR5 ECC Kit")
                .category(Category.builder().categoryCode("RAM").categoryName("RAM").build())
                .price(1_500_000_000)
                .stockQuantity(10)
                .specs(Map.of("memory_type", "DDR5"))
                .build();
        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(highEndRam));

        AddBuildToCartResponseDTO highValueRes = cartService.addBuildToCart(
                AddBuildToCartRequest.builder()
                        .items(List.of(BuildItemInput.builder()
                                .productId(highEndRam.getProductId())
                                .quantity(2)
                                .slotCode("RAM")
                                .build()))
                        .acknowledgedWarnings(false)
                        .build(),
                null
        );
        assertEquals(3_000_000_000L, highValueRes.getItems().get(0).getLineTotal());
        assertEquals(3_000_000_000L, highValueRes.getSubtotalPrice());
    }

    @Test
    @DisplayName("TC-UC2-26 (Warning Gate): WARNING thiếu ack bị chặn 409, có ack đi qua với Guest Mode")
    void testAddToCartWarningGateReuse() {
        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("CPU:PSU", List.of(psuWarningRule)),
                List.of(psuWarningRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        Product cpu = Product.builder()
                .productId("cpu-500w")
                .name("Intel Core i9-14900K")
                .category(Category.builder().categoryCode("CPU").categoryName("CPU").build())
                .price(14_500_000)
                .stockQuantity(5)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 500))
                .build();
        Product psu = Product.builder()
                .productId("psu-450w")
                .name("Corsair CV450 450W")
                .category(Category.builder().categoryCode("PSU").categoryName("PSU").build())
                .price(990_000)
                .stockQuantity(7)
                .specs(Map.of("rated_wattage_w", 450))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, psu));

        List<BuildItemInput> items = List.of(
                BuildItemInput.builder().productId(cpu.getProductId()).quantity(1).slotCode("CPU").build(),
                BuildItemInput.builder().productId(psu.getProductId()).quantity(1).slotCode("PSU").build()
        );

        BusinessException warnEx = assertThrows(BusinessException.class,
                () -> cartService.addBuildToCart(
                        AddBuildToCartRequest.builder().items(items).acknowledgedWarnings(false).build(),
                        null
                ));
        assertEquals(ErrorCode.BUILDER_WARNING_ACK_REQUIRED.getCode(), warnEx.getErrorCode());

        AddBuildToCartResponseDTO ackRes = cartService.addBuildToCart(
                AddBuildToCartRequest.builder().items(items).acknowledgedWarnings(true).build(),
                null
        );
        assertFalse(ackRes.isCartPersisted());
        assertEquals(BuilderGateStatus.WARNING_CONFIRM_REQUIRED, ackRes.getGateStatus());
        assertEquals(15_490_000L, ackRes.getSubtotalPrice());
    }

    @Test
    @DisplayName("TC-UC2-28: Share URL /resolve khôi phục sản phẩm hợp lệ vào slot, loại ID đã xóa vào dropped_product_ids & chạy 1 DB fetch")
    void testResolveShareBuildSingleFetchWithDroppedIds() throws Exception {
        PreIndexedRuleCache emptyCache = new PreIndexedRuleCache(Collections.emptyMap(), Collections.emptyList());
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(emptyCache);

        Product validCpu = Product.builder()
                .productId("validCpu")
                .name("Intel Core i5-14600K")
                .brand("INTEL")
                .imageUrl("/images/cpu-14600k.jpg")
                .category(Category.builder().categoryCode("CPU").categoryName("Bộ vi xử lý").build())
                .price(7_990_000)
                .stockQuantity(10)
                .benchmarkScore(88.0)
                .specs(Map.of("socket_type", "LGA1700", "core_count", 14, "tdp_w", 125))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(validCpu));

        ResolveBuildRequest request = ResolveBuildRequest.builder()
                .items(List.of(
                        BuildItemInput.builder().productId("validCpu").quantity(1).build(),
                        BuildItemInput.builder().productId("deletedId").quantity(1).build()
                ))
                .build();

        ResolveBuildResponseDTO result = cartService.resolveShareBuild(request);

        verify(productRepository, times(1)).findAllActiveWithCategoryByIds(anyCollection());

        assertEquals(1, result.getResolvedItems().size());
        assertEquals("CPU", result.getResolvedItems().get(0).getSlotCode());
        assertEquals(1, result.getResolvedItems().get(0).getQuantity());
        assertEquals("validCpu", result.getResolvedItems().get(0).getProduct().getProductId());
        assertEquals(7_990_000, result.getResolvedItems().get(0).getProduct().getPrice());

        assertEquals(List.of("deletedId"), result.getDroppedProductIds());

        assertNotNull(result.getEvaluation());
        assertEquals(BuilderGateStatus.READY_SAFE, result.getEvaluation().getGateStatus());
        assertEquals(7_990_000L, result.getEvaluation().getTelemetry().getTotalPrice());
        assertTrue(result.getEvaluation().getCompatibility().getUnresolvedProductIds().isEmpty());

        // Verify Controller REST contract /resolve
        mockMvc.perform(post("/api/v1/pc-builder/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "items": [
                                    { "product_id": "validCpu", "quantity": 1 },
                                    { "product_id": "deletedId", "quantity": 1 }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.resolved_items[0].slot_code").value("CPU"))
                .andExpect(jsonPath("$.data.resolved_items[0].product.product_id").value("validCpu"))
                .andExpect(jsonPath("$.data.dropped_product_ids[0]").value("deletedId"))
                .andExpect(jsonPath("$.data.evaluation.gate_status").value("READY_SAFE"));
    }

    @Test
    @DisplayName("TC-UC2-31b: Add-to-Cart và Resolve giữ nguyên nhiều ổ SSD_SATA (MULTI qty=3)")
    void testSsdSataMultiQuantityInCartAndResolve() {
        PreIndexedRuleCache emptyCache = new PreIndexedRuleCache(Collections.emptyMap(), Collections.emptyList());
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(emptyCache);

        Product ssdSata = Product.builder()
                .productId("e0000001-0000-0000-0000-000000000091")
                .name("SSD Crucial MX500 500GB 2.5\" SATA III")
                .brand("CRUCIAL")
                .imageUrl("/images/products/e0000001-0000-0000-0000-000000000091.svg")
                .category(Category.builder().categoryCode("SSD_SATA").categoryName("Ổ cứng SSD SATA 2.5\"").build())
                .price(1_290_000)
                .stockQuantity(30)
                .benchmarkScore(76.0)
                .specs(Map.of("interface_type", "SATA III 6Gb/s", "capacity_gb", 500, "tdp_w", 2))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(ssdSata));

        AddBuildToCartRequest addReq = AddBuildToCartRequest.builder()
                .items(List.of(BuildItemInput.builder()
                        .productId(ssdSata.getProductId())
                        .quantity(3)
                        .slotCode("SSD_SATA")
                        .build()))
                .acknowledgedWarnings(false)
                .build();

        AddBuildToCartResponseDTO cartRes = cartService.addBuildToCart(addReq, null);
        assertEquals(BuilderGateStatus.READY_SAFE, cartRes.getGateStatus());
        assertEquals(3, cartRes.getAddedItemsCount());
        assertEquals(3_870_000L, cartRes.getSubtotalPrice());
        assertEquals("SSD_SATA", cartRes.getItems().get(0).getSlotCode());
        assertEquals(3, cartRes.getItems().get(0).getQuantity());

        ResolveBuildResponseDTO resolveRes = cartService.resolveShareBuild(ResolveBuildRequest.builder()
                .items(List.of(BuildItemInput.builder().productId(ssdSata.getProductId()).quantity(3).build()))
                .build());
        assertEquals(1, resolveRes.getResolvedItems().size());
        assertEquals("SSD_SATA", resolveRes.getResolvedItems().get(0).getSlotCode());
        assertEquals(3, resolveRes.getResolvedItems().get(0).getQuantity());
        assertEquals(0, resolveRes.getEvaluation().getTelemetry().getSelectedCoreSlots());
        assertEquals(8, resolveRes.getEvaluation().getTelemetry().getTotalCoreSlots());
    }
}
