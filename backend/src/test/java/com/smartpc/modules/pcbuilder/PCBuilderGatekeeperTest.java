package com.smartpc.modules.pcbuilder;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.pcbuilder.dto.request.BuildItemInput;
import com.smartpc.modules.pcbuilder.dto.response.PCBuilderEvaluateResponse;
import com.smartpc.modules.pcbuilder.dto.response.StockIssueDTO;
import com.smartpc.modules.pcbuilder.model.BuilderGateStatus;
import com.smartpc.modules.pcbuilder.service.PCBuilderCartService;
import com.smartpc.modules.pcbuilder.service.PCBuilderCartService.ValidatedBuildContext;
import com.smartpc.modules.pcbuilder.service.PCBuilderEvaluationService;
import com.smartpc.modules.pcbuilder.validator.PCBuilderRequestValidator;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult.ViolationDetail;
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

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PCBuilderGatekeeperTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RuleCacheManager ruleCacheManager;

    private PCBuilderEvaluationService evaluationService;
    private PCBuilderCartService cartService;

    private CompatRule socketErrorRule;
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
        evaluationService = new PCBuilderEvaluationService(
                productRepository,
                compatibilityService,
                aggregateCalculator,
                requestValidator
        );
        cartService = new PCBuilderCartService(
                productRepository,
                evaluationService,
                requestValidator
        );

        socketErrorRule = CompatRule.builder()
                .ruleId("r0000001-0000-0000-0000-000000000001")
                .ruleName("Socket CPU phải khớp Mainboard")
                .sourceCategory("CPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("socket_type")
                .targetSpecKey("supported_sockets")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("CPU socket {source_value} không tương thích Mainboard (hỗ trợ: {target_value})")
                .isActive(true)
                .priority(1)
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
    @DisplayName("TC-UC2-15: Thứ tự ưu tiên determineGateStatus - BLOCKED_OUT_OF_STOCK thắng ERROR & WARNING")
    void testGateStatusPrecedenceOutOfStockOverridesErrorAndWarning() {
        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of(
                        "CPU:MOTHERBOARD", List.of(socketErrorRule),
                        "CPU:PSU", List.of(psuWarningRule)
                ),
                List.of(socketErrorRule, psuWarningRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        Product cpu = Product.builder()
                .productId("cpu-14700k")
                .name("Intel Core i7-14700K")
                .category(Category.builder().categoryCode("CPU").build())
                .price(10890000)
                .stockQuantity(10)
                .benchmarkScore(94.0)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 500))
                .build();

        Product outOfStockAm5Mb = Product.builder()
                .productId("mb-x670e-oos")
                .name("ASUS ROG Crosshair X670E")
                .category(Category.builder().categoryCode("MOTHERBOARD").build())
                .price(10490000)
                .stockQuantity(0)
                .benchmarkScore(86.0)
                .specs(Map.of("supported_sockets", List.of("AM5")))
                .build();

        Product weakPsu = Product.builder()
                .productId("psu-450w")
                .name("PSU 450W")
                .category(Category.builder().categoryCode("PSU").build())
                .price(950000)
                .stockQuantity(10)
                .benchmarkScore(65.0)
                .specs(Map.of("rated_wattage_w", 450))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, outOfStockAm5Mb, weakPsu));

        List<BuildItemInput> items = List.of(
                BuildItemInput.builder().productId(cpu.getProductId()).quantity(1).slotCode("CPU").build(),
                BuildItemInput.builder().productId(outOfStockAm5Mb.getProductId()).quantity(1).slotCode("MOTHERBOARD").build(),
                BuildItemInput.builder().productId(weakPsu.getProductId()).quantity(1).slotCode("PSU").build()
        );

        PCBuilderEvaluateResponse response = evaluationService.evaluateBuild(items);

        assertEquals(1, response.getStockIssues().size());
        assertEquals(1, response.getCompatibility().getErrors().size());
        assertEquals(1, response.getCompatibility().getWarnings().size());
        assertEquals(BuilderGateStatus.BLOCKED_OUT_OF_STOCK, response.getGateStatus());

        // Kiểm tra thêm hàm determineGateStatus trực tiếp cho toàn bộ chuỗi 5 trạng thái
        ViolationDetail errorDetail = ViolationDetail.builder()
                .ruleId("r1")
                .severity(RuleSeverity.ERROR)
                .message("Lỗi socket")
                .build();
        ViolationDetail warningDetail = ViolationDetail.builder()
                .ruleId("r7")
                .severity(RuleSeverity.WARNING)
                .message("Cảnh báo PSU")
                .build();
        ViolationDetail infoDetail = ViolationDetail.builder()
                .ruleId("r10")
                .severity(RuleSeverity.INFO)
                .message("Thông tin PCIe")
                .build();

        CompatibilityResult errorAndWarning = CompatibilityResult.builder()
                .isCompatible(false)
                .errors(List.of(errorDetail))
                .warnings(List.of(warningDetail))
                .build();
        CompatibilityResult warningOnlyDefaultFlag = CompatibilityResult.builder()
                .warnings(List.of(warningDetail))
                .build();
        CompatibilityResult infoOnly = CompatibilityResult.builder()
                .isCompatible(true)
                .info(List.of(infoDetail))
                .build();

        assertEquals(BuilderGateStatus.BLOCKED_EMPTY,
                evaluationService.determineGateStatus(0, errorAndWarning, List.of(), List.of()));
        assertEquals(BuilderGateStatus.BLOCKED_OUT_OF_STOCK,
                evaluationService.determineGateStatus(1, errorAndWarning,
                        List.of(StockIssueDTO.builder().productId("p1").build()), List.of()));
        assertEquals(BuilderGateStatus.BLOCKED_OUT_OF_STOCK,
                evaluationService.determineGateStatus(true, infoOnly, List.of(), List.of("missing-id")));
        assertEquals(BuilderGateStatus.BLOCKED_COMPATIBILITY_ERROR,
                evaluationService.determineGateStatus(true, errorAndWarning, List.of(), List.of()));
        assertEquals(BuilderGateStatus.WARNING_CONFIRM_REQUIRED,
                evaluationService.determineGateStatus(true, warningOnlyDefaultFlag, List.of(), List.of()));
        assertEquals(BuilderGateStatus.READY_SAFE,
                evaluationService.determineGateStatus(true, infoOnly, List.of(), List.of()));
    }

    @Test
    @DisplayName("TC-UC2-16: Hard Block ERROR phía Server dù acknowledged_warnings = true")
    void testHardBlockCompatibilityErrorEvenWhenWarningsAcknowledged() {
        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("CPU:MOTHERBOARD", List.of(socketErrorRule)),
                List.of(socketErrorRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        Product cpu = Product.builder()
                .productId("cpu-lga1700")
                .name("Intel Core i5-14600K")
                .category(Category.builder().categoryCode("CPU").build())
                .price(7990000)
                .stockQuantity(12)
                .benchmarkScore(88.0)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 125))
                .build();

        Product motherboard = Product.builder()
                .productId("mb-am5")
                .name("MSI MAG B650 TOMAHAWK")
                .category(Category.builder().categoryCode("MOTHERBOARD").build())
                .price(5900000)
                .stockQuantity(8)
                .benchmarkScore(82.0)
                .specs(Map.of("supported_sockets", List.of("AM5")))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, motherboard));

        List<BuildItemInput> items = List.of(
                BuildItemInput.builder().productId(cpu.getProductId()).quantity(1).slotCode("CPU").build(),
                BuildItemInput.builder().productId(motherboard.getProductId()).quantity(1).slotCode("MOTHERBOARD").build()
        );

        BusinessException ex = assertThrows(BusinessException.class,
                () -> cartService.enforceGatekeeper(items, true));

        assertEquals(HttpStatus.CONFLICT, ex.getHttpStatus());
        assertEquals(ErrorCode.BUILDER_COMPATIBILITY_CONFLICT.getCode(), ex.getErrorCode());
        assertFalse(ex.getErrors().isEmpty());
        assertEquals(socketErrorRule.getRuleId(), ex.getErrors().get(0).getField());
    }

    @Test
    @DisplayName("TC-UC2-17: Soft Gate WARNING thiếu acknowledged_warnings = false bị từ chối với 409 BUILDER_WARNING_ACK_REQUIRED")
    void testSoftGateWarningWithoutAcknowledgementThrows409() {
        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("CPU:PSU", List.of(psuWarningRule)),
                List.of(psuWarningRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        Product cpu = Product.builder()
                .productId("cpu-500w")
                .name("Intel Core i9-14900K")
                .category(Category.builder().categoryCode("CPU").build())
                .price(14500000)
                .stockQuantity(5)
                .benchmarkScore(98.0)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 500))
                .build();

        Product psu = Product.builder()
                .productId("psu-450w")
                .name("Corsair CV450 450W")
                .category(Category.builder().categoryCode("PSU").build())
                .price(990000)
                .stockQuantity(7)
                .benchmarkScore(60.0)
                .specs(Map.of("rated_wattage_w", 450))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, psu));

        List<BuildItemInput> items = List.of(
                BuildItemInput.builder().productId(cpu.getProductId()).quantity(1).slotCode("CPU").build(),
                BuildItemInput.builder().productId(psu.getProductId()).quantity(1).slotCode("PSU").build()
        );

        BusinessException ex = assertThrows(BusinessException.class,
                () -> cartService.enforceGatekeeper(items, false));

        assertEquals(HttpStatus.CONFLICT, ex.getHttpStatus());
        assertEquals(ErrorCode.BUILDER_WARNING_ACK_REQUIRED.getCode(), ex.getErrorCode());
        assertFalse(ex.getErrors().isEmpty());
        assertEquals(psuWarningRule.getRuleId(), ex.getErrors().get(0).getField());
    }

    @Test
    @DisplayName("TC-UC2-18: WARNING đã xác nhận acknowledged_warnings = true được phép đi tiếp qua Gatekeeper")
    void testSoftGateWarningWithAcknowledgementPassesGatekeeper() {
        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("CPU:PSU", List.of(psuWarningRule)),
                List.of(psuWarningRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        Product cpu = Product.builder()
                .productId("cpu-500w")
                .name("Intel Core i9-14900K")
                .category(Category.builder().categoryCode("CPU").build())
                .price(14500000)
                .stockQuantity(5)
                .benchmarkScore(98.0)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 500))
                .build();

        Product psu = Product.builder()
                .productId("psu-450w")
                .name("Corsair CV450 450W")
                .category(Category.builder().categoryCode("PSU").build())
                .price(990000)
                .stockQuantity(7)
                .benchmarkScore(60.0)
                .specs(Map.of("rated_wattage_w", 450))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, psu));

        List<BuildItemInput> items = List.of(
                BuildItemInput.builder().productId(cpu.getProductId()).quantity(1).slotCode("CPU").build(),
                BuildItemInput.builder().productId(psu.getProductId()).quantity(1).slotCode("PSU").build()
        );

        ValidatedBuildContext context = assertDoesNotThrow(
                () -> cartService.enforceGatekeeper(items, true));

        assertNotNull(context);
        assertEquals(2, context.products().size());
        assertEquals(BuilderGateStatus.WARNING_CONFIRM_REQUIRED, context.evaluation().getGateStatus());
        assertEquals(15490000L, context.evaluation().getTelemetry().getTotalPrice());
    }

    @Test
    @DisplayName("Kiểm tra bổ sung Gatekeeper: Empty (400), Unavailable (409), OutOfStock (409), ReadySafe (Pass)")
    void testAdditionalGatekeeperBoundaries() {
        // 1. Empty config -> 400 BUILDER_EMPTY_CONFIG
        BusinessException emptyEx = assertThrows(BusinessException.class,
                () -> cartService.enforceGatekeeper(Collections.emptyList(), false));
        assertEquals(HttpStatus.BAD_REQUEST, emptyEx.getHttpStatus());
        assertEquals(ErrorCode.BUILDER_EMPTY_CONFIG.getCode(), emptyEx.getErrorCode());
        verifyNoInteractions(productRepository);

        // 2. Inactive/deleted/missing product -> 409 BUILDER_PRODUCT_UNAVAILABLE
        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(Collections.emptyList());
        List<BuildItemInput> missingItems = List.of(
                BuildItemInput.builder().productId("deleted-cpu").quantity(1).slotCode("CPU").build()
        );
        BusinessException unavailEx = assertThrows(BusinessException.class,
                () -> cartService.enforceGatekeeper(missingItems, true));
        assertEquals(HttpStatus.CONFLICT, unavailEx.getHttpStatus());
        assertEquals(ErrorCode.BUILDER_PRODUCT_UNAVAILABLE.getCode(), unavailEx.getErrorCode());

        // 3. Out of stock active product -> 409 PROD_OUT_OF_STOCK even with acknowledgedWarnings=true
        PreIndexedRuleCache emptyCache = new PreIndexedRuleCache(Collections.emptyMap(), Collections.emptyList());
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(emptyCache);

        Product oosCpu = Product.builder()
                .productId("cpu-oos")
                .name("Intel Core i5-14600K")
                .category(Category.builder().categoryCode("CPU").build())
                .price(7990000)
                .stockQuantity(0)
                .benchmarkScore(88.0)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 125))
                .build();
        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(oosCpu));

        List<BuildItemInput> oosItems = List.of(
                BuildItemInput.builder().productId("cpu-oos").quantity(1).slotCode("CPU").build()
        );
        BusinessException oosEx = assertThrows(BusinessException.class,
                () -> cartService.enforceGatekeeper(oosItems, true));
        assertEquals(HttpStatus.CONFLICT, oosEx.getHttpStatus());
        assertEquals(ErrorCode.PROD_OUT_OF_STOCK.getCode(), oosEx.getErrorCode());

        // 4. READY_SAFE passes with acknowledgedWarnings=false
        oosCpu.setStockQuantity(5);
        ValidatedBuildContext safeCtx = assertDoesNotThrow(
                () -> cartService.enforceGatekeeper(oosItems, false));
        assertEquals(BuilderGateStatus.READY_SAFE, safeCtx.evaluation().getGateStatus());
    }
}
