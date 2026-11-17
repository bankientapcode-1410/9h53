package com.smartpc.modules.pcbuilder;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.modules.pcbuilder.dto.request.BuildItemInput;
import com.smartpc.modules.pcbuilder.dto.response.PCBuilderEvaluateResponse;
import com.smartpc.modules.pcbuilder.dto.response.SlotDiagnosticDTO;
import com.smartpc.modules.pcbuilder.model.BuilderGateStatus;
import com.smartpc.modules.pcbuilder.model.BuilderSlotCode;
import com.smartpc.modules.pcbuilder.model.SlotStatusLevel;
import com.smartpc.modules.pcbuilder.service.PCBuilderEvaluationService;
import com.smartpc.modules.pcbuilder.validator.PCBuilderRequestValidator;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.evaluator.RuleEvaluator;
import com.smartpc.modules.ruleengine.model.PreIndexedRuleCache;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.service.CompatibilityService;
import com.smartpc.modules.ruleengine.service.RuleCacheManager;
import com.smartpc.modules.ruleengine.strategy.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PCBuilderEvaluationServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RuleCacheManager ruleCacheManager;

    private PCBuilderEvaluationService evaluationService;

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
    }

    @Test
    @DisplayName("TC-UC2-05: Đánh giá cấu hình trống trả về response mặc định an toàn & BLOCKED_EMPTY")
    void testEmptyBuildEvaluation() {
        PCBuilderEvaluateResponse response = evaluationService.evaluateBuild(Collections.emptyList());

        assertNotNull(response);
        assertTrue(response.getCompatibility().isCompatible());
        assertTrue(response.getCompatibility().getErrors().isEmpty());
        assertEquals(0L, response.getTelemetry().getTotalPrice());
        assertEquals(0.0, response.getTelemetry().getEstimatedTdpW());
        assertEquals(0, response.getTelemetry().getRecommendedPsuW());
        assertNull(response.getTelemetry().getSelectedPsuWattageW());
        assertNull(response.getTelemetry().getPsuLoadPercent());
        assertEquals(0, response.getTelemetry().getSelectedCoreSlots());
        assertEquals(8, response.getTelemetry().getTotalCoreSlots());
        assertEquals(BuilderGateStatus.BLOCKED_EMPTY, response.getGateStatus());
        assertEquals(8, response.getSlotStatuses().size());
        for (BuilderSlotCode slot : BuilderSlotCode.values()) {
            assertEquals(SlotStatusLevel.EMPTY, response.getSlotStatuses().get(slot.name()).getStatus());
        }
        assertEquals(List.of("CPU", "MOTHERBOARD", "RAM", "SSD_M2", "PSU", "CASE"),
                response.getMissingRecommendedSlots());
        verifyNoInteractions(productRepository, ruleCacheManager);
    }

    @Test
    @DisplayName("TC-UC2-06: Phát hiện xung đột socket CPU LGA1700 vs Mainboard AM5 & gán slot_statuses ERROR")
    void testSocketConflictAndSlotStatusMapping() {
        CompatRule socketRule = CompatRule.builder()
                .ruleId("r0000001-0000-0000-0000-000000000001")
                .ruleName("CPU-Motherboard Socket Match")
                .sourceCategory("CPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("socket_type")
                .targetSpecKey("supported_sockets")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("CPU socket {source_value} không tương thích với Mainboard (hỗ trợ: {target_value}).")
                .isActive(true)
                .priority(1)
                .build();

        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("CPU:MOTHERBOARD", List.of(socketRule)),
                List.of(socketRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        Product cpu = Product.builder()
                .productId("e0000001-0000-0000-0000-000000000002")
                .name("Intel Core i7-14700K")
                .category(Category.builder().categoryCode("CPU").build())
                .price(10890000)
                .stockQuantity(15)
                .benchmarkScore(94.0)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 125))
                .build();

        Product motherboard = Product.builder()
                .productId("e0000001-0000-0000-0000-000000000007")
                .name("ASUS ROG Crosshair X670E")
                .category(Category.builder().categoryCode("MOTHERBOARD").build())
                .price(10490000)
                .stockQuantity(10)
                .benchmarkScore(86.0)
                .specs(Map.of("supported_sockets", List.of("AM5")))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, motherboard));

        List<BuildItemInput> items = List.of(
                BuildItemInput.builder().productId(cpu.getProductId()).quantity(1).slotCode("CPU").build(),
                BuildItemInput.builder().productId(motherboard.getProductId()).quantity(1).slotCode("MOTHERBOARD").build()
        );

        PCBuilderEvaluateResponse response = evaluationService.evaluateBuild(items);

        assertFalse(response.getCompatibility().isCompatible());
        assertEquals(1, response.getCompatibility().getErrors().size());
        assertEquals(BuilderGateStatus.BLOCKED_COMPATIBILITY_ERROR, response.getGateStatus());
        assertEquals(21380000L, response.getTelemetry().getTotalPrice());
        assertEquals(175.0, response.getTelemetry().getEstimatedTdpW());
        assertEquals(450, response.getTelemetry().getRecommendedPsuW());
        assertEquals(2, response.getTelemetry().getSelectedCoreSlots());

        SlotDiagnosticDTO cpuDiag = response.getSlotStatuses().get("CPU");
        SlotDiagnosticDTO mbDiag = response.getSlotStatuses().get("MOTHERBOARD");
        assertEquals(SlotStatusLevel.ERROR, cpuDiag.getStatus());
        assertEquals(1, cpuDiag.getErrorCount());
        assertTrue(cpuDiag.getViolationRuleIds().contains("r0000001-0000-0000-0000-000000000001"));
        assertEquals(SlotStatusLevel.ERROR, mbDiag.getStatus());
        assertEquals(1, mbDiag.getErrorCount());
        assertTrue(mbDiag.getViolationRuleIds().contains("r0000001-0000-0000-0000-000000000001"));
        assertEquals(SlotStatusLevel.EMPTY, response.getSlotStatuses().get("RAM").getStatus());
        assertEquals(List.of("RAM", "SSD_M2", "PSU", "CASE"), response.getMissingRecommendedSlots());
    }

    @Test
    @DisplayName("TC-UC2-07: Tính TDP (không cộng Cooler), recommended_psu_w & psu_load_percent")
    void testTdpRecommendedPsuAndLoadPercent() {
        PreIndexedRuleCache emptyCache = new PreIndexedRuleCache(Collections.emptyMap(), Collections.emptyList());
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(emptyCache);

        Product cpu = Product.builder()
                .productId("cpu-125")
                .name("Intel Core i7-14700K")
                .category(Category.builder().categoryCode("CPU").build())
                .price(10000000)
                .stockQuantity(10)
                .benchmarkScore(94.0)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 125))
                .build();

        Product gpu = Product.builder()
                .productId("gpu-220")
                .name("NVIDIA RTX 4070")
                .category(Category.builder().categoryCode("GPU").build())
                .price(16000000)
                .stockQuantity(10)
                .benchmarkScore(91.5)
                .specs(Map.of("tdp_w", 220, "length_mm", 267))
                .build();

        Product cooler = Product.builder()
                .productId("cooler-250")
                .name("Tower Cooler 250W")
                .category(Category.builder().categoryCode("CPU_COOLER").build())
                .price(1200000)
                .stockQuantity(15)
                .benchmarkScore(83.0)
                .specs(Map.of("tdp_w", 250, "supported_sockets", List.of("LGA1700", "AM5")))
                .build();

        Product psu = Product.builder()
                .productId("psu-650")
                .name("PSU 650W Bronze")
                .category(Category.builder().categoryCode("PSU").build())
                .price(1500000)
                .stockQuantity(20)
                .benchmarkScore(74.0)
                .specs(Map.of("rated_wattage_w", 650))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, gpu, cooler, psu));

        List<BuildItemInput> items = List.of(
                BuildItemInput.builder().productId(cpu.getProductId()).quantity(1).slotCode("CPU").build(),
                BuildItemInput.builder().productId(gpu.getProductId()).quantity(1).slotCode("GPU").build(),
                BuildItemInput.builder().productId(cooler.getProductId()).quantity(1).slotCode("CPU_COOLER").build(),
                BuildItemInput.builder().productId(psu.getProductId()).quantity(1).slotCode("PSU").build()
        );

        PCBuilderEvaluateResponse response = evaluationService.evaluateBuild(items);

        assertTrue(response.getCompatibility().isCompatible());
        assertEquals(BuilderGateStatus.READY_SAFE, response.getGateStatus());
        assertEquals(28700000L, response.getTelemetry().getTotalPrice());
        // 125 (CPU) + 220 (GPU) + 50 (base overhead) = 395.0W (excludes 250W cooler & 650W PSU)
        assertEquals(395.0, response.getTelemetry().getEstimatedTdpW());
        // ceil((395 * 1.35) / 50) * 50 = ceil(533.25 / 50) * 50 = 550W
        assertEquals(550, response.getTelemetry().getRecommendedPsuW());
        assertEquals(650, response.getTelemetry().getSelectedPsuWattageW());
        // round(395 / 650 * 100, 1) = 60.8
        assertEquals(60.8, response.getTelemetry().getPsuLoadPercent());
        assertNotNull(response.getTelemetry().getBalanceIndex());
        assertEquals("CÂN BẰNG TỐT", response.getTelemetry().getBalanceLabel());
        assertEquals(4, response.getTelemetry().getSelectedCoreSlots());
    }

    @Test
    @DisplayName("TC-UC2-08: Chặn cấu hình vượt quá MAX_DISTINCT_PRODUCTS (31 product_id khác nhau)")
    void testRejectMoreThanMaxDistinctProducts() {
        List<BuildItemInput> items = new ArrayList<>();
        for (int i = 1; i <= 31; i++) {
            items.add(BuildItemInput.builder()
                    .productId("prod-" + i)
                    .quantity(1)
                    .build());
        }

        BusinessException ex = assertThrows(BusinessException.class,
                () -> evaluationService.evaluateBuild(items));

        assertEquals(ErrorCode.RULE_CHECK_TOO_MANY_PRODUCTS.getCode(), ex.getErrorCode());
        verifyNoInteractions(productRepository);
    }

    @Test
    @DisplayName("TC-UC2-09: Chặn chọn quá số lượng (quantity = 2) trên slot SINGLE như CPU")
    void testRejectQuantityExceedingSingleSlotCapacity() {
        List<BuildItemInput> items = List.of(
                BuildItemInput.builder()
                        .productId("e0000001-0000-0000-0000-000000000001")
                        .quantity(2)
                        .slotCode("CPU")
                        .build()
        );

        BusinessException ex = assertThrows(BusinessException.class,
                () -> evaluationService.evaluateBuild(items));

        assertEquals(ErrorCode.BUILDER_SLOT_CAPACITY_EXCEEDED.getCode(), ex.getErrorCode());
        verifyNoInteractions(productRepository);
    }

    @Test
    @DisplayName("Kiểm tra thêm: Gate status WARNING_CONFIRM_REQUIRED và BLOCKED_OUT_OF_STOCK khi dùng evaluateFetchedProducts")
    void testWarningAndStockGateStatuses() {
        CompatRule psuWarningRule = CompatRule.builder()
                .ruleId("r0000001-0000-0000-0000-000000000007")
                .ruleName("PSU Wattage Sufficiency")
                .sourceCategory("CPU")
                .targetCategory("PSU")
                .sourceSpecKey("_total_tdp_w")
                .targetSpecKey("rated_wattage_w")
                .operator(RuleOperator.LTE)
                .severity(RuleSeverity.WARNING)
                .errorMessageTemplate("TDP {source_value}W vượt công suất nguồn {target_value}W.")
                .isActive(true)
                .priority(7)
                .build();

        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("CPU:PSU", List.of(psuWarningRule)),
                List.of(psuWarningRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        Product cpu = Product.builder()
                .productId("cpu-high")
                .name("High TDP CPU")
                .category(Category.builder().categoryCode("CPU").build())
                .price(12000000)
                .stockQuantity(5)
                .benchmarkScore(95.0)
                .specs(Map.of("tdp_w", 500))
                .build();

        Product weakPsu = Product.builder()
                .productId("psu-450")
                .name("PSU 450W")
                .category(Category.builder().categoryCode("PSU").build())
                .price(900000)
                .stockQuantity(5)
                .benchmarkScore(60.0)
                .specs(Map.of("rated_wattage_w", 450))
                .build();

        PCBuilderEvaluateResponse warningResp = evaluationService.evaluateFetchedProducts(
                List.of(cpu, weakPsu),
                Map.of("cpu-high", 1, "psu-450", 1),
                Collections.emptyList()
        );
        assertTrue(warningResp.getCompatibility().isCompatible());
        assertEquals(1, warningResp.getCompatibility().getWarnings().size());
        assertEquals(BuilderGateStatus.WARNING_CONFIRM_REQUIRED, warningResp.getGateStatus());
        assertEquals(SlotStatusLevel.WARNING, warningResp.getSlotStatuses().get("PSU").getStatus());

        // Now test out-of-stock
        weakPsu.setStockQuantity(0);
        PCBuilderEvaluateResponse stockResp = evaluationService.evaluateFetchedProducts(
                List.of(cpu, weakPsu),
                Map.of("cpu-high", 1, "psu-450", 1),
                Collections.emptyList()
        );
        assertEquals(BuilderGateStatus.BLOCKED_OUT_OF_STOCK, stockResp.getGateStatus());
        assertEquals(1, stockResp.getStockIssues().size());
        assertEquals("psu-450", stockResp.getStockIssues().get(0).getProductId());
    }

    @Test
    @DisplayName("TC-UC2-32: Đánh giá SSD_SATA không kích hoạt Rule 9 (M.2 Slot Count) & giữ nguyên 8 core slots")
    void testSsdSataEvaluatedOutsideRule9AndCoreSlots() {
        CompatRule rule9M2SlotCount = CompatRule.builder()
                .ruleId("r0000001-0000-0000-0000-000000000009")
                .ruleName("M.2 Slot Count")
                .sourceCategory("SSD_M2")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("_count")
                .targetSpecKey("m2_slots")
                .operator(RuleOperator.LTE)
                .severity(RuleSeverity.WARNING)
                .errorMessageTemplate("Số lượng ổ cứng SSD M.2 ({source_value}) vượt quá số khe cắm M.2 ({target_value} khe).")
                .isActive(true)
                .priority(9)
                .build();

        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("SSD_M2:MOTHERBOARD", List.of(rule9M2SlotCount)),
                List.of(rule9M2SlotCount)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        Product motherboard = Product.builder()
                .productId("mb-1m2")
                .name("Mainboard B760M 1-M2")
                .category(Category.builder().categoryCode("MOTHERBOARD").build())
                .price(3_290_000)
                .stockQuantity(8)
                .benchmarkScore(75.0)
                .specs(Map.of("m2_slots", 1, "tdp_w", 35))
                .build();

        Product ssdM2 = Product.builder()
                .productId("ssd-m2-1")
                .name("Samsung 980 PRO 1TB NVMe")
                .category(Category.builder().categoryCode("SSD_M2").build())
                .price(2_690_000)
                .stockQuantity(12)
                .benchmarkScore(90.0)
                .specs(Map.of("capacity_gb", 1000, "tdp_w", 5))
                .build();

        Product ssdSata = Product.builder()
                .productId("ssd-sata-3")
                .name("Crucial MX500 500GB 2.5\" SATA III")
                .category(Category.builder().categoryCode("SSD_SATA").build())
                .price(1_290_000)
                .stockQuantity(20)
                .benchmarkScore(76.0)
                .specs(Map.of("interface_type", "SATA III 6Gb/s", "form_factor", "2.5 inch", "capacity_gb", 500, "tdp_w", 2))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(motherboard, ssdM2, ssdSata));

        List<BuildItemInput> items = List.of(
                BuildItemInput.builder().productId(motherboard.getProductId()).quantity(1).slotCode("MOTHERBOARD").build(),
                BuildItemInput.builder().productId(ssdM2.getProductId()).quantity(1).slotCode("SSD_M2").build(),
                BuildItemInput.builder().productId(ssdSata.getProductId()).quantity(3).slotCode("SSD_SATA").build()
        );

        PCBuilderEvaluateResponse response = evaluationService.evaluateBuild(items);

        assertTrue(response.getCompatibility().isCompatible());
        assertTrue(response.getCompatibility().getWarnings().isEmpty(), "SSD_SATA không được đếm vào Rule 9 khe M.2");
        assertEquals(BuilderGateStatus.READY_SAFE, response.getGateStatus());
        assertEquals(2, response.getTelemetry().getSelectedCoreSlots());
        assertEquals(8, response.getTelemetry().getTotalCoreSlots());
        assertEquals(8, response.getSlotStatuses().size());
        assertEquals(List.of("CPU", "RAM", "PSU", "CASE"), response.getMissingRecommendedSlots());

        // 3_290_000 (MB) + 2_690_000 (M.2) + 3 * 1_290_000 (SATA) = 9_850_000
        assertEquals(9_850_000L, response.getTelemetry().getTotalPrice());
        // 50 (base) + 35 (MB) + 5 (M.2) + 3 * 2 (SATA) = 96.0W
        assertEquals(96.0, response.getTelemetry().getEstimatedTdpW());
    }
}
