package com.smartpc.modules.ruleengine;

import com.smartpc.modules.product.entity.Category;
import com.smartpc.modules.product.entity.Product;
import com.smartpc.modules.product.repository.ProductRepository;
import com.smartpc.modules.ruleengine.calculator.AggregateCalculator;
import com.smartpc.modules.ruleengine.dto.CompatibilityResult;
import com.smartpc.modules.ruleengine.entity.CompatRule;
import com.smartpc.modules.ruleengine.evaluator.RuleEvaluator;
import com.smartpc.modules.ruleengine.model.PreIndexedRuleCache;
import com.smartpc.modules.ruleengine.model.ProductItemContext;
import com.smartpc.modules.ruleengine.model.RuleOperator;
import com.smartpc.modules.ruleengine.model.RuleSeverity;
import com.smartpc.modules.ruleengine.service.CompatibilityService;
import com.smartpc.modules.ruleengine.service.RuleCacheManager;
import com.smartpc.modules.ruleengine.strategy.EqualsOperatorStrategy;
import com.smartpc.modules.ruleengine.strategy.InOperatorStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ForkJoinPool;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompatibilityServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RuleCacheManager ruleCacheManager;

    private CompatibilityService compatibilityService;

    @BeforeEach
    void setUp() {
        AggregateCalculator aggregateCalculator = new AggregateCalculator();
        EqualsOperatorStrategy equalsStrategy = new EqualsOperatorStrategy();
        InOperatorStrategy inStrategy = new InOperatorStrategy(equalsStrategy);
        RuleEvaluator ruleEvaluator = new RuleEvaluator(List.of(equalsStrategy, inStrategy));

        compatibilityService = new CompatibilityService(
                productRepository,
                ruleCacheManager,
                aggregateCalculator,
                ruleEvaluator,
                ForkJoinPool.commonPool()
        );
    }

    @Test
    @DisplayName("TC-RE-01: Kiểm tra xung đột Socket CPU LGA1700 và Mainboard AM5 (Báo 1 ERROR)")
    void testSocketMismatchViolation() {
        // Prepare Rules
        CompatRule socketRule = CompatRule.builder()
                .ruleId("r-socket-01")
                .ruleName("CPU-Motherboard Socket Match")
                .sourceCategory("CPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("socket_type")
                .targetSpecKey("supported_sockets")
                .operator(RuleOperator.IN)
                .severity(RuleSeverity.ERROR)
                .errorMessageTemplate("CPU {source_name} (socket {source_value}) không tương thích với {target_name} (hỗ trợ: {target_value})")
                .isActive(true)
                .priority(1)
                .build();

        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("CPU:MOTHERBOARD", List.of(socketRule)),
                List.of(socketRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        // Prepare Mock Products
        Category cpuCat = Category.builder().categoryCode("CPU").build();
        Product cpu = Product.builder()
                .productId("p-cpu-01")
                .name("Intel Core i7-13700K")
                .category(cpuCat)
                .specs(Map.of("socket_type", "LGA1700", "tdp_w", 125))
                .build();

        Category mbCat = Category.builder().categoryCode("MOTHERBOARD").build();
        Product mb = Product.builder()
                .productId("p-mb-01")
                .name("ASUS ROG Crosshair X670E Hero")
                .category(mbCat)
                .specs(Map.of("supported_sockets", List.of("AM5")))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(cpu, mb));

        CompatibilityResult result = compatibilityService.checkCompatibility(
                List.of("p-cpu-01", "p-mb-01")
        );

        assertNotNull(result);
        assertFalse(result.isCompatible(), "Cấu hình lệch socket phải báo không tương thích (is_compatible = false)");
        assertEquals(1, result.getErrors().size(), "Phải có đúng 1 lỗi ERROR");

        CompatibilityResult.ViolationDetail error = result.getErrors().get(0);
        assertEquals("CPU-Motherboard Socket Match", error.getRuleName());
        assertEquals(RuleSeverity.ERROR, error.getSeverity());
        assertTrue(error.getMessage().contains("LGA1700"));
        assertTrue(error.getMessage().contains("AM5"));
        assertEquals("p-cpu-01", error.getSourceProduct().getId());
        assertEquals("p-mb-01", error.getTargetProduct().getId());
    }

    @Test
    @DisplayName("TC-RE-10: Null-Safety - Sản phẩm thiếu trường thông số trong specs không được ném NPE")
    void testNullSafetyWhenSpecsMissing() {
        CompatRule pcieRule = CompatRule.builder()
                .ruleId("r-pcie-01")
                .ruleName("PCIe Generation Check")
                .sourceCategory("GPU")
                .targetCategory("MOTHERBOARD")
                .sourceSpecKey("pcie_gen")
                .targetSpecKey("max_pcie_gen")
                .operator(RuleOperator.EQUALS)
                .severity(RuleSeverity.WARNING)
                .errorMessageTemplate("Phiên bản PCIe không khớp")
                .isActive(true)
                .priority(1)
                .build();

        PreIndexedRuleCache cache = new PreIndexedRuleCache(
                Map.of("GPU:MOTHERBOARD", List.of(pcieRule)),
                List.of(pcieRule)
        );
        when(ruleCacheManager.getPreIndexedRules()).thenReturn(cache);

        // GPU lacks pcie_gen field in specs
        Category gpuCat = Category.builder().categoryCode("GPU").build();
        Product gpuWithoutPcie = Product.builder()
                .productId("p-gpu-01")
                .name("Old GPU")
                .category(gpuCat)
                .specs(Map.of("length_mm", 240)) // missing pcie_gen
                .build();

        Category mbCat = Category.builder().categoryCode("MOTHERBOARD").build();
        Product mb = Product.builder()
                .productId("p-mb-02")
                .name("B760M Mainboard")
                .category(mbCat)
                .specs(Map.of("max_pcie_gen", 4.0))
                .build();

        when(productRepository.findAllActiveWithCategoryByIds(anyCollection()))
                .thenReturn(List.of(gpuWithoutPcie, mb));

        // Must not throw NullPointerException
        CompatibilityResult result = assertDoesNotThrow(
                () -> compatibilityService.checkCompatibility(List.of("p-gpu-01", "p-mb-02"))
        );

        assertNotNull(result);
        assertTrue(result.isCompatible(), "Thiếu spec tùy chọn phải an toàn bỏ qua và không chặn build");
        assertTrue(result.getErrors().isEmpty());
    }
}
