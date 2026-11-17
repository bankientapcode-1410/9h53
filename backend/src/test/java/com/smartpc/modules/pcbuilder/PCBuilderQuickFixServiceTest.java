package com.smartpc.modules.pcbuilder;

import com.smartpc.common.exception.BusinessException;
import com.smartpc.common.exception.ErrorCode;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.pcbuilder.dto.request.BuildItemInput;
import com.smartpc.modules.pcbuilder.dto.request.QuickFixRequest;
import com.smartpc.modules.pcbuilder.dto.request.SlotCandidateSearchRequest;
import com.smartpc.modules.pcbuilder.dto.response.CandidateProductDTO;
import com.smartpc.modules.pcbuilder.dto.response.QuickFixOptionDTO;
import com.smartpc.modules.pcbuilder.dto.response.QuickFixResponse;
import com.smartpc.modules.pcbuilder.dto.response.QuickFixStrategyGroupDTO;
import com.smartpc.modules.pcbuilder.model.SlotStatusLevel;
import com.smartpc.modules.pcbuilder.service.PCBuilderCandidateService;
import com.smartpc.modules.pcbuilder.service.PCBuilderQuickFixService;
import com.smartpc.modules.pcbuilder.validator.PCBuilderRequestValidator;
import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.mapper.ProductMapper;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.product.schema.CategorySpecSchemaRegistry;
import com.smartpc.modules.product.validator.ProductFilterValidator;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PCBuilderQuickFixServiceTest {

    private static final String RULE_SOCKET = "r0000001-0000-0000-0000-000000000001";
    private static final String RULE_RAM_TYPE = "r0000001-0000-0000-0000-000000000002";
    private static final String RULE_GPU_LENGTH = "r0000001-0000-0000-0000-000000000005";
    private static final String RULE_PSU_TDP = "r0000001-0000-0000-0000-000000000007";
    private static final String RULE_M2_SLOTS = "r0000001-0000-0000-0000-000000000009";

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RuleCacheManager ruleCacheManager;

    private PCBuilderQuickFixService quickFixService;
    private PCBuilderCandidateService candidateService;

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

        CategorySpecSchemaRegistry schemaRegistry = new CategorySpecSchemaRegistry();
        ProductMapper productMapper = new ProductMapper(schemaRegistry);
        ProductFilterValidator filterValidator = new ProductFilterValidator(schemaRegistry);
        PCBuilderRequestValidator requestValidator = new PCBuilderRequestValidator();

        quickFixService = new PCBuilderQuickFixService(
                productRepository,
                compatibilityService,
                requestValidator,
                productMapper
        );

        candidateService = new PCBuilderCandidateService(
                productRepository,
                productMapper,
                filterValidator,
                compatibilityService,
                requestValidator
        );
    }

    @Test
    @DisplayName("TC-UC2-20: Gợi ý đổi 2 chiều (CPU LGA1700 vs Mainboard AM5) trả về đủ 2 chiến lược 0 lỗi")
    @SuppressWarnings("unchecked")
    void testTwoWayQuickFixCpuVsMotherboard() {
        CompatRule socketRule = socketRule();
        mockRuleCache(List.of(socketRule));

        Product cpuI9 = product("cpu-i9-14900k", "Intel Core i9-14900K", "INTEL", "CPU", 14_990_000, 10, 98.0,
                Map.of("socket_type", "LGA1700", "tdp_w", 125));
        Product mbB650 = product("mb-b650-am5", "MSI MAG B650 TOMAHAWK WIFI", "MSI", "MOTHERBOARD", 6_490_000, 12, 82.0,
                Map.of("supported_sockets", List.of("AM5"), "supported_memory_types", List.of("DDR5")));

        // Replacement Motherboards (2 LGA1700 valid, 1 AM5 still conflicting)
        Product mbZ790 = product("mb-z790-aorus", "GIGABYTE Z790 AORUS ELITE AX", "GIGABYTE", "MOTHERBOARD", 6_990_000, 10, 88.0,
                Map.of("supported_sockets", List.of("LGA1700"), "supported_memory_types", List.of("DDR5")));
        Product mbB760 = product("mb-b760-strix", "ASUS ROG STRIX B760-A", "ASUS", "MOTHERBOARD", 5_490_000, 8, 84.0,
                Map.of("supported_sockets", List.of("LGA1700"), "supported_memory_types", List.of("DDR4")));
        Product mbX670e = product("mb-x670e-am5", "ASUS ROG CROSSHAIR X670E", "ASUS", "MOTHERBOARD", 10_490_000, 5, 91.0,
                Map.of("supported_sockets", List.of("AM5"), "supported_memory_types", List.of("DDR5")));

        // Replacement CPUs (2 AM5 valid, 1 LGA1700 still conflicting)
        Product cpu7800x3d = product("cpu-7800x3d", "AMD Ryzen 7 7800X3D", "AMD", "CPU", 10_490_000, 15, 95.0,
                Map.of("socket_type", "AM5", "tdp_w", 120));
        Product cpu7600 = product("cpu-7600", "AMD Ryzen 5 7600", "AMD", "CPU", 5_190_000, 20, 81.0,
                Map.of("socket_type", "AM5", "tdp_w", 65));
        Product cpu14700k = product("cpu-14700k", "Intel Core i7-14700K", "INTEL", "CPU", 10_890_000, 10, 94.0,
                Map.of("socket_type", "LGA1700", "tdp_w", 125));

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpuI9, mbB650));

        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(mbZ790, mbB760, mbX670e)))
                .thenReturn(new PageImpl<>(List.of(cpu7800x3d, cpu7600, cpu14700k)));

        QuickFixRequest request = QuickFixRequest.builder()
                .currentItems(List.of(
                        BuildItemInput.builder().productId("cpu-i9-14900k").quantity(1).slotCode("CPU").build(),
                        BuildItemInput.builder().productId("mb-b650-am5").quantity(1).slotCode("MOTHERBOARD").build()
                ))
                .violationRuleId(RULE_SOCKET)
                .sourceProductId("cpu-i9-14900k")
                .targetProductId("mb-b650-am5")
                .limitPerStrategy(3)
                .build();

        QuickFixResponse response = quickFixService.suggestFixes(request);

        assertNotNull(response);
        assertEquals(RULE_SOCKET, response.getViolationRuleId());
        assertNull(response.getGuidanceMessage());
        assertEquals(2, response.getStrategies().size());

        // Strategy 1: Replace MOTHERBOARD (Target first)
        QuickFixStrategyGroupDTO mbStrategy = response.getStrategies().get(0);
        assertEquals("MOTHERBOARD", mbStrategy.getReplaceSlot());
        assertEquals("mb-b650-am5", mbStrategy.getCurrentProductId());
        assertTrue(mbStrategy.getStrategyLabel().contains("Mainboard"));
        assertEquals(2, mbStrategy.getOptions().size());
        // Sorted by |price_delta| ASC: Z790 (+500k) before B760 (-1.0M)
        assertEquals("mb-z790-aorus", mbStrategy.getOptions().get(0).getProduct().getProductId());
        assertEquals(500_000L, mbStrategy.getOptions().get(0).getPriceDelta());
        assertEquals(SlotStatusLevel.COMPATIBLE, mbStrategy.getOptions().get(0).getResultingStatus());
        assertEquals(0, mbStrategy.getOptions().get(0).getRemainingWarningsCount());
        assertEquals(1, mbStrategy.getOptions().get(0).getClearedViolationCount());
        assertEquals("mb-b760-strix", mbStrategy.getOptions().get(1).getProduct().getProductId());
        assertEquals(-1_000_000L, mbStrategy.getOptions().get(1).getPriceDelta());

        // Strategy 2: Replace CPU (Source second)
        QuickFixStrategyGroupDTO cpuStrategy = response.getStrategies().get(1);
        assertEquals("CPU", cpuStrategy.getReplaceSlot());
        assertEquals("cpu-i9-14900k", cpuStrategy.getCurrentProductId());
        assertEquals(2, cpuStrategy.getOptions().size());
        assertEquals("cpu-7800x3d", cpuStrategy.getOptions().get(0).getProduct().getProductId());
        assertEquals(-4_500_000L, cpuStrategy.getOptions().get(0).getPriceDelta());
        assertEquals("cpu-7600", cpuStrategy.getOptions().get(1).getProduct().getProductId());

        // Verify bounded pool query uses MAX_QUICKFIX_POOL = 80
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository, times(2)).findAll(any(Specification.class), pageableCaptor.capture());
        for (Pageable pageable : pageableCaptor.getAllValues()) {
            assertEquals(PCBuilderQuickFixService.MAX_QUICKFIX_POOL, pageable.getPageSize());
        }
    }

    @Test
    @DisplayName("TC-UC2-21: Chống phát sinh lỗi dây chuyền (loại Mainboard LGA1700 chỉ hỗ trợ DDR4 khi đang lắp RAM DDR5)")
    @SuppressWarnings("unchecked")
    void testRejectCandidatesIntroducingCascadingErrors() {
        mockRuleCache(List.of(socketRule(), ramTypeRule()));

        Product cpuI9 = product("cpu-i9-14900k", "Intel Core i9-14900K", "INTEL", "CPU", 14_990_000, 10, 98.0,
                Map.of("socket_type", "LGA1700", "tdp_w", 125));
        Product mbB650 = product("mb-b650-am5", "MSI MAG B650 TOMAHAWK WIFI", "MSI", "MOTHERBOARD", 6_490_000, 12, 82.0,
                Map.of("supported_sockets", List.of("AM5"), "supported_memory_types", List.of("DDR5")));
        Product ramDdr5 = product("ram-ddr5-32", "Corsair Vengeance 32GB DDR5", "CORSAIR", "RAM", 3_290_000, 20, 88.0,
                Map.of("memory_type", "DDR5", "capacity_gb", 32, "modules_per_kit", 2));

        // B760-D4 fixes socket LGA1700, but BREAKS RAM DDR5 -> MUST be filtered out!
        Product mbLga1700Ddr4 = product("mb-b760-d4", "ASUS B760-A WIFI D4", "ASUS", "MOTHERBOARD", 5_490_000, 12, 82.0,
                Map.of("supported_sockets", List.of("LGA1700"), "supported_memory_types", List.of("DDR4")));
        Product mbLga1700Ddr5 = product("mb-z790-d5", "GIGABYTE Z790 AORUS ELITE AX", "GIGABYTE", "MOTHERBOARD", 6_990_000, 12, 88.0,
                Map.of("supported_sockets", List.of("LGA1700"), "supported_memory_types", List.of("DDR5")));

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpuI9, mbB650, ramDdr5));

        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(mbLga1700Ddr4, mbLga1700Ddr5)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        QuickFixRequest request = QuickFixRequest.builder()
                .currentItems(List.of(
                        BuildItemInput.builder().productId("cpu-i9-14900k").quantity(1).slotCode("CPU").build(),
                        BuildItemInput.builder().productId("mb-b650-am5").quantity(1).slotCode("MOTHERBOARD").build(),
                        BuildItemInput.builder().productId("ram-ddr5-32").quantity(1).slotCode("RAM").build()
                ))
                .violationRuleId(RULE_SOCKET)
                .build();

        QuickFixResponse response = quickFixService.suggestFixes(request);

        assertEquals(1, response.getStrategies().size());
        QuickFixStrategyGroupDTO mbStrategy = response.getStrategies().get(0);
        assertEquals("MOTHERBOARD", mbStrategy.getReplaceSlot());
        assertEquals(1, mbStrategy.getOptions().size());
        assertEquals("mb-z790-d5", mbStrategy.getOptions().get(0).getProduct().getProductId());
    }

    @Test
    @DisplayName("TC-UC2-22: Thứ tự xếp hạng ưu tiên remaining_warnings_count ASC -> |price_delta| ASC -> benchmark_score DESC")
    @SuppressWarnings("unchecked")
    void testCandidateRankingOrder() {
        mockRuleCache(List.of(socketRule(), m2SlotsWarningRule()));

        Product cpuI9 = product("cpu-i9", "Intel Core i9-14900K", "INTEL", "CPU", 14_990_000, 10, 98.0,
                Map.of("socket_type", "LGA1700"));
        Product mbOld = product("mb-old", "B650 AM5", "MSI", "MOTHERBOARD", 6_000_000, 10, 80.0,
                Map.of("supported_sockets", List.of("AM5"), "m2_slots", 2));
        Product ssd1 = product("ssd-1", "SSD 1TB", "SAMSUNG", "SSD_M2", 2_500_000, 15, 85.0,
                Map.of("capacity_gb", 1000));

        // Candidate A: closest price (+100k), high benchmark, BUT m2_slots=1 triggers 1 WARNING with 2 SSDs
        Product mbA = product("mb-a", "Board A (1 M2 Warning)", "ASUS", "MOTHERBOARD", 6_100_000, 10, 92.0,
                Map.of("supported_sockets", List.of("LGA1700"), "m2_slots", 1));
        // Candidate B: +500k, 0 warnings, benchmark 80.0
        Product mbB = product("mb-b", "Board B (Clean 80pts)", "MSI", "MOTHERBOARD", 6_500_000, 10, 80.0,
                Map.of("supported_sockets", List.of("LGA1700"), "m2_slots", 3));
        // Candidate C: +500k, 0 warnings, benchmark 95.0 (should beat B!)
        Product mbC = product("mb-c", "Board C (Clean 95pts)", "GIGABYTE", "MOTHERBOARD", 6_500_000, 10, 95.0,
                Map.of("supported_sockets", List.of("LGA1700"), "m2_slots", 3));

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpuI9, mbOld, ssd1));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(mbA, mbB, mbC)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        QuickFixRequest request = QuickFixRequest.builder()
                .currentItems(List.of(
                        BuildItemInput.builder().productId("cpu-i9").quantity(1).slotCode("CPU").build(),
                        BuildItemInput.builder().productId("mb-old").quantity(1).slotCode("MOTHERBOARD").build(),
                        BuildItemInput.builder().productId("ssd-1").quantity(2).slotCode("SSD_M2").build()
                ))
                .violationRuleId(RULE_SOCKET)
                .limitPerStrategy(3)
                .build();

        QuickFixResponse response = quickFixService.suggestFixes(request);

        assertEquals(1, response.getStrategies().size());
        List<QuickFixOptionDTO> options = response.getStrategies().get(0).getOptions();
        assertEquals(3, options.size());

        // C (0 warn, +500k, 95pts) -> B (0 warn, +500k, 80pts) -> A (1 warn, +100k, 92pts)
        assertEquals("mb-c", options.get(0).getProduct().getProductId());
        assertEquals(SlotStatusLevel.COMPATIBLE, options.get(0).getResultingStatus());
        assertEquals(0, options.get(0).getRemainingWarningsCount());

        assertEquals("mb-b", options.get(1).getProduct().getProductId());
        assertEquals(0, options.get(1).getRemainingWarningsCount());

        assertEquals("mb-a", options.get(2).getProduct().getProductId());
        assertEquals(SlotStatusLevel.WARNING, options.get(2).getResultingStatus());
        assertEquals(1, options.get(2).getRemainingWarningsCount());
        assertEquals(100_000L, options.get(2).getPriceDelta());
    }

    @Test
    @DisplayName("TC-UC2-23: Candidate Picker compatible_only=true lọc bỏ GPU vượt max_gpu_length_mm và gắn badge tương thích")
    @SuppressWarnings("unchecked")
    void testCandidatePrecheckAndCompatibleOnlyFiltering() {
        mockRuleCache(List.of(gpuLengthRule()));

        Product pcCase = product("case-320", "Compact Case 320mm", "NZXT", "CASE", 2_190_000, 10, 78.0,
                Map.of("max_gpu_length_mm", 320, "supported_form_factors", List.of("ATX", "Micro-ATX")));

        Product gpuTooLong = product("gpu-357", "RTX 4090 Strix (357mm)", "ASUS", "GPU", 52_990_000, 4, 99.0,
                Map.of("length_mm", 357, "vram_gb", 24, "tdp_w", 450));
        Product gpuShort = product("gpu-267", "RTX 4060 Dual (267mm)", "ASUS", "GPU", 7_990_000, 15, 80.0,
                Map.of("length_mm", 267, "vram_gb", 8, "tdp_w", 115));
        Product gpuExact = product("gpu-320", "RTX 4070 Ti Slim (320mm)", "MSI", "GPU", 24_490_000, 8, 92.0,
                Map.of("length_mm", 320, "vram_gb", 16, "tdp_w", 285));

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(pcCase));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(gpuTooLong, gpuShort, gpuExact)));

        // 1. compatible_only = true -> filters out gpu-357
        SlotCandidateSearchRequest compatibleOnlyReq = SlotCandidateSearchRequest.builder()
                .currentItems(List.of(
                        BuildItemInput.builder().productId("case-320").quantity(1).slotCode("CASE").build()
                ))
                .compatibleOnly(true)
                .evaluateCompatibility(true)
                .page(0)
                .size(12)
                .build();

        PageResponse<CandidateProductDTO> filteredPage = candidateService.findCandidates("GPU", compatibleOnlyReq);

        assertEquals(2, filteredPage.getContent().size());
        assertEquals(2L, filteredPage.getTotalElements());
        assertEquals(1, filteredPage.getTotalPages());
        assertTrue(filteredPage.getContent().stream().noneMatch(c -> "gpu-357".equals(c.getProduct().getProductId())));
        for (CandidateProductDTO dto : filteredPage.getContent()) {
            assertEquals(SlotStatusLevel.COMPATIBLE, dto.getCompatStatus());
            assertTrue(dto.getBlockingErrors().isEmpty());
        }

        // Verify MAX_PREFILTER_SCAN = 120 was used
        ArgumentCaptor<Pageable> scanPageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).findAll(any(Specification.class), scanPageableCaptor.capture());
        assertEquals(PCBuilderCandidateService.MAX_PREFILTER_SCAN, scanPageableCaptor.getValue().getPageSize());

        // 2. evaluate_compatibility = true, compatible_only = false -> keeps all 3 and attaches ERROR badge to gpu-357
        SlotCandidateSearchRequest evalAllReq = SlotCandidateSearchRequest.builder()
                .currentItems(List.of(
                        BuildItemInput.builder().productId("case-320").quantity(1).slotCode("CASE").build()
                ))
                .compatibleOnly(false)
                .evaluateCompatibility(true)
                .page(0)
                .size(12)
                .build();

        PageResponse<CandidateProductDTO> annotatedPage = candidateService.findCandidates("GPU", evalAllReq);
        assertEquals(3, annotatedPage.getContent().size());

        CandidateProductDTO longDto = annotatedPage.getContent().stream()
                .filter(c -> "gpu-357".equals(c.getProduct().getProductId()))
                .findFirst()
                .orElseThrow();
        assertEquals(SlotStatusLevel.ERROR, longDto.getCompatStatus());
        assertFalse(longDto.getBlockingErrors().isEmpty());
        assertTrue(longDto.getCompatSummary().contains("357"));
    }

    @Test
    @DisplayName("QuickFix hỗ trợ luật PSU tổng công suất (_total_tdp_w <= rated_wattage_w) khi source_product=null")
    @SuppressWarnings("unchecked")
    void testSingleSidedPsuTdpQuickFixAndPreferredSlot() {
        mockRuleCache(List.of(psuTdpWarningRule()));

        Product cpu = product("cpu-high", "Intel Core i9", "INTEL", "CPU", 14_000_000, 10, 98.0,
                Map.of("tdp_w", 250));
        Product gpu = product("gpu-high", "RTX 4090", "ASUS", "GPU", 50_000_000, 5, 99.0,
                Map.of("tdp_w", 450));
        // Total TDP = 250 + 450 + 50 (base) = 750W -> exceeds 650W PSU
        Product psu650 = product("psu-650", "Corsair CV650", "CORSAIR", "PSU", 1_490_000, 20, 74.0,
                Map.of("rated_wattage_w", 650));

        Product psu550 = product("psu-550", "PSU 550W", "CORSAIR", "PSU", 1_190_000, 10, 70.0,
                Map.of("rated_wattage_w", 550));
        Product psu850 = product("psu-850", "Corsair RM850e", "CORSAIR", "PSU", 3_390_000, 15, 88.0,
                Map.of("rated_wattage_w", 850));

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, gpu, psu650));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(psu550, psu850)));

        QuickFixRequest request = QuickFixRequest.builder()
                .currentItems(List.of(
                        BuildItemInput.builder().productId("cpu-high").quantity(1).slotCode("CPU").build(),
                        BuildItemInput.builder().productId("gpu-high").quantity(1).slotCode("GPU").build(),
                        BuildItemInput.builder().productId("psu-650").quantity(1).slotCode("PSU").build()
                ))
                .violationRuleId(RULE_PSU_TDP)
                .targetProductId("psu-650")
                .build();

        QuickFixResponse response = quickFixService.suggestFixes(request);

        assertEquals(1, response.getStrategies().size());
        QuickFixStrategyGroupDTO psuStrategy = response.getStrategies().get(0);
        assertEquals("PSU", psuStrategy.getReplaceSlot());
        assertEquals(1, psuStrategy.getOptions().size());
        assertEquals("psu-850", psuStrategy.getOptions().get(0).getProduct().getProductId());
        assertEquals(1_900_000L, psuStrategy.getOptions().get(0).getPriceDelta());
        assertEquals(SlotStatusLevel.COMPATIBLE, psuStrategy.getOptions().get(0).getResultingStatus());
    }

    @Test
    @DisplayName("QuickFix từ chối preferred_replace_slot không hợp lệ với BUILDER_INVALID_SLOT (400)")
    void testRejectInvalidPreferredReplaceSlot() {
        QuickFixRequest request = QuickFixRequest.builder()
                .currentItems(List.of(
                        BuildItemInput.builder().productId("cpu-1").quantity(1).slotCode("CPU").build()
                ))
                .violationRuleId(RULE_SOCKET)
                .preferredReplaceSlot("INVALID_SLOT")
                .build();

        BusinessException ex = assertThrows(BusinessException.class, () -> quickFixService.suggestFixes(request));
        assertEquals(ErrorCode.BUILDER_INVALID_SLOT.getCode(), ex.getErrorCode());
        assertEquals(400, ex.getHttpStatus().value());
    }

    private void mockRuleCache(List<CompatRule> rules) {
        Map<String, List<CompatRule>> byPair = new HashMap<>();
        for (CompatRule rule : rules) {
            String key = rule.getSourceCategory().toUpperCase() + ":" + rule.getTargetCategory().toUpperCase();
            byPair.computeIfAbsent(key, k -> new ArrayList<>()).add(rule);
        }
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(new PreIndexedRuleCache(byPair, rules));
    }

    private Product product(
            String id,
            String name,
            String brand,
            String categoryCode,
            int price,
            int stock,
            double benchmark,
            Map<String, Object> specs
    ) {
        return Product.builder()
                .productId(id)
                .name(name)
                .brand(brand)
                .category(Category.builder().categoryCode(categoryCode).categoryName(categoryCode).build())
                .price(price)
                .stockQuantity(stock)
                .benchmarkScore(benchmark)
                .isActive(true)
                .deletedAt(null)
                .specs(specs)
                .build();
    }

    private CompatRule socketRule() {
        return CompatRule.builder()
                .ruleId(RULE_SOCKET)
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
    }

    private CompatRule ramTypeRule() {
        return CompatRule.builder()
                .ruleId(RULE_RAM_TYPE)
                .ruleName("RAM Type Compatibility")
                .sourceCategory("RAM")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("memory_type")
                .targetSpecKey("supported_memory_types")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Chuẩn RAM {source_value} không lắp vừa Mainboard (hỗ trợ: {target_value}).")
                .isActive(true)
                .priority(2)
                .build();
    }

    private CompatRule gpuLengthRule() {
        return CompatRule.builder()
                .ruleId(RULE_GPU_LENGTH)
                .ruleName("GPU Length vs Case")
                .sourceCategory("GPU")
                .targetCategory("CASE")
                .sourceSpecKey("length_mm")
                .targetSpecKey("max_gpu_length_mm")
                .operator(RuleOperator.LTE)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("Chiều dài Card đồ họa ({source_value} mm) vượt quá khoang lắp Case ({target_value} mm).")
                .isActive(true)
                .priority(5)
                .build();
    }

    private CompatRule psuTdpWarningRule() {
        return CompatRule.builder()
                .ruleId(RULE_PSU_TDP)
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
    }

    private CompatRule m2SlotsWarningRule() {
        return CompatRule.builder()
                .ruleId(RULE_M2_SLOTS)
                .ruleName("M.2 Slot Count")
                .sourceCategory("SSD_M2")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("_count")
                .targetSpecKey("m2_slots")
                .operator(RuleOperator.LTE)
                .severity(RuleSeverity.WARNING)
                .errorMessageTemplate("Số SSD M.2 ({source_value}) vượt quá số khe trên Mainboard ({target_value}).")
                .isActive(true)
                .priority(9)
                .build();
    }
}
